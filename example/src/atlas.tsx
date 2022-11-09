import { createAtlasSupportSDK } from '@atlasinc/react-native-sdk';

const atlasSupportSDK = createAtlasSupportSDK('jbnpaijbo0');

const { identify, AtlasSupportWidget, watchAtlasSupportStats } =
  atlasSupportSDK;

export { identify, AtlasSupportWidget, watchAtlasSupportStats };
