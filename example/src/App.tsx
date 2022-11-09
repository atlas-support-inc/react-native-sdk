import * as React from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AtlasSupportWidget, watchAtlasSupportStats } from './atlas';

const Stack = createNativeStackNavigator();

function HomeScreenOptions({ navigation }: any) {
  const [newMessages, setNewMessages] = React.useState(0);
  React.useEffect(
    () =>
      watchAtlasSupportStats((stats) => {
        const unread = stats.conversations.filter((c) => c.unread > 0);
        if (!unread.length) return;
        if (unread.length > 1) setNewMessages(unread.length);
        else setNewMessages(unread[0]?.unread || 0);
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

function HelpScreen() {
  return (
    <View style={styles.helpPage}>
      <AtlasSupportWidget style={styles.chat} />
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
        <Stack.Screen name="Help" component={HelpScreen} />
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
