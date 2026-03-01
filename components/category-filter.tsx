'use client';

import { usePokemonStore } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function CategoryFilter() {
  const { allCategories, filters, toggleCategory } = usePokemonStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (allCategories.length === 0) {
    return null;
  }

  const filteredCategories = allCategories.filter((category) => category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {/* Categories list */}
      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
        {filteredCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No categories found</p>
        ) : (
          filteredCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors group">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor={`category-${category}`} className="text-xs font-normal cursor-pointer flex-1 flex items-center justify-between">
                <span className="capitalize">{category}</span>
                {filters.categories.includes(category) && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Active
                  </Badge>
                )}
              </Label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
