import { collection, doc, onSnapshot, type Unsubscribe, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export type AppUser = {
  id: string;
  displayName: string;
  expoPushToken: string | null;
};

export function subscribeUsers(
  onData: (users: AppUser[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      onData(
        snapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            displayName: typeof data.displayName === 'string' ? data.displayName : 'Inconnu',
            expoPushToken: typeof data.expoPushToken === 'string' ? data.expoPushToken : null,
          };
        }),
      );
    },
    onError,
  );
}

export async function setPushToken(uid: string, token: string | null): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
}
