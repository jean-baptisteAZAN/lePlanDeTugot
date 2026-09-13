import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, View } from 'react-native';

import { setLiked } from '@/features/places/api';
import type { Place } from '@/features/places/types';
import { isLikedBy, isSharedWish } from '@/features/places/wishes';
import { colors } from '@/theme';

type Props = {
  place: Place;
  myUid: string;
  size?: number;
};

export function WishHeart({ place, myUid, size = 20 }: Props) {
  if (place.status !== 'todo') {
    return null;
  }

  if (place.createdBy === myUid) {
    if (!isSharedWish(place)) {
      return null;
    }
    return (
      <View accessibilityLabel="Envie partagée">
        <Ionicons name="heart" size={size} color={colors.heart} />
      </View>
    );
  }

  const liked = isLikedBy(place, myUid);

  function toggle() {
    setLiked(place.id, !liked).catch(() => Alert.alert('Oups', 'Impossible de mettre à jour, réessaie.'));
  }

  return (
    <Pressable onPress={toggle} hitSlop={8} accessibilityLabel={liked ? 'Retirer mon envie' : 'Moi aussi'}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={size} color={colors.heart} />
    </Pressable>
  );
}
