import * as React from 'react';
import type { ViewProps } from 'react-native';
import { AtlasSupportWidget as Widget } from './atlas-support-widget';
import { watchAtlasSupportStats as watchStats } from './watch-atlas-support-stats';
import { updateAtlasCustomFields as updateCustomFields } from './update-atlas-custom-fields';
import type {
  TAtlasSupportListener,
  TAtlasSupportStats,
} from './watch-atlas-support-stats';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  updateIdentity,
  type TIdentityDetails,
  type TAccountFields,
  type TCustomerFields,
} from './_updateIdentity';

const asyncStorageAtlasIdKey = '@atlas.so/atlasId';

/**
 * Creates an instance of SDK that will share the same session
 *
 * @param {string} appId - Atlas App ID (https://app.atlas.so/settings/company)
 */
export function createAtlasSupportSDK(
  settings: TCreateAtlasSupportSDKProps
): TAtlasSupportSDK {
  // Flags to reset local storage at first render at the very beginning and after every identity change

  let userIdentity: TAtlasSupportIdentity = {
    atlasId: undefined,
    userId: settings.userId,
    userHash: settings.userHash,
    userName: settings.userName,
    userEmail: settings.userEmail,
    fields: settings.fields,
    customFields: settings.customFields,
    account: settings.account,
  };

  const listeners: Array<(identity: TAtlasSupportIdentity) => void> = [];

  /**
   * @returns {boolean} False if identity has not changed
   */
  function updateIdentityState(identity: TAtlasSupportIdentity): boolean {
    const hasChanges = (
      Object.keys(identity) as Array<keyof typeof identity>
    ).some((key) => identity[key] !== userIdentity[key]);
    if (!hasChanges) return false;

    userIdentity = Object.assign({}, identity);
    listeners.forEach((listener) => listener(userIdentity));
    return true;
  }

  function identify(identity: TAtlasSupportIdentity) {
    if (!updateIdentityState(identity)) return;

    if (identity.userId || identity.atlasId) {
      updateIdentity({
        ...identity,
        appId: settings.appId,
      } as TIdentityDetails);
    }
  }

  if (userIdentity.userId) {
    identify(userIdentity);
  } else {
    AsyncStorage.getItem(asyncStorageAtlasIdKey).then((atlasId) => {
      if (userIdentity.userId) return;
      identify({ ...userIdentity, atlasId: atlasId ?? undefined });
    });
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

    const { onError, onNewTicket, onChangeIdentity } = props;

    const handleError = React.useCallback(
      (error: unknown) => {
        onError?.(error);
        settings.onError?.(error);
      },
      [onError]
    );

    const handleNewTicket = React.useCallback(
      (data: { ticketId: string }) => {
        onNewTicket?.(data);
        settings.onNewTicket?.(data);
      },
      [onNewTicket]
    );

    const handleChangeIdentity = React.useCallback(
      (newIdentity: { atlasId: string }) => {
        if (!updateIdentityState(newIdentity)) return;

        AsyncStorage.setItem(asyncStorageAtlasIdKey, newIdentity.atlasId);
        onChangeIdentity?.(newIdentity);
        settings.onChangeIdentity?.(newIdentity);
      },
      [onChangeIdentity]
    );

    return (
      <Widget
        {...props}
        appId={settings.appId}
        atlasId={identity.atlasId}
        userId={identity.userId}
        userHash={identity.userHash}
        userName={identity.userName}
        userEmail={identity.userEmail}
        onNewTicket={handleNewTicket}
        onChangeIdentity={handleChangeIdentity}
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
    if (!userIdentity.atlasId) {
      return Promise.reject('Session is not initialized');
    }

    return updateCustomFields(
      userIdentity.atlasId,
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
  onNewTicket?: (data: { ticketId: string }) => void;
  onChangeIdentity?: (data: { atlasId: string }) => void;
  onError?: (error: unknown) => void;
} & Partial<Omit<TAtlasSupportIdentity, 'atlasId'>>;

export type TSDKAtlasSupportWidgetProps = ViewProps & {
  onNewTicket?: (data: { ticketId: string }) => void;
  onChangeIdentity?: (data: { atlasId: string }) => void;
  onError?: (error: unknown) => void;
};

export type TAtlasSupportAppSettings = {
  appId: string;
};

export type TAtlasSupportIdentity = {
  atlasId?: string;
  userId?: string;
  userHash?: string;
  userName?: string;
  userEmail?: string;
  customFields?: TCustomerFields;
  fields?: Partial<TCustomerFields>;
  account?: Partial<TAccountFields>;
};

export type {
  TAtlasSupportListener,
  TAtlasSupportStats,
} from './watch-atlas-support-stats';

export type TAtlasSupportSDK = {
  identify: (identity: Omit<TAtlasSupportIdentity, 'atlasId'>) => void;
  AtlasSupportWidget: (props: TSDKAtlasSupportWidgetProps) => JSX.Element;
  watchAtlasSupportStats: (listener: TAtlasSupportListener) => () => void;
  updateAtlasCustomFields: (
    ticketId: string,
    customFields: Record<string, any>
  ) => Promise<void>;
};
