import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import sdk, { user, userSecond } from './atlas';
import type { TAtlasSupportIdentity } from '@atlasinc/react-native-sdk';

const Stack = createNativeStackNavigator();

let currentUser: TAtlasSupportIdentity = user;

function HomeScreenOptions({ navigation }: any) {
  const [newMessages, setNewMessages] = React.useState(0);
  React.useEffect(
    () =>
      sdk.watchAtlasSupportStats((stats) => {
        const unreadTotal = stats.conversations.reduce(
          (total, c) => total + c.unread,
          0
        );
        setNewMessages(unreadTotal);
      }),
    []
  );

  return {
    headerRight: () => (
      <View
        style={[
          styles.helpButton,
          newMessages ? styles.helpButtonNotificationState : null,
        ]}
      >
        <Text
          style={[
            styles.helpButtonText,
            newMessages ? styles.helpButtonTextNotificationState : null,
          ]}
          onPress={() => navigation.navigate('Help')}
        >
          {newMessages || '?'}
        </Text>
      </View>
    ),
  };
}

function HomeScreen() {
  const [count, setCount] = React.useState(0);
  return (
    <View style={styles.homePage}>
      <TouchableOpacity
        style={styles.appButton}
        onPress={() => setCount((c) => c + 1)}
      >
        <Text style={styles.appButtonText}>{count} +</Text>
      </TouchableOpacity>
    </View>
  );
}

const toggleUsers = () => {
  currentUser === user
    ? sdk.identify((currentUser = userSecond))
    : sdk.identify((currentUser = user));
};

let lastCreatedTicketId: string | null = null;
const listenNewTicketCallback = (data: { ticketId: string }) => {
  console.log('onNewTicket (local)', data);
  lastCreatedTicketId = data.ticketId;
};

const updateFields = () => {
  if (lastCreatedTicketId) {
    sdk.updateAtlasCustomFields(lastCreatedTicketId, {
      'custom-value': 'value',
    });
  }
};

function HelpScreenOptions() {
  return {
    headerRight: () => (
      <View style={[styles.helpButton]}>
        <Text
          style={[styles.helpButtonText]}
          onPress={Math.random() ? updateFields : toggleUsers}
        >
          ↻
        </Text>
      </View>
    ),
  };
}

function HelpScreen() {
  return (
    <View style={styles.helpPage}>
      <sdk.AtlasSupportWidget
        style={styles.chat}
        onNewTicket={listenNewTicketCallback}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={HomeScreenOptions}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={HelpScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  homePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appButton: {
    paddingHorizontal: 50,
    paddingVertical: 10,
  },
  appButtonText: {
    fontSize: 40,
    color: '#00f',
  },
  helpPage: {
    flex: 1,
    alignItems: 'stretch',
  },
  chat: {
    flex: 1,
  },
  helpButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonNotificationState: {
    backgroundColor: '#f00',
  },
  helpButtonText: {
    color: '#00f',
    fontWeight: 'bold',
  },
  helpButtonTextNotificationState: {
    color: '#fff',
  },
});
