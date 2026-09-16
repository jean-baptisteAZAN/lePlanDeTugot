import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { StampTabBar } from '@/components/StampTabBar';
import { useAuth } from '@/features/auth/AuthProvider';
import { CitySwitcher } from '@/features/cities/CitySwitcher';
import { colors, fonts, spacing, stroke } from '@/theme';

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
      tabBar={(props) => <StampTabBar {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
        headerLeft: () => (
          <Pressable
            onPress={() => router.push('/place/random')}
            hitSlop={8}
            style={styles.dice}
            accessibilityRole="button"
            accessibilityLabel="On fait quoi ce soir ?"
          >
            <Ionicons name="dice-outline" size={20} color={colors.ink} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={confirmSignOut}
            hitSlop={8}
            style={styles.logout}
            accessibilityRole="button"
            accessibilityLabel="Se déconnecter"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.ink} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Liste',
          headerTitle: () => <CitySwitcher />,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Carte',
          headerTitle: () => <CitySwitcher />,
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recos"
        options={{
          title: 'Recos',
          headerTitle: () => <CitySwitcher />,
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="balcon"
        options={{
          title: 'Balcon',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dice: {
    marginLeft: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lemon,
    borderWidth: stroke,
    borderColor: colors.ink,
    transform: [{ rotate: '6deg' }],
  },
  logout: {
    marginRight: spacing.lg,
  },
});
