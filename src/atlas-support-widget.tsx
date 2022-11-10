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
    ...viewProps
  } = props;

  const webViewSource = React.useMemo(
    () => ({
      uri: buildWidgetUrl(appId, userId, userHash, userName, userEmail),
    }),
    [appId, userId, userHash, userName, userEmail]
  );

  return (
    <View {...viewProps}>
      <WebView source={webViewSource} />
    </View>
  );
}

export type TAtlasSupportWidgetProps = ViewProps &
  AtlasSupportAppSettings &
  TAtlasSupportIdentity;
