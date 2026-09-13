import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StampCollage } from '@/components/StampCollage';
import { useAuth } from '@/features/auth/AuthProvider';
import { useIntro } from '@/features/intro/IntroProvider';
import { colors, fonts, radius, spacing, stroke } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { replay } = useIntro();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch {
      setError('Email ou mot de passe incorrect');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <StampCollage />
        <Text style={styles.title}>Le Plan de Turgot</Text>
        <Text style={styles.subtitle}>Nos lieux à Paris</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.inkFaint}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.inkFaint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Se connecter"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
          style={styles.submit}
        />
        <Pressable onPress={replay} hitSlop={8} accessibilityRole="button" style={styles.replay}>
          <Text style={styles.replayText}>Revoir l’intro</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    textAlign: 'center',
    textShadowColor: colors.lemon,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.bold,
    color: colors.danger,
    textAlign: 'center',
  },
  submit: {
    marginTop: spacing.sm,
  },
  replay: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  replayText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.cobalt,
    textDecorationLine: 'underline',
  },
});
