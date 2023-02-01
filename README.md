# @atlasinc/react-native-sdk

Atlas customer support chat widget

## Installation

This module requires [react-native-webview](https://www.npmjs.com/package/react-native-webview) to be installed:

```sh
npm install @atlasinc/react-native-sdk react-native-webview
```

## Usage

```js
import React, { useState, useEffect, useContext } from 'react';
import { createAtlasSupportSDK } from '@atlasinc/react-native-sdk';

// For demo purpose, assume that user credentials are stored in the React context
import UserContext from './user-context';

// The APP_ID can be found on Atlas Company Settings page: https://app.getatlas.io/settings/company
const { identify, watchAtlasSupportStats, AtlasSupportWidget } = createAtlasSupportSDK('APP_ID');

function Component({ style }) {
  // User identification
  const { userId, userHash } = // Read more about Atlas authentication: https://help.getatlas.io/articles/620722-user-authentication
    useContext(UserContext);
  useEffect(() => {
    identify({ userId, userHash });
  }, [userId, userHash]);

  // Unread messages counter
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const unsubscribe = watchAtlasSupportStats(({ conversations }) => {
      // Counting amount of unread messages from each conversation
      const unreadTotal = conversations.reduce((total, c) => total + c.unread, 0);
      setUnread(unreadTotal);
    });
    return unsubscribe;
  }, []);

  // Using chat widget
  return (
    <View style={style}>
      <AtlasSupportWidget style={{ flex: 1 }} />
    </View>
  );
}
```

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
