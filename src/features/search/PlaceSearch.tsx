import { autocomplete, getPlaceDetails, type PlaceDetails } from '@/features/search/googlePlaces';
import { SearchPanel } from '@/features/search/SearchPanel';

type Props = {
  onSelect: (details: PlaceDetails) => void;
  onCancel?: () => void;
};

export function PlaceSearch({ onSelect, onCancel }: Props) {
  return (
    <SearchPanel
      placeholder="Nom ou adresse (ex : Le Comptoir)"
      selectErrorMessage="Impossible de récupérer ce lieu, réessaie."
      suggest={autocomplete}
      details={getPlaceDetails}
      onSelect={onSelect}
      onCancel={onCancel}
    />
  );
}
