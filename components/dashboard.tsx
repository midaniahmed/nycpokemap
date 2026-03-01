'use client';

import { useState } from 'react';
import { PokemonProvider } from './pokemon-provider';
import { FilterSidebar } from './filter-sidebar';
import { PokemonMap } from './pokemon-map';
import { AnalyticsDrawer } from './analytics-drawer';

export function Dashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const toggleSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsMobileSidebarOpen(false);
  const toggleAnalytics = () => setIsAnalyticsOpen((prev) => !prev);

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
          <PokemonMap onToggleSidebar={toggleSidebar} onToggleAnalytics={toggleAnalytics} />
        </div>

        {/* Analytics drawer - slides in from the right */}
        <AnalyticsDrawer open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen} />
      </div>
    </PokemonProvider>
  );
}
