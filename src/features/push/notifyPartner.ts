import { CATEGORY_BY_KEY } from '@/features/places/categories';
import type { Place } from '@/features/places/types';
import type { AppUser } from '@/features/users/api';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function notifyPartner(
  place: Pick<Place, 'id' | 'name' | 'category'>,
  users: readonly AppUser[],
  myUid: string,
  cityName: string | null,
): Promise<void> {
  try {
    const me = users.find((appUser) => appUser.id === myUid);
    const partner = users.find((appUser) => appUser.id !== myUid);
    if (!partner?.expoPushToken) return;

    const categoryLabel = CATEGORY_BY_KEY[place.category].label;
    const details = cityName ? `${categoryLabel}, ${cityName}` : categoryLabel;

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: partner.expoPushToken,
        title: 'Nouveau lieu',
        body: `${me?.displayName ?? 'Quelqu’un'} a ajouté ${place.name} (${details})`,
        sound: 'default',
        data: { placeId: place.id },
      }),
    });
    if (!response.ok) {
      console.warn('Expo push failed', response.status, await response.text());
    }
  } catch (error) {
    console.warn('notifyPartner failed', error);
  }
}
