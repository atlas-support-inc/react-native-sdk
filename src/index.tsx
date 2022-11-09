import * as React from 'react';
import { View, ViewProps } from 'react-native';
import { WebView } from 'react-native-webview';
import { ATLAS_WIDGET_BASE_URL } from './config';

const buildWidgetUrl = (
  appId: string,
  userId: string,
  userHash: string,
  userName: string,
  userEmail: string
) =>
  `${ATLAS_WIDGET_BASE_URL}?appId=${appId}&userId=${userId}&userHash=${userHash}&userName=${userName}&userEmail=${userEmail}`;

export function AtlasSupportWidget(props: AtlasSupportWidgetProps) {
  const {
    appId,
    userId = '',
    userHash = '',
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

const Widget = AtlasSupportWidget;

export function watchAtlasSupportStats(
  appId: string,
  identity: AtlasSupportIdentity,
  listener: (stats: AtlasSupportStats) => void
) {
  let timeout: NodeJS.Timeout;
  const scheduleChange = () => {
    timeout = setTimeout(() => {
      const rand = Math.floor(Math.random() * 10);
      listener({
        conversations: [
          {
            id: '1',
            closed: false,
            unread: rand > 4 ? 0 : rand,
          },
        ],
      });
      scheduleChange();
    }, Math.random() * 10e3);
  };
  scheduleChange();
  return () => clearTimeout(timeout);
}

const watch = watchAtlasSupportStats;

/**
 * Creates an instance of SDK that will share the same session
 *
 * @param {string} appId - Atlas App ID (https://app.getatlas.io/settings/company)
 */
export function createAtlasSupportSDK(appId: string): AtlasSupportSDK {
  const userIdentity: Required<AtlasSupportIdentity> = {
    userId: '',
    userHash: '',
    userName: '',
    userEmail: '',
  };

  const listeners: Array<(identity: Required<AtlasSupportIdentity>) => void> =
    [];

  function identify(identity: AtlasSupportIdentity) {
    const newIdentity = Object.assign(
      userIdentity,
      { userId: '', userHash: '', userName: '', userEmail: '' },
      identity
    );
    listeners.forEach((listener) => listener(newIdentity));
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const AtlasSupportWidget = React.memo(function AtlasSupportWidget(
    props: ViewProps
  ): JSX.Element {
    const [identity, setIdentity] = React.useState(userIdentity);

    React.useEffect(() => {
      listeners.push(setIdentity);
      return () => {
        listeners.splice(listeners.indexOf(setIdentity), 1);
      };
    }, []);

    return (
      <Widget
        {...props}
        appId={appId}
        userId={identity.userId}
        userHash={identity.userHash}
        userName={identity.userName}
        userEmail={identity.userEmail}
      />
    );
  }) as unknown as () => JSX.Element;

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function watchAtlasSupportStats(
    listener: (stats: AtlasSupportStats) => void
  ) {
    // TODO: Reset value when identity is changed
    return watch(appId, userIdentity, listener);
  }

  return { identify, AtlasSupportWidget, watchAtlasSupportStats };
}

export type AtlasSupportAppSettings = {
  appId: string;
};

export type AtlasSupportIdentity = (
  | {
      userId?: undefined;
      userHash?: undefined;
    }
  | {
      userId?: string;
      userHash?: string;
    }
) & {
  userName?: string;
  userEmail?: string;
};

export type AtlasSupportWidgetProps = ViewProps &
  AtlasSupportAppSettings &
  AtlasSupportIdentity;

export type AtlasSupportStats = {
  conversations: Array<{ id: string; closed: boolean; unread: number }>;
};

export type AtlasSupportListener = (stats: AtlasSupportStats) => void;

export type AtlasSupportSDK = {
  identify: (identity: AtlasSupportIdentity) => void;
  AtlasSupportWidget: (props: ViewProps) => JSX.Element;
  watchAtlasSupportStats: (listener: AtlasSupportListener) => () => void;
};
