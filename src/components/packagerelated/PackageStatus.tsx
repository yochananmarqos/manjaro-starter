import {
  useToast,
  Tooltip,
  Button,
  ButtonGroup,
  IconButton,
} from '@chakra-ui/react';
import React, { useState, ReactNode } from 'react';
import { RiInstallLine, RiCheckLine } from 'react-icons/ri';
import { Command } from '@tauri-apps/api/shell';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { info, error } from 'tauri-plugin-log-api';
import { CloseIcon } from '@chakra-ui/icons';
import {
  packageState,
} from '../../stores/PackageStore';
import { connectionState } from '../../stores/ConnectionStore';
import { commandState } from '../../stores/CommandStore';

interface PackageStatusProps {
    isInstalled:boolean,
    catId:string,
    pkId:string,
    pkgName:string,
  }
const PackageStatus: React.FC<PackageStatusProps> = (props) => {
  const toast = useToast();
  const { t } = useTranslation();
  const isOnline = useRecoilValue(connectionState);
  const [commandHistory, setCommandHistory] = useRecoilState(commandState);
  const [packageSt, setPackageSt] = useRecoilState(packageState);
  const [isLoadingPackage, setIsLoadingPackage] = useState<Map<string, boolean>>(new Map());

  const packageInstallStatusControl = async (catId:string, pkId:string) => {
    const pack = packageSt.get(catId)?.packages.get(pkId);
    const pkName = pack?.pkg || '';
    const cmdVersion = new Command('version-control', ['-Q', pkName]);
    const cmdVersionResult = await cmdVersion.execute();
    if (cmdVersionResult.stdout) {
      const spStd = cmdVersionResult.stdout.split(' ')[1];
      const cat = packageSt.get(catId);
      if (pack) {
        pack.isInstalled = true;
        pack.installedVersion = spStd;
        cat?.packages.set(pkId, pack);
        if (cat) {
          setPackageSt(new Map(packageSt.set(catId, cat)));
        }
      }
    }
  };
  function showMsg(msg: string | ReactNode, pkName: string, isError: boolean) {
    toast({
      title: `${pkName}`,
      description: msg,
      status: isError ? 'error' : 'success',
      duration: 9000,
      isClosable: true,
      position: 'bottom-right',
    });
  }
  const cancelInstall = async (
    catId:string,
    pkId:string,
  ) => {
    const pack = packageSt.get(catId)?.packages.get(pkId);
    if (pack?.process) {
      pack.process.kill();
      setIsLoadingPackage(new Map(isLoadingPackage?.set(pkId, false)));
      packageInstallStatusControl(catId, pkId);
    }
  };
  const installPackageWithName = async (
    catId:string,
    pkId:string,
    pkgName:string,
  ) => {
    setIsLoadingPackage(new Map(isLoadingPackage?.set(pkId, true)));
    const cmd = new Command('pamac', [
      'install',
      '--no-confirm',
      '--no-upgrade',
      pkgName,
    ]);
    cmd.on('close', (data) => {
      info(`command finished with code ${data.code} and signal ${data.signal}`);
      if (isLoadingPackage.get(pkId)) {
        const isThereError = data.code === 1;
        showMsg(
          isThereError ? t('installError') : t('installSuccess'),
          pkgName,
          isThereError,
        );
        setIsLoadingPackage(new Map(isLoadingPackage?.set(pkId, false)));
      }
      packageInstallStatusControl(catId, pkId);
    });
    cmd.on('error', (error) => {
      error(error);
      setCommandHistory((prevCommand) => `${prevCommand}\n${error}`);
    });
    cmd.stdout.on('data', (line) => {
      info(`command stdout: "${line}"`);
      setCommandHistory((prevCommand) => `${prevCommand}\n${line}`);
    });
    cmd.stderr.on('data', (line) => {
      error(`command stderr: "${line}"`);
      setCommandHistory((prevCommand) => `${prevCommand}\n${line}`);
    });
    const child = await cmd.spawn();
    const pack = packageSt.get(catId)?.packages.get(pkId);
    const cat = packageSt.get(catId);
    if (pack) {
      pack.process = child;
      cat?.packages.set(pkId, pack);
      if (cat) {
        setPackageSt(new Map(packageSt.set(catId, cat)));
      }
    }
    info(`pid:${child.pid}`);
  };
  const {
    isInstalled, catId, pkId, pkgName,
  } = props;
  return (
    <div>
      {isInstalled ? (
        <Button
          flex="1"
          variant="ghost"
          aria-label="installed"
          disabled
          leftIcon={<RiCheckLine />}
          colorScheme="gray"
        >
          {t('installed')}
        </Button>
      ) : (
        <ButtonGroup size="sm" isAttached variant="ghost">
          <Tooltip label={t('install')}>
            <Button
              aria-label="install"
              flex="1"
              shadow="base"
              disabled={!isOnline || isLoadingPackage?.get(pkId)}
              variant="ghost"
              leftIcon={<RiInstallLine />}
              isLoading={isLoadingPackage?.get(pkId) || false}
              onClick={() => installPackageWithName(catId, pkId, pkgName)}
              colorScheme="green"
            >
              {t('install')}
            </Button>
          </Tooltip>
          {isLoadingPackage?.get(pkId) && (
            <IconButton
              aria-label="Cancel"
              icon={<CloseIcon />}
              onClick={() => cancelInstall(catId, pkId)}
            />
          )}
        </ButtonGroup>
      )}
    </div>
  );
};

export default PackageStatus;
