'use client';

import { Input } from '@/components/ui/input';
import { usePokemonStore } from '@/lib/store';
import { X, Search } from 'lucide-react';

export function SearchInput() {
  const { filters, setSearchQuery } = usePokemonStore();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Search by name..."
        value={filters.search}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 pr-8 h-9"
      />
      {filters.search && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm p-0.5 hover:bg-accent"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
