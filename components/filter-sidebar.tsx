'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { CategoryFilter } from './category-filter';
import { PokemonSelector } from './pokemon-selector';
import { usePokemonStore } from '@/lib/store';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { RotateCcw, Filter, X, ArrowUpDown, Hash, Search, Tags, List, Zap, ChevronDown, MapPin } from 'lucide-react';

interface FilterSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { filters, clearFilters, setSearchQuery, setIdSearch, setSortBy, setMinCp, getFilteredPokemon, pokemon } = usePokemonStore();

  const filteredPokemon = getFilteredPokemon();
  const totalCount = pokemon.length;
  const filteredCount = filteredPokemon.length;

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.categories.length > 0 ||
    filters.selectedPokemon.length > 0 ||
    (filters.sortBy && filters.sortBy !== 'none') ||
    (filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0);

  const activeFilterCount =
    (filters.search.length > 0 ? 1 : 0) +
    filters.categories.length +
    filters.selectedPokemon.length +
    (filters.sortBy && filters.sortBy !== 'none' ? 1 : 0) +
    (filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 ? 1 : 0);

  const removeCategory = (category: string) => {
    if (filters.categories.includes(category)) {
      const { toggleCategory } = usePokemonStore.getState();
      toggleCategory(category);
    }
  };

  const removePokemon = (name: string) => {
    if (filters.selectedPokemon.includes(name)) {
      const { togglePokemon } = usePokemonStore.getState();
      togglePokemon(name);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-border/60 bg-gradient-to-r from-muted/50 to-muted/20">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
              <Filter className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full font-semibold">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
        {/* <div className="text-xs text-muted-foreground">
          {filteredCount === totalCount ? (
            <span>Showing all <span className="font-semibold text-foreground">{totalCount}</span> Pokémon</span>
          ) : (
            <span>
              Showing <span className="font-semibold text-foreground">{filteredCount}</span> of <span className="font-semibold text-foreground">{totalCount}</span>
            </span>
          )}
        </div> */}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex flex-wrap gap-1.5">
            {filters.search && (
              <Badge
                variant="secondary"
                className="text-[11px] cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group pr-1 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                <Search className="h-3 w-3 mr-1 opacity-60" />
                &quot;{filters.search}&quot;
                <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
            {filters.categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-[11px] cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors group pr-1 capitalize rounded-full"
                onClick={() => removeCategory(cat)}
              >
                <Tags className="h-3 w-3 mr-1 opacity-60" />
                {cat}
                <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ))}
            {filters.selectedPokemon.length > 0 &&
              filters.selectedPokemon.length <= 5 &&
              filters.selectedPokemon.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="text-[11px] cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors group pr-1 capitalize rounded-full"
                  onClick={() => removePokemon(name)}
                >
                  {name}
                  <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            {filters.selectedPokemon.length > 5 && (
              <Badge variant="outline" className="text-[11px] rounded-full">
                {filters.selectedPokemon.length} Pokémon selected
              </Badge>
            )}
            {filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 && (
              <Badge
                variant="secondary"
                className="text-[11px] cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group pr-1 rounded-full"
                onClick={() => setMinCp(undefined)}
              >
                <Zap className="h-3 w-3 mr-1 opacity-60" />
                CP &gt; {filters.minCp}
                <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
          </div>
          <Separator className="mt-2.5" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar">
        <div className="p-3 space-y-4">

          {/* Categories Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tags className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Categories</span>
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
                  {filters.categories.length}
                </Badge>
              )}
            </div>
            <CategoryFilter />
          </div>

          <Separator />

          {/* Pokemon Selection Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Pokémon</span>
              {filters.selectedPokemon.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
                  {filters.selectedPokemon.length}
                </Badge>
              )}
            </div>
            <PokemonSelector />
          </div>

        </div>
      </div>

      {/* Footer - CP Filter */}
      <div className="p-3 border-t border-border/60 bg-muted/20">
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Minimum CP</span>
              {filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
                  {filters.minCp}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 pt-3">
              <Slider value={[filters.minCp ?? 0]} onValueChange={(value) => setMinCp(value[0] > 0 ? value[0] : undefined)} min={0} max={5000} step={100} className="w-full" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-medium text-foreground">
                  {filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 ? `CP > ${filters.minCp}` : 'No filter'}
                </span>
                <span>5000</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
}

export function FilterSidebar({ isMobileOpen, onMobileClose }: FilterSidebarProps) {
  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex w-80 bg-background border-r border-border/60 flex-col h-full shadow-sm">
        <SidebarContent />
      </div>

      {/* Mobile sidebar — Sheet overlay */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Filter Pokémon on the map</SheetDescription>
          </SheetHeader>
          <SidebarContent onClose={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
