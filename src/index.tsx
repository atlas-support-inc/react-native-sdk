import * as React from 'react';
import type { ViewProps } from 'react-native';
import { AtlasSupportWidget as Widget } from './atlas-support-widget';
import { watchAtlasSupportStats as watchStats } from './watch-atlas-support-stats';
import { updateAtlasCustomFields as updateCustomFields } from './update-atlas-custom-fields';
import type {
  TAtlasSupportListener,
  TAtlasSupportStats,
} from './watch-atlas-support-stats';

/**
 * Creates an instance of SDK that will share the same session
 *
 * @param {string} appId - Atlas App ID (https://app.getatlas.io/settings/company)
 */
export function createAtlasSupportSDK(
  settings: TCreateAtlasSupportSDKProps
): TAtlasSupportSDK {
  // Flags to reset local storage at first render at the very beginning and after every identity change
  let requireStorageReset = true;

  let userIdentity: TAtlasSupportIdentity = {
    userId: settings.userId || '',
    userHash: settings.userHash,
    userName: settings.userName,
    userEmail: settings.userEmail,
  };

  const listeners: Array<(identity: TAtlasSupportIdentity) => void> = [];

  function identify(identity: TAtlasSupportIdentity) {
    const newIdentity = Object.assign({}, identity);
    userIdentity = newIdentity;
    requireStorageReset = true;
    listeners.forEach((listener) => listener(newIdentity));
  }

  const AtlasSupportWidget = React.memo(function AtlasSupportWidget(
    props: TSDKAtlasSupportWidgetProps
  ): JSX.Element {
    const [identity, setIdentity] = React.useState(userIdentity);

    React.useEffect(() => {
      listeners.push(setIdentity);
      return () => {
        listeners.splice(listeners.indexOf(setIdentity), 1);
      };
    }, []);

    const resetStorage = requireStorageReset;
    if (resetStorage) requireStorageReset = false;

    const { onError } = props;

    const handleError = React.useCallback(
      (error: unknown) => {
        onError?.(error);
        settings.onError?.(error);
      },
      [onError]
    );

    return (
      <Widget
        {...props}
        appId={settings.appId}
        userId={identity.userId}
        userHash={identity.userHash}
        userName={identity.userName}
        userEmail={identity.userEmail}
        resetStorage={resetStorage}
        onError={handleError}
      />
    );
  }) as unknown as () => JSX.Element;

  function watchAtlasSupportStats(
    listener: (stats: TAtlasSupportStats) => void,
    options?: { onError?: (error: unknown) => void }
  ) {
    const handleError = (error: unknown) => {
      options?.onError?.(error);
      settings.onError?.(error);
    };

    let close = watchStats(settings.appId, userIdentity, listener, handleError);
    const restart = (newIdentity: TAtlasSupportIdentity) => {
      close();
      listener({ conversations: [] });
      close = watchStats(settings.appId, newIdentity, listener, handleError);
    };
    listeners.push(restart);

    return () => {
      close();
      listeners.splice(listeners.indexOf(restart), 1);
    };
  }

  function updateAtlasCustomFields(
    ticketId: string,
    customFields: Record<string, any>
  ) {
    return updateCustomFields(
      settings.appId,
      ticketId,
      customFields,
      userIdentity.userHash
    );
  }

  return {
    identify,
    AtlasSupportWidget,
    watchAtlasSupportStats,
    updateAtlasCustomFields,
  };
}

export type TCreateAtlasSupportSDKProps = {
  appId: string;
  onError?: (error: unknown) => void;
} & Partial<TAtlasSupportIdentity>;

export type TSDKAtlasSupportWidgetProps = ViewProps & {
  onError?: (error: unknown) => void;
};

export type TAtlasSupportAppSettings = {
  appId: string;
};

export type TAtlasSupportIdentity = {
  userId: string;
  userHash?: string;
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
  updateAtlasCustomFields: (
    ticketId: string,
    customFields: Record<string, any>
  ) => Promise<void>;
};
