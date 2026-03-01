export interface PokemonListItem {
  name: string;
  id: number;
  url: string;
  categories?: string[];
}

// Import JSON data - Next.js supports JSON imports with resolveJsonModule
// @ts-ignore - JSON import is supported by Next.js bundler
import pokemonData from './pokemons.json';

export function getPokemonNamesFromJson(): string[] {
  const data = pokemonData as { ALL_POKEMON: PokemonListItem[] };
  return data.ALL_POKEMON.map((pokemon) => pokemon.name);
}

export function getAllPokemonFromJson(): PokemonListItem[] {
  const data = pokemonData as { ALL_POKEMON: PokemonListItem[] };
  return data.ALL_POKEMON;
}

// Get categories map from JSON file (name -> categories)
export function getCategoriesMap(): Map<string, string[]> {
  const data = pokemonData as { ALL_POKEMON: PokemonListItem[] };
  const categoriesMap = new Map<string, string[]>();

  data.ALL_POKEMON.forEach((pokemon) => {
    if (pokemon.categories && pokemon.categories.length > 0) {
      categoriesMap.set(pokemon.name.toLowerCase(), pokemon.categories);
    }
  });

  return categoriesMap;
}

// Get all unique categories from JSON file
export function getAllCategoriesFromJson(): string[] {
  const data = pokemonData as { ALL_POKEMON: PokemonListItem[] };
  const categoriesSet = new Set<string>();

  data.ALL_POKEMON.forEach((pokemon) => {
    if (pokemon.categories) {
      pokemon.categories.forEach((cat) => {
        if (cat && cat.length > 0) {
          categoriesSet.add(cat);
        }
      });
    }
  });

  return Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
}

// Get Pokemon ID by name (case-insensitive)
export function getPokemonIdByName(name: string): number | null {
  const data = pokemonData as { ALL_POKEMON: PokemonListItem[] };
  const pokemon = data.ALL_POKEMON.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  return pokemon?.id ?? null;
}

// Get Pokemon IDs by names
export function getPokemonIdsByNames(names: string[]): number[] {
  return names
    .map((name) => getPokemonIdByName(name))
    .filter((id): id is number => id !== null);
}
