import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, stroke } from '@/theme';

export function StampCollage() {
  return (
    <View style={styles.canvas} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.parisStamp}>
        <View style={styles.parisInner} />
        <Text style={styles.parisText}>PARIS</Text>
        <Text style={styles.parisSub}>TOUS ARRONDISSEMENTS</Text>
      </View>
      <View style={styles.todoStamp}>
        <Text style={styles.todoText}>À FAIRE</Text>
      </View>
      <View style={styles.plusSticker}>
        <Text style={styles.plusText}>+1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: 250,
    height: 132,
    alignSelf: 'center',
  },
  parisStamp: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
  },
  parisInner: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: colors.cobalt,
  },
  parisText: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.cobalt,
  },
  parisSub: {
    fontFamily: fonts.heavy,
    fontSize: 6.5,
    letterSpacing: 0.3,
    color: colors.cobalt,
  },
  todoStamp: {
    position: 'absolute',
    right: 6,
    top: 18,
    borderWidth: 3,
    borderColor: colors.tangerine,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
    transform: [{ rotate: '8deg' }],
  },
  todoText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.tangerine,
  },
  plusSticker: {
    position: 'absolute',
    right: 22,
    bottom: 8,
    backgroundColor: colors.mint,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 4,
    transform: [{ rotate: '-5deg' }],
  },
  plusText: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
});
