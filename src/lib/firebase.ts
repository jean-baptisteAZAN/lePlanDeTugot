import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { env } from '@/lib/env';

// Fast refresh re-evaluates this module; initializeAuth throws if called twice.
const isFirstInit = getApps().length === 0;

export const firebaseApp = isFirstInit ? initializeApp(env.firebase) : getApp();

export const auth: Auth = isFirstInit
  ? initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
