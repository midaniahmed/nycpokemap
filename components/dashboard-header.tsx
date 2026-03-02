'use client';

import { usePokemonStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { Menu, Filter, MapPin, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
  onToggleAnalytics?: () => void;
}

export function DashboardHeader({ onToggleSidebar, onToggleAnalytics }: DashboardHeaderProps) {
  const { pokemon, lastUpdated, loading, error, filters } = usePokemonStore();

  const timeAgo = lastUpdated && !loading ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : 'never';

  const activeFilterCount =
    (filters.search.length > 0 ? 1 : 0) +
    filters.categories.length +
    filters.selectedPokemon.length +
    (filters.sortBy && filters.sortBy !== 'none' ? 1 : 0) +
    (filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 ? 1 : 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="m-3 md:m-4 flex items-start gap-2">
        {/* Mobile filter toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden pointer-events-auto flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg hover:bg-background/90 active:scale-95 transition-all relative"
          aria-label="Open filters"
        >
          <Filter className="h-5 w-5 text-foreground" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[10px] font-bold bg-red-500 text-white border-2 border-background rounded-full flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </button>

        {/* Main header card */}
        <div className="pointer-events-auto bg-background/70 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg px-4 py-3 max-w-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground leading-tight truncate hidden md:block">NYC Pokémon Map</h1>
                <div className="text-xs text-muted-foreground leading-snug">
                  {pokemon.length > 0 ? (
                    <>
                      <span className="hidden md:block">
                        <span className="font-semibold text-foreground">{pokemon.length}</span> Pokémon · Updated {timeAgo}
                      </span>
                      <span className="md:hidden">
                        <span className="font-semibold text-foreground">{pokemon.length} Pokémon</span>
                      </span>
                    </>
                  ) : loading ? (
                    <span>Loading Pokémon data...</span>
                  ) : error ? (
                    <span className="text-destructive font-medium">{error}</span>
                  ) : (
                    <span>No data loaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Loading pulse */}
            {loading && (
              <div className="flex-shrink-0 relative">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping opacity-75" />
              </div>
            )}
          </div>
        </div>

        {/* Spacer pushes analytics button to the right */}
        <div className="flex-1" />

        {/* Analytics toggle */}
        <button
          onClick={onToggleAnalytics}
          className="pointer-events-auto flex-shrink-0 flex items-center gap-1.5 h-11 px-3.5 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg hover:bg-background/90 active:scale-95 transition-all"
          aria-label="Open analytics"
        >
          <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
          <span className="hidden sm:inline text-sm font-semibold text-foreground">Analytics</span>
        </button>
      </div>
    </div>
  );
}
