import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Alert, Pressable } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing } from '@/theme';

export default function TabsLayout() {
  const { signOut } = useAuth();

  function confirmSignOut() {
    Alert.alert('Déconnexion', 'Tu veux te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerLeft: () => (
          <Pressable
            onPress={() => router.push('/place/random')}
            hitSlop={8}
            style={{ marginLeft: spacing.lg }}
            accessibilityLabel="On fait quoi ce soir ?"
          >
            <Ionicons name="dice-outline" size={22} color={colors.text} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={confirmSignOut}
            hitSlop={8}
            style={{ marginRight: spacing.lg }}
            accessibilityLabel="Se déconnecter"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.text} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Liste',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
