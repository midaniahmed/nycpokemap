'use client';

import { useState } from 'react';
import { PokemonProvider } from './pokemon-provider';
import { FilterSidebar } from './filter-sidebar';
import { PokemonMap } from './pokemon-map';

export function Dashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <PokemonProvider>
      <div className="flex h-screen w-screen bg-background overflow-hidden">
        {/* Sidebar - visible on desktop, Sheet on mobile */}
        <FilterSidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={closeSidebar}
        />

        {/* Map - always full width on mobile */}
        <div className="flex-1 relative">
          <PokemonMap onToggleSidebar={toggleSidebar} />
        </div>
      </div>
    </PokemonProvider>
  );
}
