import {
  Button,
  Stat,
  Flex,
  Box,
  StatLabel,
  Image,
  Center,
  Text,
  useColorModeValue,
  StatNumber,
  HStack,
} from '@chakra-ui/react';
import {
  SiGit, SiMonkeytie,
} from 'react-icons/si';
import { open } from '@tauri-apps/api/shell';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/icon.png';
import packageJson from '../../../package.json';
import Changelog from './Changelog';

const AboutComponent = (): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py="5"
      mt={10}
      shadow="xl"
      border="1px solid"
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded="lg"
    >
      <Flex justifyContent="space-between">
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight="medium">{t('manjaroStarter')}</StatLabel>
          <HStack>
            <StatNumber fontSize="2xl" fontWeight="medium">
              {packageJson.version}
            </StatNumber>
            <Changelog />
          </HStack>
        </Box>
        <Box
          my="auto"
          color={useColorModeValue('gray.800', 'gray.200')}
          alignContent="center"
        >
          <Image borderRadius="full" boxSize="45px" src={logo} />
        </Box>
      </Flex>
      <Button
        mt={5}
        mr={5}
        onClick={async () => {
          await open('https://github.com/oguzkaganeren/manjaro-starter');
        }}
        leftIcon={<SiGit />}
      >
        <Center>
          <Text>{t('projectGithubPage')}</Text>
        </Center>
      </Button>
      <Button
        mt={5}
        mr={5}
        onClick={async () => {
          await open(
            'https://github.com/oguzkaganeren/manjaro-starter/blob/master/LICENSE.md',
          );
        }}
        leftIcon={<SiMonkeytie />}
      >
        <Center>
          <Text>{t('gnu')}</Text>
        </Center>
      </Button>
    </Stat>
  );
};

export default AboutComponent;
