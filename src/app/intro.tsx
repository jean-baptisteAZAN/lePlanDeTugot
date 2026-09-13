import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StampCollage } from '@/components/StampCollage';
import { STICKER_TONE_COLORS } from '@/components/Sticker';
import { useIntro } from '@/features/intro/IntroProvider';
import { INTRO_FEATURES, INTRO_SENTENCES } from '@/features/intro/slides';
import { useStampEntrance } from '@/features/intro/useStampEntrance';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

const TOTAL_STEPS = INTRO_SENTENCES.length + 1;
const STEP_INDEXES = Array.from({ length: TOTAL_STEPS }, (_, index) => index);

export default function IntroScreen() {
  const { finish } = useIntro();
  const [step, setStep] = useState(0);
  const stampStyle = useStampEntrance(step);
  const isFeatures = step === INTRO_SENTENCES.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>{step === 0 ? <StampCollage /> : null}</View>

      <View style={styles.body}>
        <Animated.View style={stampStyle}>
          {isFeatures ? (
            <View style={styles.features}>
              <Text style={styles.appName}>Le Plan de Turgot</Text>
              {INTRO_FEATURES.map((feature) => (
                <View key={feature.label} style={styles.feature}>
                  <View style={[styles.featureDot, { backgroundColor: STICKER_TONE_COLORS[feature.tone] }]} />
                  <Text style={styles.featureText}>{feature.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sentence} accessibilityLiveRegion="polite">
              {INTRO_SENTENCES[step]}
            </Text>
          )}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {isFeatures ? (
          <Button label="C’est parti" onPress={finish} />
        ) : (
          <View style={styles.nav}>
            <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
              <Text style={styles.skip}>Passer</Text>
            </Pressable>
            <View style={styles.dots} accessible accessibilityLabel={`Étape ${step + 1} sur ${TOTAL_STEPS}`}>
              {STEP_INDEXES.map((index) => (
                <View key={index} style={[styles.dot, index < step && styles.dotDone, index === step && styles.dotCurrent]} />
              ))}
            </View>
            <Pressable
              onPress={() => setStep((current) => current + 1)}
              style={({ pressed }) => [styles.next, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.nextText}>Suivant</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  top: {
    height: 170,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  sentence: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
  },
  features: {
    gap: spacing.md,
  },
  appName: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.cobalt,
    marginBottom: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  featureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.inkMuted,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: stroke,
    borderColor: colors.ink,
  },
  dotDone: {
    backgroundColor: colors.ink,
  },
  dotCurrent: {
    backgroundColor: colors.tangerine,
  },
  next: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.85,
  },
  nextText: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.surface,
  },
});
