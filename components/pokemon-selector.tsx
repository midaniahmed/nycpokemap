'use client';

import { usePokemonStore } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { getAllPokemonFromJson, type PokemonListItem } from '@/lib/pokemon-data';

export function PokemonSelector() {
  const { allPokemonNames, filters, togglePokemon, selectAllPokemon, clearAllPokemon } = usePokemonStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Get Pokemon objects filtered by selected categories
  const pokemonByCategory = useMemo(() => {
    const allPokemon = getAllPokemonFromJson();
    const { categories } = filters;

    // If no categories selected, return all Pokemon
    if (categories.length === 0) {
      return allPokemon;
    }

    // Filter Pokemon by selected categories
    return allPokemon.filter((p) => {
      if (categories.length > 0) {
        const hasCategory = (p.categories || []).some((category) => categories.includes(category));
        if (!hasCategory) return false;
      }
      return true;
    });
  }, [filters.categories]);

  // Get unique Pokemon by name (in case of duplicates)
  const uniquePokemon = useMemo(() => {
    const seen = new Set<string>();
    return pokemonByCategory.filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
  }, [pokemonByCategory]);

  if (uniquePokemon.length === 0 && allPokemonNames.length === 0) {
    return null;
  }

  const isAllSelected = filters.selectedPokemon.length === uniquePokemon.length && uniquePokemon.length > 0;
  const isSomeSelected = filters.selectedPokemon.length > 0;

  const filteredPokemon = uniquePokemon.filter((pokemon) => pokemon.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {/* Selection stats and actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {filters.selectedPokemon.length} of {uniquePokemon.length} selected
        </span>
        <div className="flex gap-1.5">
          <Button variant={isAllSelected ? 'default' : 'outline'} size="sm" className="text-xs h-7 px-2" onClick={selectAllPokemon}>
            Select All
          </Button>
          <Button variant={isSomeSelected ? 'destructive' : 'outline'} size="sm" className="text-xs h-7 px-2" onClick={clearAllPokemon} disabled={!isSomeSelected}>
            Clear
          </Button>
        </div>
      </div>

      {/* Search within Pokemon */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input type="text" placeholder="Search Pokémon..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
      </div>

      {/* Pokemon list */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {filteredPokemon.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No Pokémon found</p>
        ) : (
          filteredPokemon.map((pokemon) => (
            <div key={pokemon.name} className="flex items-center space-x-2.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors group">
              <Checkbox
                id={`pokemon-${pokemon.name}`}
                checked={filters.selectedPokemon.includes(pokemon.name)}
                onCheckedChange={() => togglePokemon(pokemon.name)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor={`pokemon-${pokemon.name}`} className="text-xs font-normal cursor-pointer flex-1 flex items-center justify-between capitalize">
                <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground">{pokemon.id} - </span>
                    <span className="font-medium">{pokemon.name}</span>
                  </div>
                  <img
                    src={pokemon.url}
                    alt={pokemon.name}
                    className="w-8 h-8 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </Label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
