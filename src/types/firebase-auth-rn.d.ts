// @firebase/auth's package.json "exports" map lists "types" before "react-native"
// in the "." conditions object, so TypeScript's exports resolution (which always
// matches the "types" condition) picks the generic dist/auth-public.d.ts typings
// for both `firebase/auth` and `@firebase/auth`, even though Metro correctly loads
// the React Native bundle (dist/rn/index.js) at runtime, which does export this
// function. This augmentation restores the missing type; it only affects
// compile-time types; it is erased and has no effect on the runtime module Metro
// resolves for `firebase/auth`.
import type {
  Persistence,
  ReactNativeAsyncStorage,
  // eslint-disable-next-line import/no-relative-packages
} from '../../node_modules/@firebase/auth/dist/rn/index.rn';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
