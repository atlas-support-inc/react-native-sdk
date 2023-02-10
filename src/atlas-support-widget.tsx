import React from 'react';
import { View, ViewProps } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import type { TAtlasSupportAppSettings, TAtlasSupportIdentity } from '.';
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
    onError,
    ...viewProps
  } = props;

  const webViewSource = React.useMemo(
    () => ({
      uri: buildWidgetUrl(appId, userId, userHash, userName, userEmail),
    }),
    [appId, userId, userHash, userName, userEmail]
  );

  const errorCallbackRef = React.useRef(onError);
  errorCallbackRef.current = onError;

  const handleMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as {
          type: 'atlas:error';
          errorMessage: string;
        };
        if (message.type === 'atlas:error') {
          errorCallbackRef.current?.(`WidgetError: ${message.errorMessage}`);
        }
      } catch (error) {}
    },
    [errorCallbackRef]
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
        onMessage={handleMessage}
      />
    </View>
  );
}

export type TAtlasSupportWidgetProps = ViewProps &
  TAtlasSupportAppSettings &
  TAtlasSupportIdentity & {
    resetStorage?: boolean;
    onError?: (error: unknown) => void;
  };
