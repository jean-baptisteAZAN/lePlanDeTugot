import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { CenteredMessage } from '@/components/CenteredMessage';
import { createNote, deleteNote, type Note, NOTE_TITLE_MAX } from '@/features/notes/api';
import { useNotes } from '@/features/notes/useNotes';
import { useUsers } from '@/features/users/UsersProvider';
import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

const TILTS = ['-1deg', '0.8deg', '-0.4deg', '1.1deg'];

export default function BalconScreen() {
  const { notes, loading, error } = useNotes();
  const { usersById } = useUsers();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = title.trim();

  async function handleAdd() {
    if (trimmed.length === 0 || saving) return;
    setSaving(true);
    try {
      await createNote(trimmed);
      setTitle('');
    } catch (cause) {
      console.warn('Note save failed', cause);
      Alert.alert('Oups', 'Impossible d’ajouter la note, réessaie.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(note: Note) {
    Alert.alert('Supprimer cette note ?', note.title, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteNote(note.id).catch((cause: unknown) => {
            console.warn('Note delete failed', cause);
            Alert.alert('Oups', 'Suppression impossible, réessaie.');
          });
        },
      },
    ]);
  }

  function metaFor(note: Note): string {
    const date = note.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const author = usersById[note.createdBy]?.displayName;
    return author ? `par ${author} · ${date}` : date;
  }

  function renderList() {
    if (loading) {
      return <CenteredMessage loading text="Chargement…" />;
    }
    if (error) {
      return <CenteredMessage text="Impossible de charger les notes" />;
    }
    if (notes.length === 0) {
      return <CenteredMessage text="Rien sur le Balcon pour l’instant. Note le premier truc dont on a parlé !" />;
    }
    return (
      <FlatList
        data={notes}
        keyExtractor={(note) => note.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={[styles.note, { transform: [{ rotate: TILTS[index % TILTS.length] }] }]}>
            <View style={styles.noteMain}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteMeta}>{metaFor(item)}</Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Supprimer « ${item.title} »`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Un truc à ne pas oublier…"
          placeholderTextColor={colors.inkFaint}
          maxLength={NOTE_TITLE_MAX}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <Button label="Ajouter" icon="add" onPress={handleAdd} loading={saving} disabled={trimmed.length === 0} />
      </View>
      {renderList()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 50,
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
  listContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    boxShadow: hardShadow,
  },
  noteMain: {
    flex: 1,
    gap: 2,
  },
  noteTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  noteMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
  },
});
