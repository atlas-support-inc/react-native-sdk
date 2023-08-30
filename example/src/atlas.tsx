import { createAtlasSupportSDK } from '@atlasinc/react-native-sdk';

export const appId = 'jbnpaijbo0';
export const user = {
  userId: '1e9322f7-fa86-400d-bf84-4cb64a981910',
  userHash: '5d88e73eeba85abf97aec8d390e9ab0e467bd7b212a2bcca1c3fbcaa8972ad01',
};

export const userSecond = {
  userId: '15c4666c-2def-45a9-825c-590b3d4c95df',
  userHash: 'bbf35a628677552491b17695c85986400736cafcdd80457e3534c34881b7f0c4',
};

export const userEmpty = {
  userId: '',
  userHash: '',
  userName: '',
  userEmail: '',
};

export const userInvalid = {
  userId: Math.random().toString(),
  userHash: Math.random().toString(),
};

const atlasSupportSDK = createAtlasSupportSDK({
  appId,
  ...user,
  onNewTicket: console.log.bind(console, 'onNewTicket (global)'),
  onError: console.error,
});

const { identify, AtlasSupportWidget, watchAtlasSupportStats } =
  atlasSupportSDK;

export { identify, AtlasSupportWidget, watchAtlasSupportStats };

export default atlasSupportSDK;
