import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useCities } from '@/features/cities/CitiesProvider';
import { useIntro } from '@/features/intro/IntroProvider';
import { registerForPushToken } from '@/features/push/register';
import { setPushToken } from '@/features/users/api';

export function usePushSetup(): void {
  const { user } = useAuth();
  const { seen } = useIntro();
  const { ready } = useCities();
  const uid = user?.uid ?? null;
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!uid) return;
    registerForPushToken()
      .then((token) => (token ? setPushToken(uid, token) : undefined))
      .catch((error: unknown) => console.warn('Push registration failed', error));
  }, [uid]);

  useEffect(() => {
    if (!uid || seen !== true || !ready || !lastResponse) return;
    const placeId = lastResponse.notification.request.content.data?.placeId;
    Notifications.clearLastNotificationResponse();
    if (typeof placeId === 'string') {
      router.push({ pathname: '/place/[id]', params: { id: placeId } });
    }
  }, [uid, seen, ready, lastResponse]);
}
