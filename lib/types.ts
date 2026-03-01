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
  cp?: number;
  attack?: number;
  defence?: number;
}

export interface FilterOptions {
  search: string;
  idSearch: string;
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
