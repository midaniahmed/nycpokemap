'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Pokemon, FilterOptions } from './types';
import { getAllCategoriesFromJson, getAllPokemonFromJson } from './pokemon-data';
import { fetchPokemon } from './api';

// Noop storage for SSR
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

interface PokemonStore {
  // Data
  pokemon: Pokemon[];
  allPokemonNames: string[];
  allCategories: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Filters
  filters: FilterOptions;

  // Actions
  setPokemon: (pokemon: Pokemon[]) => void;
  setAllPokemonNames: (names: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: string) => void;
  fetchPokemonWithFilters: () => Promise<void>;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setIdSearch: (query: string) => void;
  toggleCategory: (category: string) => void;
  togglePokemon: (name: string) => void;
  selectAllPokemon: () => void;
  clearAllPokemon: () => void;
  clearFilters: () => void;
  setSortBy: (sortBy: 'name' | 'id' | 'none') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setMinCp: (minCp: number | undefined) => void;

  // Computed
  getFilteredPokemon: () => Pokemon[];
  getPokemonNamesByCategory: () => string[];
}

export const usePokemonStore = create<PokemonStore>()(
  persist(
    (set, get) => {
      // Initialize categories from JSON file
      let initialCategories: string[] = [];
      try {
        initialCategories = getAllCategoriesFromJson();
      } catch (error) {
        console.error('[v0] Error loading initial categories from JSON:', error);
      }

      return {
        pokemon: [],
        allPokemonNames: [],
        allCategories: initialCategories,
        loading: false,
        error: null,
        lastUpdated: null,

        filters: {
          search: '',
          idSearch: '',
          categories: [],
          selectedPokemon: [],
          sortBy: 'none',
          sortOrder: 'asc',
          minCp: undefined,
        },

        setPokemon: (pokemon) => {
          // Enrich pokemon with names and categories from JSON
          let pokemonFromJson: Array<{ name: string; id: number; categories?: string[] }> = [];
          try {
            pokemonFromJson = getAllPokemonFromJson();
          } catch (error) {
            console.error('[v0] Error loading Pokemon from JSON for enrichment:', error);
          }

          const jsonById = new Map<string, { name: string; categories?: string[] }>();
          for (const p of pokemonFromJson) {
            jsonById.set(p.id.toString(), { name: p.name, categories: p.categories });
          }

          const enrichedPokemon = pokemon.map((p) => {
            const jsonData = jsonById.get(p.id);
            return {
              ...p,
              name: jsonData?.name || p.name,
              categories: jsonData?.categories || p.categories || [],
            };
          });

          // Sort pokemon by ID (try numeric, fallback to string)
          const sortedPokemon = [...enrichedPokemon].sort((a, b) => {
            const idA = Number.parseInt(a.id, 10) || a.id;
            const idB = Number.parseInt(b.id, 10) || b.id;
            if (typeof idA === 'number' && typeof idB === 'number') {
              return idA - idB;
            }
            return String(idA).localeCompare(String(idB), undefined, { numeric: true });
          });

          // Extract unique names in ID order
          const seenNames = new Set<string>();
          const allNames: string[] = [];
          for (const p of sortedPokemon) {
            if (!seenNames.has(p.name)) {
              seenNames.add(p.name);
              allNames.push(p.name);
            }
          }

          // Extract categories from Pokemon data
          const categoriesFromPokemon = Array.from(new Set(pokemon.flatMap((p) => p.categories || []).filter((category) => category && category.length > 0)));

          // Also get categories from JSON file (as fallback/source of truth)
          let categoriesFromJson: string[] = [];
          try {
            categoriesFromJson = getAllCategoriesFromJson();
          } catch (error) {
            console.error('[v0] Error loading categories from JSON:', error);
          }

          // Merge both sources and remove duplicates
          const allCategories = Array.from(new Set([...categoriesFromPokemon, ...categoriesFromJson])).sort((a, b) => a.localeCompare(b));

          set({
            pokemon: sortedPokemon,
            allPokemonNames: allNames,
            allCategories,
          });
        },

        setAllPokemonNames: (names) =>
          set({
            allPokemonNames: [...new Set(names)],
          }),

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setLastUpdated: (date) => set({ lastUpdated: date }),

        setSearchQuery: (query) =>
          set((state) => ({
            filters: { ...state.filters, search: query },
          })),

        setIdSearch: (query) =>
          set((state) => ({
            filters: { ...state.filters, idSearch: query },
          })),

        toggleCategory: (category) => {
          const state = get();
          const isAdding = !state.filters.categories.includes(category);

          // Update categories
          const newCategories = isAdding ? [...state.filters.categories, category] : state.filters.categories.filter((c) => c !== category);

          // If adding a category, get all Pokemon names with that category and add them to selectedPokemon
          let newSelectedPokemon = [...state.filters.selectedPokemon];

          if (isAdding) {
            // Get Pokemon from JSON file that have this category
            let pokemonFromJson: Array<{ name: string; categories?: string[] }> = [];
            try {
              pokemonFromJson = getAllPokemonFromJson();
            } catch (error) {
              console.error('[v0] Error loading Pokemon from JSON:', error);
              pokemonFromJson = state.pokemon;
            }

            // Find all Pokemon with this category
            const pokemonWithCategory = pokemonFromJson.filter((p) => {
              return (p.categories || []).includes(category);
            });

            // Add their names to selectedPokemon (avoid duplicates)
            const selectedSet = new Set(newSelectedPokemon);
            pokemonWithCategory.forEach((p) => {
              if (!selectedSet.has(p.name)) {
                selectedSet.add(p.name);
                newSelectedPokemon.push(p.name);
              }
            });
          } else {
            // If removing a category, remove Pokemon that only have this category (and no other selected categories)
            // Get Pokemon from JSON file
            let pokemonFromJson: Array<{ name: string; categories?: string[] }> = [];
            try {
              pokemonFromJson = getAllPokemonFromJson();
            } catch (error) {
              console.error('[v0] Error loading Pokemon from JSON:', error);
              pokemonFromJson = state.pokemon;
            }

            // Find Pokemon that only have the removed category and no other selected categories
            const pokemonToRemove = pokemonFromJson.filter((p) => {
              const pokemonCategories = p.categories || [];
              // Check if Pokemon has the removed category
              const hasRemovedCategory = pokemonCategories.includes(category);
              // Check if Pokemon has any other selected category
              const hasOtherSelectedCategory = newCategories.some((cat) => pokemonCategories.includes(cat));
              // Remove if it has the removed category but no other selected categories
              return hasRemovedCategory && !hasOtherSelectedCategory;
            });

            // Remove these Pokemon from selectedPokemon
            const pokemonToRemoveSet = new Set(pokemonToRemove.map((p) => p.name));
            newSelectedPokemon = newSelectedPokemon.filter((name) => !pokemonToRemoveSet.has(name));
          }

          return set({
            filters: {
              ...state.filters,
              categories: newCategories,
              selectedPokemon: newSelectedPokemon,
            },
          });
        },

        togglePokemon: (name) =>
          set((state) => ({
            filters: {
              ...state.filters,
              selectedPokemon: state.filters.selectedPokemon.includes(name) ? state.filters.selectedPokemon.filter((p) => p !== name) : [...state.filters.selectedPokemon, name],
            },
          })),

        selectAllPokemon: () => {
          const state = get();
          const { categories } = state.filters;

          // Get Pokemon names filtered by categories
          let namesToSelect: string[];
          if (categories.length === 0) {
            namesToSelect = state.allPokemonNames;
          } else {
            // Get Pokemon from JSON file (source of truth for categories)
            let pokemonFromJson: Array<{ name: string; categories?: string[] }> = [];
            try {
              pokemonFromJson = getAllPokemonFromJson();
            } catch (error) {
              console.error('[v0] Error loading Pokemon from JSON:', error);
              // Fallback to using state.pokemon if JSON fails
              pokemonFromJson = state.pokemon;
            }

            const filteredPokemon = pokemonFromJson.filter((p) => {
              if (categories.length > 0) {
                const hasCategory = (p.categories || []).some((category) => categories.includes(category));
                if (!hasCategory) return false;
              }
              return true;
            });

            const seenNames = new Set<string>();
            namesToSelect = [];
            for (const p of filteredPokemon) {
              if (!seenNames.has(p.name)) {
                seenNames.add(p.name);
                namesToSelect.push(p.name);
              }
            }
          }

          return set((state) => ({
            filters: {
              ...state.filters,
              selectedPokemon: namesToSelect,
            },
          }));
        },

        clearAllPokemon: () =>
          set((state) => ({
            filters: {
              ...state.filters,
              selectedPokemon: [],
            },
          })),

        clearFilters: () =>
          set({
            filters: {
              search: '',
              idSearch: '',
              categories: [],
              selectedPokemon: [],
              sortBy: 'none',
              sortOrder: 'asc',
              minCp: undefined,
            },
          }),

        setSortBy: (sortBy) =>
          set((state) => ({
            filters: { ...state.filters, sortBy },
          })),

        setSortOrder: (order) =>
          set((state) => ({
            filters: { ...state.filters, sortOrder: order },
          })),

        setMinCp: (minCp) =>
          set((state) => ({
            filters: { ...state.filters, minCp },
          })),

        getFilteredPokemon: () => {
          const state = get();
          const { categories, selectedPokemon, minCp } = state.filters;

          let filtered = state.pokemon.filter((p) => {
            if (categories.length > 0) {
              const hasCategory = (p.categories || []).some((category) => categories.includes(category));
              if (!hasCategory) return false;
            }

            // Pokemon selection filter
            if (selectedPokemon.length > 0) {
              if (!selectedPokemon.includes(p.name)) return false;
            }

            // CP filter - filter items with CP greater than minCp
            if (minCp !== undefined && minCp !== null) {
              const pokemonCp = p.cp ?? -1;
              if (pokemonCp === -1 || pokemonCp <= minCp) return false;
            }

            return true;
          });

          return filtered;
        },

        getPokemonNamesByCategory: () => {
          const state = get();
          const { categories } = state.filters;

          // If no categories selected, return all unique Pokemon names
          if (categories.length === 0) {
            return state.allPokemonNames;
          }

          // Get Pokemon from JSON file (source of truth for categories)
          let pokemonFromJson: Array<{ name: string; categories?: string[] }> = [];
          try {
            pokemonFromJson = getAllPokemonFromJson();
          } catch (error) {
            console.error('[v0] Error loading Pokemon from JSON:', error);
            // Fallback to using state.pokemon if JSON fails
            pokemonFromJson = state.pokemon;
          }

          // Filter Pokemon by selected categories
          const filteredPokemon = pokemonFromJson.filter((p) => {
            if (categories.length > 0) {
              const hasCategory = (p.categories || []).some((category) => categories.includes(category));
              if (!hasCategory) return false;
            }
            return true;
          });

          // Extract unique names
          const seenNames = new Set<string>();
          const names: string[] = [];
          for (const p of filteredPokemon) {
            if (!seenNames.has(p.name)) {
              seenNames.add(p.name);
              names.push(p.name);
            }
          }

          return names;
        },

        fetchPokemonWithFilters: async () => {
          const state = get();
          try {
            set({ loading: true, error: null });
            const data = await fetchPokemon(state.filters);
            const currentState = get();
            currentState.setPokemon(data);
            currentState.setLastUpdated(new Date().toISOString());
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch Pokémon data';
            set({ error: message });
            console.error('[v0] Error fetching Pokemon with filters:', error);
          } finally {
            set({ loading: false });
          }
        },
      };
    },
    {
      name: 'pokemon-store',
      partialize: (state) => ({
        filters: state.filters,
      }),
      storage: (() => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return createJSONStorage(() => localStorage);
          }
        } catch {
          // Ignore errors during SSR
        }
        return createJSONStorage(() => noopStorage);
      })(),
    },
  ),
);
