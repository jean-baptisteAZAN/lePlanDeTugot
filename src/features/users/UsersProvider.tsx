import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { type AppUser, subscribeUsers } from '@/features/users/api';

type UsersState = {
  users: AppUser[];
  usersById: Record<string, AppUser>;
};

const UsersContext = createContext<UsersState | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!uid) {
      setUsers([]);
      return;
    }
    return subscribeUsers(setUsers, (error) => console.warn('Users subscription failed', error));
  }, [uid]);

  const value = useMemo<UsersState>(
    () => ({ users, usersById: Object.fromEntries(users.map((appUser) => [appUser.id, appUser])) }),
    [users],
  );

  return <UsersContext value={value}>{children}</UsersContext>;
}

export function useUsers(): UsersState {
  const value = useContext(UsersContext);
  if (!value) {
    throw new Error('useUsers must be used inside UsersProvider');
  }
  return value;
}
