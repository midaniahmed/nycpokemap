'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { CategoryFilter } from './category-filter';
import { PokemonSelector } from './pokemon-selector';
import { usePokemonStore } from '@/lib/store';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { RotateCcw, Filter, X, ArrowUpDown, Hash, Search, Tags, List, Zap, ChevronDown } from 'lucide-react';

export function FilterSidebar() {
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

  const sortLabel = filters.sortBy === 'name' ? 'Name' : filters.sortBy === 'id' ? 'ID' : 'None';

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="p-2 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          {/* <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Filters</h2>
          </div> */}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filteredCount === totalCount ? (
              <span>Showing all {totalCount} Pokémon</span>
            ) : (
              <span>
                Showing <span className="font-semibold text-foreground">{filteredCount}</span> of <span className="font-semibold text-foreground">{totalCount}</span>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Filters</p>
            <button onClick={clearFilters} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2">
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.search && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group pr-1"
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
                className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors group pr-1 capitalize"
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
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors group pr-1 capitalize"
                  onClick={() => removePokemon(name)}
                >
                  {name}
                  <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            {/* {filters.selectedPokemon.length > 5 && (
              <Badge variant="outline" className="text-xs">
                {filters.selectedPokemon.length} Pokémon selected
              </Badge>
            )} */}
            {filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group pr-1"
                onClick={() => setMinCp(undefined)}
              >
                <Zap className="h-3 w-3 mr-1 opacity-60" />
                CP &gt; {filters.minCp}
                <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
          </div>
          <Separator className="mt-3" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Categories Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tags className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Categories</span>
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
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
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {filters.selectedPokemon.length}
                </Badge>
              )}
            </div>
            <PokemonSelector />
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        {/* <Button variant="outline" size="sm" className="w-full" onClick={clearFilters} disabled={!hasActiveFilters}>
          <RotateCcw size={14} className="mr-2" />
          Reset All Filters
        </Button> */}
         {/* CP Filter Section */}
         <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Minimum CP</span>
                {filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
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
                    {filters.minCp !== undefined && filters.minCp !== null && filters.minCp > 0 ? `CP &gt; ${filters.minCp}` : 'No filter'}
                  </span>
                  <span>5000</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

      </div>
    </div>
  );
}
