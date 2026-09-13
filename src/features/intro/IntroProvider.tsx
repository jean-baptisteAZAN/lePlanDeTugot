import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const INTRO_SEEN_KEY = 'intro:v1:seen';

type IntroState = {
  seen: boolean | null;
  finish: () => void;
  replay: () => void;
};

const IntroContext = createContext<IntroState | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(INTRO_SEEN_KEY)
      .then((value) => setSeen(value === '1'))
      .catch(() => setSeen(false));
  }, []);

  const finish = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(INTRO_SEEN_KEY, '1').catch((error: unknown) => console.warn('Saving intro state failed', error));
  }, []);

  const replay = useCallback(() => setSeen(false), []);

  const value = useMemo<IntroState>(() => ({ seen, finish, replay }), [seen, finish, replay]);

  return <IntroContext value={value}>{children}</IntroContext>;
}

export function useIntro(): IntroState {
  const value = useContext(IntroContext);
  if (!value) {
    throw new Error('useIntro must be used inside IntroProvider');
  }
  return value;
}
