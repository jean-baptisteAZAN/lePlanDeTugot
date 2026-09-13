import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CenteredMessage } from '@/components/CenteredMessage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { PlacesProvider } from '@/features/places/PlacesProvider';
import { usePushSetup } from '@/features/push/usePushSetup';
import { UsersProvider } from '@/features/users/UsersProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <UsersProvider>
        <PlacesProvider>
          <RootNavigator />
        </PlacesProvider>
      </UsersProvider>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

function RootNavigator() {
  usePushSetup();
  const { user, initializing } = useAuth();

  if (initializing) {
    return <CenteredMessage loading text="" />;
  }

  const loggedIn = user !== null;

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={loggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="place/new"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'Nouveau lieu' }}
        />
        <Stack.Screen name="place/[id]" options={{ presentation: 'modal', title: 'Lieu' }} />
        <Stack.Screen
          name="place/random"
          dangerouslySingular
          options={{ presentation: 'modal', title: 'On fait quoi ce soir ?' }}
        />
      </Stack.Protected>
    </Stack>
  );
}
