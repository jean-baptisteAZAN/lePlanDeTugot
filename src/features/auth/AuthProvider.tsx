import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { setPushToken } from '@/features/users/api';
import { auth } from '@/lib/firebase';

type AuthState = {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

const TOKEN_CLEAR_TIMEOUT_MS = 3000;

async function signOut(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    const clearToken = setPushToken(uid, null).catch((error: unknown) =>
      console.warn('Clearing push token failed', error),
    );
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, TOKEN_CLEAR_TIMEOUT_MS));
    await Promise.race([clearToken, timeout]);
  }
  await firebaseSignOut(auth);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setInitializing(false);
      }),
    [],
  );

  return <AuthContext value={{ user, initializing, signIn, signOut }}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
