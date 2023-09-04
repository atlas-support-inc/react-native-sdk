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
const {
  // Authentication method
  identify,
  // Realtime updates on conversations status
  watchAtlasSupportStats,
  // Manually set custom ticket fields
  updateAtlasCustomFields,
  // Chat widget
  AtlasSupportWidget
} = createAtlasSupportSDK({
  // Application ID can be found at https://app.getatlas.io/settings/company
  appId: 'APP_ID',
  // Optional user data that can be set later via identify() function
  userId: '',
  userHash: '',
  userName: '',
  userEmail: '',
  // Optional error callback
  onError: (error) => console.error(error)
});

function Component() {
  // User identification
  const user = useContext(UserContext);
  useEffect(() => {
    // Read more about Atlas authentication: https://help.getatlas.io/articles/620722-user-authentication
    identify({
      userId: user.id,
      userHash: user.atlasHash,
      userName: user.fullName,
      userEmail: user.email
    });
  }, [user]);

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
    <View>
      <AtlasSupportWidget
        style={{ flex: 1 }}
        onNewTicket={(data) => updateAtlasCustomFields(data.ticketId, { customTicketField: 'value' })}
      />
    </View>
  );
}
```

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
