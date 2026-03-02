'use client';

import { useEffect, useRef } from 'react';
import { usePokemonStore } from '@/lib/store';
import { fetchPokemon } from '@/lib/api';
import { getPokemonNamesFromJson, getAllCategoriesFromJson } from '@/lib/pokemon-data';

export function PokemonProvider({ children }: { children: React.ReactNode }) {
  const { setPokemon, setAllPokemonNames, setLoading, setError, setLastUpdated, pokemon, allPokemonNames, allCategories, filters, fetchPokemonWithFilters } = usePokemonStore();

  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchDone = useRef(false);
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load Pokemon names and categories from JSON file
  useEffect(() => {
    if (allPokemonNames.length === 0) {
      try {
        const names = getPokemonNamesFromJson();
        setAllPokemonNames(names);
      } catch (error) {
        setError('Failed to load Pokémon names from JSON');
      }
    }

    // Load categories from JSON file if not already loaded
    if (allCategories.length === 0) {
      try {
        const categories = getAllCategoriesFromJson();
        // Update store with categories - we need to set them via setPokemon or add a setter
        // For now, categories will be loaded when Pokemon data is fetched
        console.log('[v0] Available categories from JSON:', categories);
      } catch (error) {
        console.error('[v0] Error loading categories from JSON:', error);
      }
    }
  }, [allPokemonNames.length, allCategories.length, setAllPokemonNames, setError]);

  // Initial fetch and setup auto-refresh for location data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use current filters for fetching
        const currentFilters = usePokemonStore.getState().filters;
        const data = await fetchPokemon(currentFilters);
        setPokemon(data);
        setLastUpdated(new Date().toISOString());

        console.log('[v0] Fetched Pokemon data:', data.length, 'items');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch Pokémon data';
        setError(message);
        console.error('[v0] Error fetching Pokemon:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch if we don't have data
    if (!initialFetchDone.current && pokemon.length === 0) {
      initialFetchDone.current = true;
      fetchData();
    }

    // Auto-refresh every 30 seconds (using current filters)
    fetchIntervalRef.current = setInterval(fetchData, 60000);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [setPokemon, setLoading, setError, setLastUpdated, pokemon.length]);

  // Watch for filter changes and fetch Pokemon with filters
  useEffect(() => {
    // Skip if initial fetch hasn't been done yet
    if (!initialFetchDone.current) {
      return;
    }

    // Clear existing debounce timer
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }

    // Debounce API calls to avoid too many requests
    filterDebounceRef.current = setTimeout(() => {
      fetchPokemonWithFilters();
    }, 500); // 500ms debounce

    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, [filters.search, filters.categories.join(','), filters.selectedPokemon.join(','), fetchPokemonWithFilters]);

  return <>{children}</>;
}
