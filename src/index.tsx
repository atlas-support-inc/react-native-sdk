import * as React from 'react';
import type { ViewProps } from 'react-native';
import { AtlasSupportWidget as Widget } from './atlas-support-widget';
import { watchAtlasSupportStats as watchStats } from './watch-atlas-support-stats';
import type {
  TAtlasSupportListener,
  TAtlasSupportStats,
} from './watch-atlas-support-stats';

/**
 * Creates an instance of SDK that will share the same session
 *
 * @param {string} appId - Atlas App ID (https://app.getatlas.io/settings/company)
 */
export function createAtlasSupportSDK(appId: string): TAtlasSupportSDK {
  const userIdentity: TAtlasSupportIdentity = {
    userId: '',
    userHash: '',
    userName: '',
    userEmail: '',
  };

  const listeners: Array<(identity: Required<TAtlasSupportIdentity>) => void> =
    [];

  function identify(identity: TAtlasSupportIdentity) {
    const newIdentity = Object.assign(
      userIdentity,
      { userId: '', userHash: '', userName: '', userEmail: '' },
      identity
    );
    listeners.forEach((listener) => listener(newIdentity));
  }

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

  function watchAtlasSupportStats(
    listener: (stats: TAtlasSupportStats) => void
  ) {
    let close = watchStats(appId, userIdentity, listener);
    const restart = (newIdentity: TAtlasSupportIdentity) => {
      close();
      listener({ conversations: [] });
      close = watchStats(appId, newIdentity, listener);
    };
    listeners.push(restart);
    return () => {
      close();
      listeners.splice(listeners.indexOf(restart), 1);
    };
  }

  return { identify, AtlasSupportWidget, watchAtlasSupportStats };
}

export type AtlasSupportAppSettings = {
  appId: string;
};

export type TAtlasSupportIdentity = {
  userId: string;
  userHash: string;
  userName?: string;
  userEmail?: string;
};

export type {
  TAtlasSupportListener,
  TAtlasSupportStats,
} from './watch-atlas-support-stats';

export type TAtlasSupportSDK = {
  identify: (identity: TAtlasSupportIdentity) => void;
  AtlasSupportWidget: (props: ViewProps) => JSX.Element;
  watchAtlasSupportStats: (listener: TAtlasSupportListener) => () => void;
};
