import { BagelFatOne_400Regular } from '@expo-google-fonts/bagel-fat-one/400Regular';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { useFonts } from '@expo-google-fonts/dm-sans/useFonts';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    BagelFatOne_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });
  return loaded || error !== null;
}
