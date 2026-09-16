import type { CityInput } from '@/features/cities/types';
import { autocompleteCities, getCityDetails } from '@/features/search/googlePlaces';
import { SearchPanel } from '@/features/search/SearchPanel';

type Props = {
  onSelect: (input: CityInput) => void;
  onCancel: () => void;
};

export function CitySearch({ onSelect, onCancel }: Props) {
  return (
    <SearchPanel
      placeholder="Nom de la ville (ex : Lyon)"
      selectErrorMessage="Impossible de récupérer cette ville, réessaie."
      suggest={autocompleteCities}
      details={getCityDetails}
      onSelect={onSelect}
      onCancel={onCancel}
    />
  );
}
