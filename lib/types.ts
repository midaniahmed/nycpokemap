export interface Pokemon {
  id: string;
  name: string;
  lat: number;
  lng: number;
  image: string;
  svgImage?: string;
  types?: string[];
  categories?: string[];
  timestamp?: string;
  despawn?: number;
  inserted?: number;
  visibleSeconds?: number;
  attack?: number;
  defence?: number;

  cp?: number;
  custom?: boolean;
  form?: number;
  shiny?: boolean;
  mighty?: boolean;
}

export interface FilterOptions {
  search: string;
  categories: string[];
  selectedPokemon: string[];
  sortBy?: 'name' | 'id' | 'none';
  sortOrder?: 'asc' | 'desc';
  minCp?: number;
}

export interface ApiResponse {
  pokemon: Pokemon[];
  lastUpdated: string;
}

export type FocusTarget =
  | { type: 'pokemon'; lat: number; lng: number; name: string; id: string }
  | { type: 'species'; name: string }
  | null;
