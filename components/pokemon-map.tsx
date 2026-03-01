'use client';

import { useEffect, useRef } from 'react';
import { usePokemonStore } from '@/lib/store';
import { DashboardHeader } from './dashboard-header';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// NYC coordinates
const NYC_CENTER = { lat: 40.7128, lng: -74.006 };
const INITIAL_ZOOM = 12;
const GROUP_OVER = 5;

export function PokemonMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const initialFitDone = useRef(false);

  const { pokemon: allPokemon, getFilteredPokemon, loading } = usePokemonStore();
  const filteredPokemon = getFilteredPokemon();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = L.map(mapContainer.current).setView([NYC_CENTER.lat, NYC_CENTER.lng], INITIAL_ZOOM);

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

    // Add markers to the cluster group
    filteredPokemon.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'pokemon-marker';
      el.style.cssText = `
        background-color: #ef4444;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 12px;
        font-weight: bold;
        color: white;
      `;
      el.textContent = p.id;

      const customIcon = L.divIcon({
        html: el,
        className: 'pokemon-marker-container',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon, pokemonId: p.id, pokemonImage: p.svgImage, pokemonName: p.name } as any);

      const remaining = p.despawn ? p.despawn - Math.floor(Date.now() / 1000) : null;
      let remainingText = '';
      if (remaining !== null) {
        if (remaining > 0) {
          remainingText = `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${Math.floor(remaining / 60)}m ${remaining % 60}s remaining</div>`;
        } else {
          remainingText = `<div style="font-size: 12px; color: #ef4444; margin-top: 4px;">Expired</div>`;
        }
      }

      const cpText = p.cp !== undefined && p.cp !== null && p.cp !== -1 ? `<div style="font-size: 14px; font-weight: 600; color: #2563eb; margin-top: 4px;">CP: ${p.cp}</div>` : '';

      const popup = L.popup({ offset: [0, -12] }).setContent(
        `<div style="text-align:center; padding: 4px;"><img src="${p.svgImage || p.image}" width="64" height="64" style="display: block; margin: 0 auto;" /><div style="font-size: 14px; font-weight: 600; margin-top: 4px;">${p.name}</div>${cpText}${remainingText}</div>`,
      );
      marker.bindPopup(popup);

      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());

      clusterGroup.addLayer(marker);
    });

    // Show tooltip with Pokemon images and IDs on cluster hover
    clusterGroup.on('clustermouseover', (e: any) => {
      const cluster = e.layer;
      const markers = cluster.getAllChildMarkers();
      const maxShow = 9;

      // Get unique Pokémon by ID
      const uniqueMap = new Map();
      markers.forEach((m: any) => {
        const pokemonId = m.options.pokemonId;
        if (!uniqueMap.has(pokemonId)) {
          uniqueMap.set(pokemonId, m);
        }
      });

      const uniqueMarkers = Array.from(uniqueMap.values());
      const items = uniqueMarkers
        .slice(0, maxShow)
        .map(
          (m: any) =>
            `<div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 8px;
          transition: transform 0.2s;
        ">
          <img
            src="${m.options.pokemonImage}"
            width="64"
            height="64"
            style="
              image-rendering: pixelated;
              object-fit: contain;
            "
          />
          <span style="
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            margin-top: 4px;
          ">#${m.options.pokemonId}</span>
        </div>`,
        )
        .join('');

      const extra =
        uniqueMarkers.length > maxShow
          ? `<div style="
          grid-column: 1 / -1;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
          margin-top: 4px;
        ">+${uniqueMarkers.length - maxShow} more unique</div>`
          : '';

      const html = `<div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          min-width: 280px;
          max-width: 280px;
        ">
          ${items}
          ${extra}
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

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-100">
      <DashboardHeader />
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading Pokémon...</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPokemon.length === 0 && allPokemon.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg pointer-events-auto">
          <p className="text-sm text-muted-foreground">No Pokémon found with current filters</p>
        </div>
      )}
    </div>
  );
}
