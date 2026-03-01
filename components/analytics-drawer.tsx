'use client';

import { useMemo } from 'react';
import { usePokemonStore } from '@/lib/store';
import type { Pokemon, FocusTarget } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Shield, Swords, Zap, Crown, TrendingUp, BarChart3, MapPin } from 'lucide-react';

interface AnalyticsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsDrawer({ open, onOpenChange }: AnalyticsDrawerProps) {
  const { getFilteredPokemon, setFocusTarget } = usePokemonStore();
  const pokemon = getFilteredPokemon();

  const focusOnPokemon = (p: Pokemon) => {
    setFocusTarget({ type: 'pokemon', lat: p.lat, lng: p.lng, name: p.name, id: p.id });
    onOpenChange(false);
  };

  const focusOnSpecies = (name: string) => {
    setFocusTarget({ type: 'species', name });
    onOpenChange(false);
  };

  const analytics = useMemo(() => {
    if (pokemon.length === 0) return null;

    // --- Rarity counts ---
    const shinyCount = pokemon.filter((p) => p.shiny).length;
    const mightyCount = pokemon.filter((p) => p.mighty).length;
    const customCount = pokemon.filter((p) => p.custom).length;

    // --- CP stats ---
    const withCp = pokemon.filter((p) => p.cp !== undefined && p.cp !== null && p.cp !== -1);
    const cpValues = withCp.map((p) => p.cp!);
    const avgCp = cpValues.length > 0 ? Math.round(cpValues.reduce((a, b) => a + b, 0) / cpValues.length) : 0;
    const maxCp = cpValues.length > 0 ? Math.max(...cpValues) : 0;
    const minCp = cpValues.length > 0 ? Math.min(...cpValues) : 0;

    // --- Top Attack ---
    const withAttack = pokemon.filter((p) => p.attack !== undefined && p.attack !== null && p.attack !== -1);
    const topAttackers = [...withAttack].sort((a, b) => (b.attack ?? 0) - (a.attack ?? 0)).slice(0, 5);

    // --- Top Defence ---
    const withDefence = pokemon.filter((p) => p.defence !== undefined && p.defence !== null && p.defence !== -1);
    const topDefenders = [...withDefence].sort((a, b) => (b.defence ?? 0) - (a.defence ?? 0)).slice(0, 5);

    // --- Top CP ---
    const topCp = [...withCp].sort((a, b) => (b.cp ?? 0) - (a.cp ?? 0)).slice(0, 5);

    // --- Most showing Pokémon (frequency) ---
    const nameCounts = new Map<string, { count: number; image: string; id: string }>();
    pokemon.forEach((p) => {
      const existing = nameCounts.get(p.name);
      if (existing) {
        existing.count += 1;
      } else {
        nameCounts.set(p.name, {
          count: 1,
          image: p.svgImage || p.image,
          id: p.id,
        });
      }
    });
    const mostShowing = Array.from(nameCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, data]) => ({ name, ...data }));

    return {
      total: pokemon.length,
      shinyCount,
      mightyCount,
      customCount,
      avgCp,
      maxCp,
      minCp,
      topAttackers,
      topDefenders,
      topCp,
      mostShowing,
    };
  }, [pokemon]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-md p-0 flex flex-col overflow-hidden">
        <SheetHeader className="p-4 pb-2 border-b border-border/60 bg-linear-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <SheetTitle className="text-base">Analytics</SheetTitle>
              <SheetDescription className="text-xs">Summary of {analytics?.total ?? 0} loaded Pokémon</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar p-4 space-y-5">
          {!analytics ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No Pokémon data loaded</div>
          ) : (
            <>
              {/* ===== Rarity Section ===== */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold">Rarity</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <RarityCard
                    label="Shiny"
                    count={analytics.shinyCount}
                    total={analytics.total}
                    emoji="✨"
                    gradient="from-amber-400 to-yellow-500"
                    bgGradient="from-amber-500/10 to-yellow-500/10"
                  />
                  <RarityCard
                    label="Mighty"
                    count={analytics.mightyCount}
                    total={analytics.total}
                    emoji="💪"
                    gradient="from-red-500 to-rose-600"
                    bgGradient="from-red-500/10 to-rose-500/10"
                  />
                  <RarityCard
                    label="Custom"
                    count={analytics.customCount}
                    total={analytics.total}
                    emoji="⭐"
                    gradient="from-violet-500 to-purple-600"
                    bgGradient="from-violet-500/10 to-purple-500/10"
                  />
                </div>
              </section>

              <Separator />

              {/* ===== Power Scaling / CP ===== */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold">Power Scaling (CP)</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatBox label="Average" value={analytics.avgCp} color="text-blue-600" />
                  <StatBox label="Highest" value={analytics.maxCp} color="text-emerald-600" />
                  <StatBox label="Lowest" value={analytics.minCp} color="text-orange-600" />
                </div>

                {/* Top CP Pokémon */}
                {analytics.topCp.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Top CP
                    </span>
                    {analytics.topCp.map((p, i) => (
                      <PokemonStatRow
                        key={`cp-${p.id}-${p.lat}-${i}`}
                        rank={i + 1}
                        pokemon={p}
                        value={p.cp ?? 0}
                        unit="CP"
                        color="bg-blue-500"
                        maxValue={analytics.maxCp}
                        onClick={() => focusOnPokemon(p)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* ===== Top Attack ===== */}
              {analytics.topAttackers.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="h-4 w-4 text-red-500" />
                    <h3 className="text-sm font-semibold">Top Attack</h3>
                  </div>
                  <div className="space-y-1.5">
                    {analytics.topAttackers.map((p, i) => (
                      <PokemonStatRow
                        key={`atk-${p.id}-${p.lat}-${i}`}
                        rank={i + 1}
                        pokemon={p}
                        value={p.attack ?? 0}
                        unit="ATK"
                        color="bg-red-500"
                        maxValue={analytics.topAttackers[0]?.attack ?? 1}
                        onClick={() => focusOnPokemon(p)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {analytics.topAttackers.length > 0 && analytics.topDefenders.length > 0 && <Separator />}

              {/* ===== Top Defence ===== */}
              {analytics.topDefenders.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-sky-500" />
                    <h3 className="text-sm font-semibold">Top Defence</h3>
                  </div>
                  <div className="space-y-1.5">
                    {analytics.topDefenders.map((p, i) => (
                      <PokemonStatRow
                        key={`def-${p.id}-${p.lat}-${i}`}
                        rank={i + 1}
                        pokemon={p}
                        value={p.defence ?? 0}
                        unit="DEF"
                        color="bg-sky-500"
                        maxValue={analytics.topDefenders[0]?.defence ?? 1}
                        onClick={() => focusOnPokemon(p)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <Separator />

              {/* ===== Most Showing Pokémon ===== */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">Most Showing</h3>
                </div>
                <div className="space-y-1.5">
                  {analytics.mostShowing.map((p, i) => (
                    <button
                      key={`freq-${p.name}-${i}`}
                      onClick={() => focusOnSpecies(p.name)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors w-full text-left group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5 text-right">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0">
                        <img src={p.image} alt={p.name} width={24} height={24} className="object-contain drop-shadow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold capitalize truncate block">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">#{p.id}</span>
                      </div>
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
                      <Badge variant="secondary" className="text-xs font-bold tabular-nums rounded-full">
                        {p.count}×
                      </Badge>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Helper components ---------- */

function RarityCard({ label, count, total, emoji, gradient, bgGradient }: { label: string; count: number; total: number; emoji: string; gradient: string; bgGradient: string }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
  return (
    <div className={`relative rounded-xl border border-border/50 p-3 bg-gradient-to-br ${bgGradient} overflow-hidden`}>
      <span className="text-lg leading-none">{emoji}</span>
      <div className="mt-1.5 text-xl font-extrabold tabular-nums">{count}</div>
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground/70">{pct}%</div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 p-3 bg-muted/30 text-center">
      <div className={`text-xl font-extrabold tabular-nums ${color}`}>{value.toLocaleString()}</div>
      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</div>
    </div>
  );
}

function PokemonStatRow({
  rank,
  pokemon,
  value,
  unit,
  color,
  maxValue,
  onClick,
}: {
  rank: number;
  pokemon: Pokemon;
  value: number;
  unit: string;
  color: string;
  maxValue: number;
  onClick: () => void;
}) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, 8) : 0;
  const image = pokemon.svgImage || pokemon.image;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/50 active:bg-muted/70 transition-colors w-full text-left group cursor-pointer"
    >
      <span className="text-xs font-bold text-muted-foreground w-4 text-right">{rank}</span>
      <div className="w-7 h-7 rounded-md bg-linear-to-br from-slate-500 to-slate-800 flex items-center justify-center shrink-0">
        <img src={image} alt={pokemon.name} width={20} height={20} className="object-contain drop-shadow" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-semibold capitalize truncate">{pokemon.name}</span>
          <div className="flex items-center gap-1 ml-1 shrink-0">
            <MapPin className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {value} {unit}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  );
}
