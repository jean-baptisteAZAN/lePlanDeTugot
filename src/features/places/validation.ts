import type { PlaceInput } from '@/features/places/types';

export function normalizePlaceInput(input: PlaceInput): PlaceInput {
  const comment = input.comment?.trim() ?? '';
  return {
    ...input,
    name: input.name.trim(),
    comment: comment.length > 0 ? comment : null,
    rating: input.status === 'done' ? input.rating : null,
  };
}

export function validatePlaceInput(input: PlaceInput): string | null {
  if (input.name.length === 0) return 'Le nom est obligatoire';
  if (input.name.length > 200) return 'Le nom est trop long';
  if (input.status === 'done' && input.rating === null) return 'Donne une note au lieu';
  if (input.comment !== null && input.comment.length > 2000) return 'Le commentaire est trop long';
  return null;
}
