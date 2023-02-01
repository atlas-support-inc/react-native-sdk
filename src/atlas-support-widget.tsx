import React from 'react';
import { View, ViewProps } from 'react-native';
import WebView from 'react-native-webview';
import type { AtlasSupportAppSettings, TAtlasSupportIdentity } from '.';
import { ATLAS_WIDGET_BASE_URL } from './_config';

const buildWidgetUrl = (
  appId: string,
  userId: string,
  userHash: string,
  userName: string,
  userEmail: string
) => {
  const params = new URLSearchParams({
    appId,
    userId,
    userHash,
    userName,
    userEmail,
  });
  return `${ATLAS_WIDGET_BASE_URL}?${params}`;
};

export function AtlasSupportWidget(props: TAtlasSupportWidgetProps) {
  const {
    appId,
    userId,
    userHash,
    userEmail = '',
    userName = '',
    resetStorage = false,
    ...viewProps
  } = props;

  const webViewSource = React.useMemo(
    () => ({
      uri: buildWidgetUrl(appId, userId, userHash, userName, userEmail),
    }),
    [appId, userId, userHash, userName, userEmail]
  );

  const resetStorageScript = resetStorage
    ? '(() => window.localStorage.clear())()'
    : undefined;

  return (
    <View {...viewProps}>
      <WebView
        source={webViewSource}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={resetStorageScript}
      />
    </View>
  );
}

export type TAtlasSupportWidgetProps = ViewProps &
  AtlasSupportAppSettings &
  TAtlasSupportIdentity & { resetStorage?: boolean };
