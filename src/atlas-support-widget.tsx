import React from 'react';
import { View, ViewProps } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import type { TAtlasSupportAppSettings, TAtlasSupportIdentity } from '.';
import { ATLAS_WIDGET_BASE_URL } from './_config';

const buildWidgetUrl = (
  appId: string,
  atlasId?: string,
  userId?: string,
  userHash?: string,
  userName?: string,
  userEmail?: string
) => {
  const params = [
    ['appId', appId],
    ['atlasId', atlasId],
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
    atlasId,
    userId,
    userHash,
    userEmail,
    userName,
    onNewTicket,
    onChangeIdentity,
    onError,
    ...viewProps
  } = props;

  const webViewSource = React.useMemo(
    () => ({
      uri: buildWidgetUrl(
        appId,
        atlasId,
        userId,
        userHash,
        userName,
        userEmail
      ),
    }),
    [appId, atlasId, userId, userHash, userName, userEmail]
  );

  const errorCallbackRef = React.useRef(onError);
  errorCallbackRef.current = onError;

  const newTicketCallbackRef = React.useRef(onNewTicket);
  newTicketCallbackRef.current = onNewTicket;

  const changeIndetityCallbackRef = React.useRef(onChangeIdentity);
  changeIndetityCallbackRef.current = onChangeIdentity;

  const handleMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as TAtlasPacket;
        if (message.type === 'atlas:error') {
          errorCallbackRef.current?.(
            `AtlasSupportWidget: ${message.errorMessage}`
          );
        } else if (message.type === 'atlas:newTicket') {
          newTicketCallbackRef.current?.({ ticketId: message.ticketId });
        } else if (message.type === 'atlas:changeIdentity') {
          changeIndetityCallbackRef.current?.({ atlasId: message.atlasId });
        }
      } catch (error) {
        errorCallbackRef.current?.(
          `AtlasSupportWidget: ${event.nativeEvent.data}`
        );
      }
    },
    [errorCallbackRef]
  );

  return (
    <View {...viewProps}>
      <WebView
        source={webViewSource}
        javaScriptEnabled
        domStorageEnabled
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
    }
  | {
      type: 'atlas:changeIdentity';
      atlasId: string;
    };

export type TAtlasSupportWidgetProps = ViewProps &
  TAtlasSupportAppSettings &
  TAtlasSupportIdentity & {
    atlasId?: string;
    onNewTicket?: (data: { ticketId: string }) => void;
    onChangeIdentity?: (data: { atlasId: string }) => void;
    onError?: (error: unknown) => void;
  };
