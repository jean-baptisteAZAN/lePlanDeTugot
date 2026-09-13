import { Button, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

export default function HomeShell() {
  const { user, signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text>Connecté : {user?.email}</Text>
      <Button title="Se déconnecter" onPress={signOut} />
    </View>
  );
}
