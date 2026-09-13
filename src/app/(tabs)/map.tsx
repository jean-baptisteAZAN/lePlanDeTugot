import { View } from 'react-native';

import { CenteredMessage } from '@/components/CenteredMessage';
import { Fab } from '@/components/Fab';

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <CenteredMessage text="Carte bientôt disponible" />
      <Fab />
    </View>
  );
}
