'use client';

import { usePokemonStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';

export function DashboardHeader() {
  const { pokemon, lastUpdated, loading, error } = usePokemonStore();

  const timeAgo =
    lastUpdated && !loading
      ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
      : 'never';

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="m-4 bg-white rounded-lg shadow-md p-4 pointer-events-auto max-w-md">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">NYC Pokémon Map</h1>
            {loading && (
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {pokemon.length > 0 ? (
              <>
                <p>{pokemon.length} Pokémon found</p>
                <p>Updated {timeAgo}</p>
              </>
            ) : loading ? (
              <p>Loading Pokémon data...</p>
            ) : error ? (
              <p className="text-red-600 font-medium">{error}</p>
            ) : (
              <p>No data loaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
