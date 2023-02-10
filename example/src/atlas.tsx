import { createAtlasSupportSDK } from '@atlasinc/react-native-sdk';

const appId = '';
const userId = '';
const userHash = '';

const atlasSupportSDK = createAtlasSupportSDK({
  appId,
  userId,
  userHash,
  onError: console.error,
});

const { identify, AtlasSupportWidget, watchAtlasSupportStats } =
  atlasSupportSDK;

export { identify, AtlasSupportWidget, watchAtlasSupportStats };
