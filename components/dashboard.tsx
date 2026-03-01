'use client';

import { PokemonProvider } from './pokemon-provider';
import { FilterSidebar } from './filter-sidebar';
import { PokemonMap } from './pokemon-map';

export function Dashboard() {
  return (
    <PokemonProvider>
      <div className="flex h-screen w-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <FilterSidebar />

        {/* Map */}
        <div className="flex-1 relative">
          <PokemonMap />
        </div>
      </div>
    </PokemonProvider>
  );
}
