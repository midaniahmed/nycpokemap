'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { usePokemonStore } from '@/lib/store';
import { DashboardHeader } from './dashboard-header';
import { Search, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// NYC coordinates
const NYC_CENTER = { lat: 40.7128, lng: -74.006 };
const INITIAL_ZOOM = 12;
const GROUP_OVER = 5;

interface PokemonMapProps {
  onToggleSidebar?: () => void;
  onToggleAnalytics?: () => void;
}

export function PokemonMap({ onToggleSidebar, onToggleAnalytics }: PokemonMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const initialFitDone = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const { pokemon: allPokemon, getFilteredPokemon, loading, focusTarget, clearFocusTarget } = usePokemonStore();
  const storeFiltered = getFilteredPokemon();

  // Apply local map search on top of store filters
  const filteredPokemon = useMemo(() => {
    if (!mapSearchQuery.trim()) return storeFiltered;
    const q = mapSearchQuery.trim().toLowerCase();
    return storeFiltered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [storeFiltered, mapSearchQuery]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = L.map(mapContainer.current, { zoomControl: false }).setView([NYC_CENTER.lat, NYC_CENTER.lng], INITIAL_ZOOM);
      L.control.zoom({ position: 'topleft' }).addTo(map.current);

      // Add OpenStreetMap tiles (free, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current);

      console.log('[v0] Map initialized successfully');
    } catch (error) {
      console.error('[v0] Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when filtered Pokemon changes
  useEffect(() => {
    if (!map.current) return;

    // Remove previous cluster group
    if (clusterGroupRef.current) {
      map.current.removeLayer(clusterGroupRef.current);
    }

    // Create a new cluster group
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Marker gradient
    const markerGradient = 'linear-gradient(135deg, #ef4444, #dc2626)';
    const headerGradient = 'linear-gradient(90deg, #858E96, #60696B)';

    // Add markers to the cluster group
    filteredPokemon.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'pokemon-marker';
      el.style.cssText = `
        background: ${markerGradient};
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 2.5px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08);
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        transition: transform 0.15s ease;
      `;
      el.textContent = p.id;

      const customIcon = L.divIcon({
        html: el,
        className: 'pokemon-marker-container',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([p.lat, p.lng], {
        icon: customIcon,
        pokemonId: p.id,
        pokemonImage: p.svgImage || p.image,
        pokemonName: p.name,
        pokemonCp: p.cp,
        pokemonAttack: p.attack,
        pokemonDefence: p.defence,
        pokemonDespawn: p.despawn,
        pokemonShiny: p.shiny,
        pokemonCustom: p.custom,
        pokemonMighty: p.mighty,
        pokemonForm: p.form || 0,
      } as any);

      // Build enhanced individual popup
      const remaining = p.despawn ? p.despawn - Math.floor(Date.now() / 1000) : null;


      // Stat bars
      const maxStat = 300;
      const statBar = (label: string, value: number | undefined, color: string) => {
        if (value === undefined || value === null || value === -1) return '';
        const pct = Math.min((value / maxStat) * 100, 100);
        return `<div style="display:flex; align-items:center; gap:6px; margin-top:3px;">
          <span style="font-size:10px; font-weight:600; color:#6b7280; width:28px; text-align:right;">${label}</span>
          <div style="flex:1; height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${color}; border-radius:3px; transition:width 0.3s ease;"></div>
          </div>
          <span style="font-size:10px; font-weight:700; color:#374151; width:28px;">${value}</span>
        </div>`;
      };

      const atkBar = statBar('ATK', p.attack, '#ef4444');
      const defBar = statBar('DEF', p.defence, '#3b82f6');

      // CP display
      const cpSection = p.cp !== undefined && p.cp !== null && p.cp !== -1
        ? `<div style="
            display:inline-flex; align-items:center; gap:4px;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white; padding: 3px 10px; border-radius: 10px;
            font-size: 12px; font-weight: 800; letter-spacing: 0.3px;
            box-shadow: 0 2px 6px rgba(59,130,246,0.35);
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            CP ${p.cp}
          </div>`
        : '';

      // Timer
      let timerSection = '';
      if (remaining !== null) {
        if (remaining > 0) {
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          const urgentColor = remaining < 300 ? '#ef4444' : remaining < 600 ? '#f59e0b' : '#10b981';
          timerSection = `<div style="
            display:flex; align-items:center; justify-content:center; gap:4px;
            padding: 4px 0; margin-top: 4px;
            font-size: 11px; font-weight: 600; color: ${urgentColor};
            border-top: 1px solid #f3f4f6;
          ">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${urgentColor}" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${mins}m ${secs}s remaining
          </div>`;
        } else {
          timerSection = `<div style="
            display:flex; align-items:center; justify-content:center; gap:4px;
            padding: 4px 0; margin-top: 4px; font-size: 11px; font-weight: 700;
            color: #ef4444; border-top: 1px solid #f3f4f6;
          ">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Despawned
          </div>`;
        }
      }

      const hasStats = atkBar || defBar;

      const popupContent = `
        <div style="
          width: 200px; border-radius: 14px; overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        ">
          <!-- Header -->
          <div style="
            background: ${headerGradient};
            padding: 12px 12px 16px; text-align: center;
            position: relative;
          ">
            <img src="${p.svgImage || p.image}" width="72" height="72"
              style="display:block; margin:0 auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));"
            />
            <div style="
              font-size: 15px; font-weight: 800; color: white;
              margin-top: 6px; text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">${p.name}</div>
            <div style="
              font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.75);
              margin-top: 1px;
            ">#${p.id}</div>
          </div>

          <!-- Body -->
          <div style="background: white; padding: 10px 12px 8px;">
            <!-- CP -->
            <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
              ${cpSection}
            </div>

            <!-- Badges -->
            ${(() => {
              const badges: string[] = [];
              if (p.shiny) badges.push(`<span style="
                display:inline-flex; align-items:center; gap:2px;
                padding:2px 7px; border-radius:10px; font-size:10px; font-weight:700;
                background: linear-gradient(135deg, #fbbf24, #f59e0b); color:#78350f;
                box-shadow: 0 1px 3px rgba(245,158,11,0.3);
              ">✨ Shiny</span>`);
              if (p.mighty) badges.push(`<span style="
                display:inline-flex; align-items:center; gap:2px;
                padding:2px 7px; border-radius:10px; font-size:10px; font-weight:700;
                background: linear-gradient(135deg, #ef4444, #dc2626); color:#fff;
                box-shadow: 0 1px 3px rgba(239,68,68,0.3);
              ">💪 Mighty</span>`);
              if (p.custom) badges.push(`<span style="
                display:inline-flex; align-items:center; gap:2px;
                padding:2px 7px; border-radius:10px; font-size:10px; font-weight:700;
                background: linear-gradient(135deg, #8b5cf6, #7c3aed); color:#fff;
                box-shadow: 0 1px 3px rgba(139,92,246,0.3);
              ">⭐ Custom</span>`);
              if (p.form !== undefined && p.form !== null && p.form > 0) badges.push(`<span style="
                display:inline-flex; align-items:center; gap:2px;
                padding:2px 7px; border-radius:10px; font-size:10px; font-weight:700;
                background: #e0e7ff; color:#3730a3;
              ">Form ${p.form}</span>`);
              return badges.length > 0 ? `<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:4px; margin-top:6px;">${badges.join('')}</div>` : '';
            })()}

            <!-- Location -->
            <div style="margin-top:8px; border-top:1px solid #f3f4f6; padding-top:8px;">
              <!--
                <div style="display:flex; align-items:center; gap:4px; margin-bottom:5px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style="font-size:10px; font-weight:600; color:#6b7280; font-variant-numeric:tabular-nums;">
                    ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}
                  </span>
                </div>
              -->
              <div
                class="pokemon-copy-btn"
                data-coords="${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}"
                style="
                  display:flex; align-items:center; justify-content:center; gap:5px;
                  padding: 7px 10px; border-radius: 8px;
                  background: #6366f1; cursor: pointer;
                  transition: opacity 0.15s;
                "
                title="Copy coordinates to clipboard"
              >
                <svg class="copy-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <svg class="check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><polyline points="20 6 9 17 4 12"/></svg>
                <span class="copy-label" style="font-size:11px; font-weight:700; color:white; letter-spacing:0.2px;">Copy Location</span>
              </div>
            </div>

            <!-- Timer -->
            ${timerSection}
          </div>
        </div>`;

      const popup = L.popup({
        offset: [0, -14],
        closeButton: false,
        className: 'pokemon-enhanced-popup',
        maxWidth: 220,
        minWidth: 200,
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // Attach copy handler when popup opens
      marker.on('popupopen', () => {
        const popupEl = popup.getElement();
        if (!popupEl) return;
        const copyBtn = popupEl.querySelector('.pokemon-copy-btn') as HTMLElement | null;
        if (copyBtn && !copyBtn.dataset.bound) {
          copyBtn.dataset.bound = '1';
          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const coords = copyBtn.dataset.coords || '';
            navigator.clipboard.writeText(coords).then(() => {
              const copyIcon = copyBtn.querySelector('.copy-icon') as HTMLElement;
              const checkIcon = copyBtn.querySelector('.check-icon') as HTMLElement;
              const label = copyBtn.querySelector('.copy-label') as HTMLElement;
              if (copyIcon) copyIcon.style.display = 'none';
              if (checkIcon) checkIcon.style.display = '';
              if (label) label.textContent = 'Copied!';
              copyBtn.style.background = '#10b981';
              setTimeout(() => {
                if (copyIcon) copyIcon.style.display = '';
                if (checkIcon) checkIcon.style.display = 'none';
                if (label) label.textContent = 'Copy Location';
                copyBtn.style.background = '#6366f1';
              }, 1400);
            });
          });
        }
      });

      // Open popup on hover, but keep it open so users can interact with it (copy location etc.)
      marker.on('mouseover', () => marker.openPopup());
      marker.on('click', () => marker.openPopup());

      // Only close popup on mouseout if the mouse hasn't moved into the popup itself
      marker.on('mouseout', (e: any) => {
        const popupEl = popup.getElement();
        if (!popupEl) {
          marker.closePopup();
          return;
        }
        // Small delay to let the mouse reach the popup
        setTimeout(() => {
          if (!popupEl.matches(':hover')) {
            marker.closePopup();
          } else {
            // Close when leaving the popup
            const closeHandler = () => {
              marker.closePopup();
              popupEl.removeEventListener('mouseleave', closeHandler);
            };
            popupEl.addEventListener('mouseleave', closeHandler);
          }
        }, 100);
      });

      clusterGroup.addLayer(marker);
    });

    // Show tooltip with Pokemon images on cluster hover
    clusterGroup.on('clustermouseover', (e: any) => {
      const cluster = e.layer;
      const markers = cluster.getAllChildMarkers();
      const maxShow = 6;

      // Get unique Pokémon by ID
      const uniqueMap = new Map();
      markers.forEach((m: any) => {
        const pokemonId = m.options.pokemonId;
        if (!uniqueMap.has(pokemonId)) {
          uniqueMap.set(pokemonId, m);
        }
      });

      const uniqueMarkers = Array.from(uniqueMap.values());
      const totalInCluster = markers.length;
      const uniqueCount = uniqueMarkers.length;

      const items = uniqueMarkers
        .slice(0, maxShow)
        .map((m: any) => {
          const cp = m.options.pokemonCp;
          const isShiny = m.options.pokemonShiny;
          const isMighty = m.options.pokemonMighty;
          const isCustom = m.options.pokemonCustom;
          const form = m.options.pokemonForm;

          const cpBadge = cp !== undefined && cp !== null && cp !== -1
            ? `<span style="
                font-size:9px; font-weight:700; color:#3b82f6;
                background: #eff6ff; padding: 1px 5px; border-radius: 6px;
              ">CP ${cp}</span>`
            : '';

          const indicators = [];
          if (isShiny) indicators.push('<span title="Shiny" style="color: #f59e0b;">✨</span>');
          if (isMighty) indicators.push('<span title="Mighty" style="color: #ef4444;">💪</span>');
          if (isCustom) indicators.push('<span title="Custom" style="color: #8b5cf6;">⭐</span>');
          if (form !== undefined && form !== null && form > 0) {
            indicators.push(`<span style="font-size: 8px; font-weight: 600; color: #6366f1; background: #e0e7ff; padding: 0px 4px; border-radius: 4px;">F${form}</span>`);
          }

          const indicatorsHtml = indicators.length > 0
            ? `<div style="display:flex; align-items:center; gap:2px; margin-left: auto;">${indicators.join('')}</div>`
            : '';

          return `<div style="
            display: flex; align-items: center; gap: 8px;
            padding: 6px 8px; border-radius: 10px;
            background: white;
            border: 1px solid #f3f4f6;
            transition: background 0.15s;
          ">
            <div style="
              flex-shrink: 0; width: 40px; height: 40px;
              border-radius: 10px; background: ${headerGradient};
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            ">
              <img src="${m.options.pokemonImage}" width="30" height="30"
                style="object-fit:contain; filter: ${isShiny ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))'};"
              />
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                <div style="font-size:12px; font-weight:700; color:#1f2937; line-height:1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${m.options.pokemonName}
                </div>
                ${indicatorsHtml}
              </div>
              <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
                ${cpBadge}
              </div>
            </div>
            <span style="font-size:10px; font-weight:600; color:#9ca3af;">#${m.options.pokemonId}</span>
          </div>`;
        })
        .join('');

      const remaining = uniqueCount - maxShow;
      const extra = remaining > 0
        ? `<div style="
            text-align:center; font-size:11px; font-weight:600;
            color:#6b7280; padding:6px; margin-top:2px;
            background: #f9fafb; border-radius:8px;
          ">+${remaining} more unique species</div>`
        : '';

      const html = `<div style="
        width: 260px; padding: 10px;
        background: #f8fafc;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header -->
        <div style="
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:8px; padding:0 4px;
        ">
          <span style="font-size:12px; font-weight:800; color:#1f2937;">
            ${totalInCluster} Pokémon
          </span>
          <span style="
            font-size:10px; font-weight:600; color:#6b7280;
            background:#e5e7eb; padding:2px 7px; border-radius:8px;
          ">${uniqueCount} unique</span>
        </div>

        <!-- List -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${items}
          ${extra}
        </div>
      </div>`;

      cluster.bindTooltip(html, { direction: 'top', offset: [0, -10], className: 'pokemon-cluster-tooltip' }).openTooltip();
    });
    clusterGroup.on('clustermouseout', (e: any) => {
      e.layer.unbindTooltip();
    });

    map.current.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Auto-fit bounds only on initial load
    if (!initialFitDone.current && filteredPokemon.length > 0 && map.current) {
      const bounds = clusterGroup.getBounds();
      map.current.fitBounds(bounds, { padding: [50, 50] });
      initialFitDone.current = true;
    }
  }, [filteredPokemon]);

  // React to focus target from analytics drawer
  useEffect(() => {
    if (!focusTarget || !map.current || !clusterGroupRef.current) return;

    const m = map.current;
    const cluster = clusterGroupRef.current;

    if (focusTarget.type === 'pokemon') {
      // Fly to the specific Pokemon location
      m.flyTo([focusTarget.lat, focusTarget.lng], 17, { duration: 1.2 });

      // After flying, find the matching marker and open its popup
      m.once('moveend', () => {
        const layers = cluster.getLayers() as L.Marker[];
        const target = layers.find((layer: any) => {
          const ll = layer.getLatLng();
          return (
            ll.lat === focusTarget.lat &&
            ll.lng === focusTarget.lng &&
            layer.options.pokemonId === focusTarget.id
          );
        });

        if (target) {
          // Use zoomToShowLayer to unspiderfy clusters if needed, then open popup
          cluster.zoomToShowLayer(target as any, () => {
            target.openPopup();
          });
        }
      });
    } else if (focusTarget.type === 'species') {
      // Collect all instances of this species and fit bounds around them
      const matching = filteredPokemon.filter((p) => p.name === focusTarget.name);
      if (matching.length > 0) {
        const bounds = L.latLngBounds(matching.map((p) => [p.lat, p.lng] as [number, number]));
        m.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 1.2 });

        // If only one instance, open its popup
        if (matching.length === 1) {
          m.once('moveend', () => {
            const layers = cluster.getLayers() as L.Marker[];
            const target = layers.find((layer: any) => {
              const ll = layer.getLatLng();
              return ll.lat === matching[0].lat && ll.lng === matching[0].lng;
            });
            if (target) {
              cluster.zoomToShowLayer(target as any, () => {
                target.openPopup();
              });
            }
          });
        }
      }
    }

    clearFocusTarget();
  }, [focusTarget, clearFocusTarget, filteredPokemon]);

  return (
    <div className="relative w-full h-full flex flex-col bg-muted/30">
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      <DashboardHeader onToggleSidebar={onToggleSidebar} onToggleAnalytics={onToggleAnalytics} />

      {/* Map search bar - top center */}
      <div className="absolute top-2 md:top-2 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-6rem)] max-w-xs sm:max-w-sm pointer-events-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full h-10 pl-9 pr-9 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
          {mapSearchQuery && (
            <button
              onClick={() => {
                setMapSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {mapSearchQuery.trim() && (
          <div className="mt-1.5 text-center">
            <span className="inline-block text-[11px] font-medium text-muted-foreground bg-background/70 backdrop-blur-xl px-2.5 py-0.5 rounded-full border border-border/40 shadow-sm">
              {filteredPokemon.length} result{filteredPokemon.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="bg-background/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-foreground">Loading Pokémon...</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {/* {!loading && filteredPokemon.length === 0 && allPokemon.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-xs bg-background/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/40 pointer-events-auto">
          <p className="text-sm text-muted-foreground text-center md:text-left">No Pokémon found with current filters</p>
        </div>
      )} */}
    </div>
  );
}
