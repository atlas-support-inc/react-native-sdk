import React from 'react';
import { View, ViewProps } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import type { TAtlasSupportAppSettings, TAtlasSupportIdentity } from '.';
import { ATLAS_WIDGET_BASE_URL } from './_config';

const clearAtlasStateScript = (appId: string) => `((doc, ls, ss) => {
  ["atlasLocation", "atlasIdentity"].forEach(ls.removeItem.bind(ls));
  Object.keys(sessionStorage).filter(key => ~key.indexOf('atlas-')).forEach(ss.removeItem.bind(ss));
  ["atlasIdentity", "atlasIdentity${appId}"].forEach((key) => {
    const assign = key + '=;';
    const expires = 'expires=' + new Date(0).toUTCString() + ';';
    const path = 'path=/;';
    const domain =
        'domain=' + (doc.domain.match(/[^.]*\\.[^.]*$/) || [''])[0] + ';';
    doc.cookie = assign + expires + path + domain;
  });
})(window.document, window.localStorage, window.sessionStorage)`;

const buildWidgetUrl = (
  appId: string,
  userId: string,
  userHash?: string,
  userName?: string,
  userEmail?: string
) => {
  const params = [
    ['appId', appId],
    ['userId', userId],
    ['userHash', userHash],
    ['userName', userName],
    ['userEmail', userEmail],
  ]
    .filter(
      (param): param is [string, string] => typeof param[1] !== 'undefined'
    )
    .map(
      ([key, value]) =>
        encodeURIComponent(key) + '=' + encodeURIComponent(value)
    )
    .join('&');
  return `${ATLAS_WIDGET_BASE_URL}?${params}`;
};

export function AtlasSupportWidget(props: TAtlasSupportWidgetProps) {
  const {
    appId,
    userId,
    userHash,
    userEmail,
    userName,
    resetStorage = false,
    onNewTicket,
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

  const newTicketCallbackRef = React.useRef(onNewTicket);
  newTicketCallbackRef.current = onNewTicket;

  const handleMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as TAtlasPacket;
        if (message.type === 'atlas:error') {
          errorCallbackRef.current?.(
            `AtlasSupportWidget: ${message.errorMessage}`
          );
        } else if (message.type === 'atlas:newTicket') {
          newTicketCallbackRef.current?.(message.ticketId);
        }
      } catch (error) {
        errorCallbackRef.current?.(
          `AtlasSupportWidget: ${event.nativeEvent.data}`
        );
      }
    },
    [errorCallbackRef]
  );

  const resetStorageScript = resetStorage
    ? clearAtlasStateScript(appId)
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

type TAtlasPacket =
  | {
      type: 'atlas:error';
      errorMessage: string;
    }
  | {
      type: 'atlas:newTicket';
      ticketId: string;
    };

export type TAtlasSupportWidgetProps = ViewProps &
  TAtlasSupportAppSettings &
  TAtlasSupportIdentity & {
    resetStorage?: boolean;
    onNewTicket?: (ticketId: string) => void;
    onError?: (error: unknown) => void;
  };
