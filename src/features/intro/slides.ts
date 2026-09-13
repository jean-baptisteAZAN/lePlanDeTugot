import type { StickerTone } from '@/components/Sticker';

export const INTRO_SENTENCES: readonly string[] = [
  'Bon, Blandine.',
  'On a un gros problème.',
  'Trop de trucs à faire…',
  '…mais un temps imparti.',
  'Et, de mon côté, une capacité à oublier assez conséquente quand même.',
  'Donc j’ai réfléchi.',
  'Et voici la solution que j’ai trouvée :',
];

export const INTRO_FEATURES: readonly { label: string; tone: StickerTone }[] = [
  { label: 'Nos lieux, à faire et déjà faits', tone: 'mint' },
  { label: 'La carte de Paris avec tout dessus', tone: 'lemon' },
  { label: '« Moi aussi » quand on est partants', tone: 'tangerine' },
  { label: '« On fait quoi ce soir ? »', tone: 'cobalt' },
  { label: 'Des recos inspirées de nos 5 étoiles', tone: 'mint' },
];
