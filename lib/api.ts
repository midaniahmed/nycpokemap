import type { Pokemon, ApiResponse, FilterOptions } from './types';
import { getPokemonIdsByNames } from './pokemon-data';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api/pokemap';

export async function fetchPokemon(filters?: Partial<FilterOptions>): Promise<Pokemon[]> {
  try {
    // Build query parameters for backend
    const params = new URLSearchParams();

    if (filters) {
      // Convert selected Pokemon names to IDs for the mons parameter
      if (filters.selectedPokemon && filters.selectedPokemon.length > 0) {
        const pokemonIds = getPokemonIdsByNames(filters.selectedPokemon);
        if (pokemonIds.length > 0) {
          params.append('mons', pokemonIds.join(','));
        }
      }
    }

    // Add timestamp parameters
    const now = Date.now();
    params.append('time', now.toString());
    // Since parameter - using a recent timestamp (e.g., 5 seconds ago)
    const since = Math.floor((now - 5000) / 1000);
    params.append('since', '0');

    console.log(200, BACKEND_URL);

    const url = `${BACKEND_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.pokemon_id.toString(),
        name: item.pokemon_id.toString(),
        lat: item.lat,
        lng: item.lng,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png`,
        svgImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${item.pokemon_id}.svg`,
        timestamp: item.despawn?.toString(),
        despawn: item.despawn,
        inserted: item.inserted,
        visibleSeconds: item.despawn && item.inserted ? item.despawn - item.inserted : undefined,
        cp: item.cp,
        attack: item.attack,
        defence: item.defence,
      }));
    }

    return [];
  } catch (error) {
    console.error('[v0] Failed to fetch Pokemon:', error);
    throw error;
  }
}

export function getApiUrl(): string {
  return BACKEND_URL;
}
