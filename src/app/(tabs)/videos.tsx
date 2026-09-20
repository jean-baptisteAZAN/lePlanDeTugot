import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, FlatList, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { CenteredMessage } from '@/components/CenteredMessage';
import { useUsers } from '@/features/users/UsersProvider';
import { createVideo, deleteVideo, type Video, VIDEO_COMMENT_MAX, VIDEO_TITLE_MAX } from '@/features/videos/api';
import { useVideos } from '@/features/videos/useVideos';
import { fetchVideoInfo, parseVideoId, watchUrl } from '@/features/videos/youtube';
import { colors, fonts, hardShadow, radius, spacing, stroke } from '@/theme';

export default function VideosScreen() {
  const { videos, loading, error } = useVideos();
  const { usersById } = useUsers();
  const [link, setLink] = useState('');
  const [comment, setComment] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [needsTitle, setNeedsTitle] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmedLink = link.trim();
  const trimmedComment = comment.trim();
  const trimmedTitle = manualTitle.trim();

  function reset() {
    setLink('');
    setComment('');
    setManualTitle('');
    setNeedsTitle(false);
  }

  async function handleAdd() {
    if (saving || trimmedLink.length === 0) return;
    const videoId = parseVideoId(trimmedLink);
    if (!videoId) {
      Alert.alert('Presque !', 'Colle un lien YouTube (youtube.com ou youtu.be).');
      return;
    }
    if (needsTitle && trimmedTitle.length === 0) {
      Alert.alert('Presque !', 'Donne un titre à la vidéo.');
      return;
    }

    setSaving(true);
    try {
      const info = needsTitle ? null : await fetchVideoInfo(videoId);
      if (!info && !needsTitle) {
        setNeedsTitle(true);
        Alert.alert('Titre introuvable', 'YouTube n’a pas répondu, ajoute le titre à la main.');
        return;
      }
      await createVideo({
        videoId,
        url: watchUrl(videoId),
        title: (info?.title ?? trimmedTitle).slice(0, VIDEO_TITLE_MAX),
        channel: info?.channel ?? null,
        thumbnailUrl: info?.thumbnailUrl ?? null,
        comment: trimmedComment.length > 0 ? trimmedComment.slice(0, VIDEO_COMMENT_MAX) : null,
      });
      reset();
    } catch (cause) {
      console.warn('Video save failed', cause);
      Alert.alert('Oups', 'Impossible d’ajouter la vidéo, réessaie.');
    } finally {
      setSaving(false);
    }
  }

  function openVideo(video: Video) {
    Linking.openURL(video.url).catch(() => Alert.alert('Oups', 'Impossible d’ouvrir YouTube.'));
  }

  function confirmDelete(video: Video) {
    Alert.alert('Supprimer cette vidéo ?', video.title, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteVideo(video.id).catch((cause: unknown) => {
            console.warn('Video delete failed', cause);
            Alert.alert('Oups', 'Suppression impossible, réessaie.');
          });
        },
      },
    ]);
  }

  function metaFor(video: Video): string {
    const date = video.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const author = usersById[video.createdBy]?.displayName;
    const parts = [video.channel, author ? `par ${author}` : null, date].filter((part) => part !== null);
    return parts.join(' · ');
  }

  function renderList() {
    if (loading) {
      return <CenteredMessage loading text="Chargement…" />;
    }
    if (error) {
      return <CenteredMessage text="Impossible de charger les vidéos" />;
    }
    if (videos.length === 0) {
      return <CenteredMessage text="Aucune vidéo pour l’instant. Colle le premier lien !" />;
    }
    return (
      <FlatList
        data={videos}
        keyExtractor={(video) => video.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => openVideo(item)} accessibilityRole="button" accessibilityLabel={item.title}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Ionicons name="logo-youtube" size={32} color={colors.danger} />
                </View>
              )}
            </Pressable>
            <View style={styles.body}>
              <Pressable style={styles.texts} onPress={() => openVideo(item)} accessibilityRole="button">
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{metaFor(item)}</Text>
                {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer « ${item.title} »`}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
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
          value={link}
          onChangeText={setLink}
          placeholder="Lien YouTube"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {needsTitle ? (
          <TextInput
            style={styles.input}
            value={manualTitle}
            onChangeText={setManualTitle}
            placeholder="Titre de la vidéo"
            placeholderTextColor={colors.inkFaint}
            maxLength={VIDEO_TITLE_MAX}
          />
        ) : null}
        <TextInput
          style={[styles.input, styles.multiline]}
          value={comment}
          onChangeText={setComment}
          placeholder="Commentaire (optionnel)"
          placeholderTextColor={colors.inkFaint}
          maxLength={VIDEO_COMMENT_MAX}
          multiline
        />
        <Button
          label="Ajouter"
          icon="add"
          onPress={handleAdd}
          loading={saving}
          disabled={trimmedLink.length === 0}
        />
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  input: {
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
  multiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  listContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginRight: 4,
    backgroundColor: colors.surface,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderRadius: radius.md,
    boxShadow: hardShadow,
  },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: radius.md - stroke,
    borderTopRightRadius: radius.md - stroke,
    borderBottomWidth: stroke,
    borderBottomColor: colors.ink,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  comment: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
});
