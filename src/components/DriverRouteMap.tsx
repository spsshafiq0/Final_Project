import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import {
  Navigation,
  RefreshCw,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Layers,
  MapPin,
  Clock,
  ChevronRight,
  TrendingDown,
  Gauge,
  X,
  ExternalLink,
  Sliders,
  Check,
} from "lucide-react";
import api from "../lib/api";

interface DriverRouteMapProps {
  currentUser?: any;
  onRefreshStats?: () => void;
}

const TRIP_COLORS = [
  "#0284c7", // Sky/Blue
  "#f97316", // Bright Orange
  "#a855f7", // Purple
  "#10b981", // Emerald
  "#ec4899", // Pink
];

export default function DriverRouteMap({ currentUser, onRefreshStats }: DriverRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Driver Assignment State
  const assignment = useMemo(() => {
    return currentUser?.assignment || {
      cityCorporation: currentUser?.cityCorpId || currentUser?.cityCorp?.id || "cc-dncc",
      ward: currentUser?.wardId || currentUser?.ward?.id || null,
    };
  }, [currentUser]);

  const hasSpecificWard = Boolean(assignment.ward && assignment.ward !== "all");

  // Filter state for CC-only drivers
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("all");
  const [availableWards, setAvailableWards] = useState<any[]>([]);

  // Bins & Route State
  const [bins, setBins] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any | null>(null);
  const [activeTripIndex, setActiveTripIndex] = useState<number>(0);
  const [completedBinIds, setCompletedBinIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [alertToast, setAlertToast] = useState<string | null>(null);

  // Driver live location state
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Comparison Modal state
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<any | null>(null);
  const [loadingCompare, setLoadingCompare] = useState<boolean>(false);

  // Load Wards in Scope for filter chips
  useEffect(() => {
    if (!hasSpecificWard) {
      api.wards.getAll(assignment.cityCorporation).then(wards => {
        if (Array.isArray(wards)) {
          setAvailableWards(wards);
        }
      }).catch(() => {});
    }
  }, [assignment, hasSpecificWard]);

  // Geolocation tracking
  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          setDriverLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback to central Dhaka
          setDriverLocation({ lat: 23.8103, lng: 90.4125 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      setDriverLocation({ lat: 23.8103, lng: 90.4125 });
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch all bins in driver's scope
  const loadBins = useCallback(async () => {
    try {
      const wardParam = (!hasSpecificWard && selectedWardFilter !== "all") ? selectedWardFilter : undefined;
      const res = await api.routes.getBins({ ward: wardParam });
      if (res && Array.isArray(res.bins)) {
        setBins(res.bins);
      }
    } catch (e: any) {
      console.warn("[DriverRouteMap] Bins fetch notice:", e.message);
    }
  }, [hasSpecificWard, selectedWardFilter]);

  // Fetch or Compute Route
  const loadRoute = useCallback(async (forceOptimize = false) => {
    setLoading(true);
    try {
      const routeRes = forceOptimize
        ? await api.routes.optimize()
        : await api.routes.getCurrent().catch(() => api.routes.optimize());

      if (routeRes && Array.isArray(routeRes.trips)) {
        setRouteData(routeRes);
        setActiveTripIndex(0);
      }
    } catch (err: any) {
      console.error("[DriverRouteMap] Route optimization error:", err);
    } finally {
      setLoading(false);
      setOptimizing(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadBins();
    loadRoute();
  }, [loadBins, loadRoute]);

  // Real-time Event Listener Simulation
  useEffect(() => {
    // Listen for simulation or socket events
    const handleReopt = (e: any) => {
      const detail = e.detail || {};
      setAlertToast(detail.reason || "Urgent telemetry alert detected in your sector! AI Route re-optimized.");
      loadBins();
      loadRoute(true);
    };

    window.addEventListener("intelliwaste:reoptimize", handleReopt);
    return () => {
      window.removeEventListener("intelliwaste:reoptimize", handleReopt);
    };
  }, [loadBins, loadRoute]);

  // Handle Mark Collected
  const handleMarkCollected = async (binId: string) => {
    const updatedCompleted = [...completedBinIds, binId];
    setCompletedBinIds(updatedCompleted);

    // Dynamic re-optimization from current position
    setOptimizing(true);
    try {
      // 1. Immediately update bin in Neon PostgreSQL database to empty & collected
      await api.bins.update(binId, {
        fill: 0,
        fillLevel: 0,
        status: "normal",
        lastCollected: new Date().toISOString(),
      }).catch(() => null);

      // 2. Re-optimize the route from driver's current position without this bin
      const lat = driverLocation?.lat || 23.8103;
      const lng = driverLocation?.lng || 90.4125;
      const reoptRes = await api.routes.reoptimize({
        currentLat: lat,
        currentLon: lng,
        completedBinIds: updatedCompleted,
      });

      if (reoptRes && Array.isArray(reoptRes.trips)) {
        setRouteData(reoptRes);
      }
      onRefreshStats?.();
    } catch (err: any) {
      console.warn("[DriverRouteMap] Re-optimization notice:", err.message);
    } finally {
      setOptimizing(false);
    }
  };


  // Open 3-Strategy Comparison
  const handleOpenCompare = async () => {
    setShowCompareModal(true);
    setLoadingCompare(true);
    try {
      const comp = await api.routes.compare();
      setCompareData(comp);
    } catch (e: any) {
      console.warn("[Compare] Error:", e.message);
    } finally {
      setLoadingCompare(false);
    }
  };

  // ── Leaflet Map Setup & Render ──────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.8103, 90.4125],
        zoom: 13,
        zoomControl: false,
        preferCanvas: true, // Use Canvas renderer for thousands of bins!
      });

      // Dark Mode Tile Layer (CartoDB Dark Matter)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control to bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const canvasRenderer = L.canvas({ padding: 0.5 });
    const bounds = L.latLngBounds([]);

    // 1. Render All Bins in Scope (Skipped vs Candidate)
    const visitedBinIds = new Set<string>();
    if (routeData?.trips) {
      routeData.trips.forEach((t: any) => {
        t.stops.forEach((s: any) => visitedBinIds.add(String(s.binId)));
      });
    }

    // Render Skipped Bins (small, grey, subdued)
    bins.forEach(bin => {
      const isVisited = visitedBinIds.has(String(bin.id)) || visitedBinIds.has(String(bin.binCode));
      const lat = Number(bin.lat);
      const lon = Number(bin.lon !== undefined ? bin.lon : bin.lng);
      if (isNaN(lat) || isNaN(lon)) return;

      bounds.extend([lat, lon]);

      if (!isVisited) {
        // Small muted circle on canvas
        const skippedMarker = L.circleMarker([lat, lon], {
          renderer: canvasRenderer,
          radius: 4,
          fillColor: "#64748b",
          fillOpacity: 0.45,
          color: "#334155",
          weight: 1,
        });

        skippedMarker.bindPopup(`
          <div style="font-family:sans-serif; font-size:12px; color:#1e293b;">
            <strong>${bin.binCode || bin.id}</strong> (Skipped)<br/>
            Location: ${bin.location}<br/>
            Fill Level: <strong>${bin.fill}%</strong> (&lt; 70% threshold)<br/>
            Status: ${bin.status}
          </div>
        `);
        layers.addLayer(skippedMarker);
      }
    });

    // 2. Render Depot & Dump Site
    const depotCoords = routeData?.depot ? [routeData.depot.lat, routeData.depot.lon] : [23.8103, 90.4125];
    const dumpCoords = routeData?.dumpSite ? [routeData.dumpSite.lat, routeData.dumpSite.lon] : [23.8103, 90.4125];

    // Depot Marker
    const depotIcon = L.divIcon({
      className: "custom-depot-marker",
      html: `
        <div style="background:#eab308; color:#052e16; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(234,179,8,0.5); border:2px solid #ffffff; font-weight:bold; font-size:18px;">
          ★
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    const depotMarker = L.marker([depotCoords[0], depotCoords[1]], { icon: depotIcon });
    depotMarker.bindPopup(`
      <div style="font-family:sans-serif; font-size:12px; color:#1e293b;">
        <strong>Central Operations Depot</strong><br/>
        Route start and finish facility
      </div>
    `);
    layers.addLayer(depotMarker);
    bounds.extend([depotCoords[0], depotCoords[1]]);

    // 3. Render Multi-trip Road Polylines & Numbered Stop Markers
    if (routeData?.trips && routeData.trips.length > 0) {
      routeData.trips.forEach((trip: any, tIdx: number) => {
        const isCurrentTrip = tIdx === activeTripIndex;
        const tripColor = TRIP_COLORS[tIdx % TRIP_COLORS.length];

        // Draw Road Polyline (from OSRM GeoJSON geometry)
        if (trip.geometry?.coordinates) {
          const latLngs = trip.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const polyline = L.polyline(latLngs, {
            color: tripColor,
            weight: isCurrentTrip ? 6 : 3,
            opacity: isCurrentTrip ? 0.95 : 0.4,
            dashArray: isCurrentTrip ? undefined : "6, 6",
            lineCap: "round",
            lineJoin: "round",
          });

          polyline.bindPopup(`
            <div style="font-family:sans-serif; font-size:12px; color:#1e293b;">
              <strong>Trip #${trip.tripNumber}</strong><br/>
              Stops: ${trip.stopsCount}<br/>
              Distance: ${trip.distanceKm} km<br/>
              Estimated Time: ${trip.durationMin} mins<br/>
              Load: ${trip.loadKg} / ${trip.capacityKg} kg (${trip.utilizationPct}%)
            </div>
          `);
          layers.addLayer(polyline);
        }

        // Render Numbered Stop Markers in Visit Order
        trip.stops.forEach((stop: any) => {
          const isCollected = completedBinIds.includes(stop.binId);
          const isHazard = stop.priority === "CRITICAL_HAZARD";
          const isOverflow = stop.priority === "CRITICAL_OVERFLOW";

          const markerColor = isCollected
            ? "#16a34a"
            : isHazard
            ? "#ef4444"
            : isOverflow
            ? "#f97316"
            : tripColor;

          const markerHtml = `
            <div style="
              background:${markerColor};
              color:#ffffff;
              width:${isCurrentTrip ? "30px" : "24px"};
              height:${isCurrentTrip ? "30px" : "24px"};
              border-radius:50%;
              display:flex;
              align-items:center;
              justify-content:center;
              font-family:monospace;
              font-weight:bold;
              font-size:${isCurrentTrip ? "13px" : "11px"};
              border:2px solid #ffffff;
              box-shadow:0 3px 8px rgba(0,0,0,0.3);
              opacity:${isCollected ? "0.6" : "1"};
              ${isHazard ? "animation: pulse 1.5s infinite;" : ""}
            ">
              ${isCollected ? "✓" : stop.stopNumber}
            </div>
          `;

          const stopIcon = L.divIcon({
            className: "custom-stop-marker",
            html: markerHtml,
            iconSize: [isCurrentTrip ? 30 : 24, isCurrentTrip ? 30 : 24],
            iconAnchor: [isCurrentTrip ? 15 : 12, isCurrentTrip ? 15 : 12],
          });

          const stopMarker = L.marker([stop.lat, stop.lon], { icon: stopIcon });
          stopMarker.bindPopup(`
            <div style="font-family:sans-serif; font-size:12px; color:#1e293b; min-width:180px;">
              <div style="display:flex; align-items:center; justify-content:between; margin-bottom:4px;">
                <strong>Stop #${stop.stopNumber}</strong>
                <span style="font-size:10px; background:${markerColor}22; color:${markerColor}; padding:1px 6px; border-radius:10px; font-weight:bold;">
                  ${stop.priority}
                </span>
              </div>
              <div style="font-weight:600; color:#0f172a;">${stop.name}</div>
              <div style="color:#64748b; font-size:11px;">${stop.location} · ${stop.ward}</div>
              <div style="margin-top:6px; font-size:11px;">
                Fill Level: <strong>${stop.fillLevel}%</strong> (${stop.demandKg} kg)<br/>
                Leg Distance: <strong>${stop.legDistanceKm} km</strong> (~${stop.etaMinutes}m ETA)
              </div>
              <div style="margin-top:8px; display:flex; gap:6px;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}" target="_blank" rel="noreferrer" style="color:#0284c7; text-decoration:none; font-size:11px; font-weight:bold;">
                  🗺️ Google Directions
                </a>
              </div>
            </div>
          `);
          layers.addLayer(stopMarker);
          bounds.extend([stop.lat, stop.lon]);
        });
      });
    }

    // 4. Render Live Driver Location
    if (driverLocation) {
      const truckIcon = L.divIcon({
        className: "custom-truck-marker",
        html: `
          <div style="background:#16a34a; color:#ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px #4ade80; border:2px solid #ffffff;">
            🚚
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const truckMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: truckIcon });
      truckMarker.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; color:#1e293b;">
          <strong>Live Driver Location</strong><br/>
          Vehicle active in assigned sector
        </div>
      `);
      layers.addLayer(truckMarker);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [bins, routeData, activeTripIndex, completedBinIds, driverLocation]);

  const activeTrip = routeData?.trips?.[activeTripIndex] || routeData?.trips?.[0];

  return (
    <div className="space-y-4">
      {/* Alert Toast Banner */}
      {alertToast && (
        <div className="bg-red-500/20 border border-red-500/60 rounded-xl p-3.5 flex items-center justify-between text-xs text-red-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-2.5">
            <Flame size={18} className="text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-100 uppercase tracking-wide">Dynamic AI Re-Routing: </span>
              <span>{alertToast}</span>
            </div>
          </div>
          <button
            onClick={() => setAlertToast(null)}
            className="w-6 h-6 rounded-md hover:bg-red-500/30 flex items-center justify-center font-mono text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Driver Scope & Top Action Bar */}
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#16a34a]/20 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-display font-bold text-base">
                Driver Collection Route
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#16a34a]/20 text-[#86efac] border border-[#4ade80]/30">
                {hasSpecificWard ? `Ward Scope: ${assignment.ward}` : "Full City Corporation Scope"}
              </span>
            </div>
            <p className="text-xs text-[#4b7a5a] mt-0.5">
              Automated CVRP road route scoped to your assigned jurisdiction.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          <button
            onClick={handleOpenCompare}
            className="bg-[#061309] hover:bg-[#112d1b] border border-[#1a3d22] text-[#86efac] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sliders size={13} />
            <span>Benchmark Comparison</span>
          </button>

          <button
            onClick={() => loadRoute(true)}
            disabled={optimizing}
            className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
          >
            <RefreshCw size={13} className={optimizing ? "animate-spin" : ""} />
            <span>{optimizing ? "Optimizing..." : "Optimize Route"}</span>
          </button>
        </div>
      </div>

      {/* Ward Filter Chips (Only shown if driver has CC-wide scope) */}
      {!hasSpecificWard && availableWards.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-mono">
          <span className="text-[#4b7a5a] text-[11px] shrink-0">Filter by Ward:</span>
          <button
            onClick={() => setSelectedWardFilter("all")}
            className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
              selectedWardFilter === "all"
                ? "bg-[#16a34a] text-white border-[#4ade80]"
                : "bg-[#0d2414] text-[#86efac] border-[#1a3d22] hover:border-[#4ade80]/40"
            }`}
          >
            All Wards ({bins.length} bins)
          </button>
          {availableWards.map(w => (
            <button
              key={w.id}
              onClick={() => setSelectedWardFilter(w.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                selectedWardFilter === w.id
                  ? "bg-[#16a34a] text-white border-[#4ade80]"
                  : "bg-[#0d2414] text-[#86efac] border-[#1a3d22] hover:border-[#4ade80]/40"
              }`}
            >
              {w.name} ({w.area})
            </button>
          ))}
        </div>
      )}

      {/* Summary KPI Bar */}
      {routeData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-3">
            <div className="text-[#4b7a5a]">TOTAL DISTANCE</div>
            <div className="text-lg font-bold text-white mt-0.5">{routeData.totalDistanceKm} km</div>
            <div className="text-[11px] text-[#4ade80]">Estimated {routeData.totalDurationMin} mins</div>
          </div>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-3">
            <div className="text-[#4b7a5a]">COLLECTION STOPS</div>
            <div className="text-lg font-bold text-[#86efac] mt-0.5">
              {routeData.candidateCount} / {routeData.totalBinsInScope}
            </div>
            <div className="text-[11px] text-[#4b7a5a]">{routeData.skippedBins?.count || 0} below threshold</div>
          </div>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-3">
            <div className="text-[#4b7a5a]">TRIP PAYLOAD</div>
            <div className="text-lg font-bold text-[#facc15] mt-0.5">
              {activeTrip?.loadKg || 0} kg
            </div>
            <div className="text-[11px] text-[#86efac]">{activeTrip?.utilizationPct || 0}% truck capacity</div>
          </div>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-3">
            <div className="text-[#4b7a5a]">PROGRESS</div>
            <div className="text-lg font-bold text-[#4ade80] mt-0.5">
              {completedBinIds.length} / {routeData.candidateCount || 1}
            </div>
            <div className="text-[11px] text-[#86efac]">Bins marked collected</div>
          </div>
        </div>
      )}

      {/* Trip Tabs (Multi-Trip Support) */}
      {routeData?.trips && routeData.trips.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {routeData.trips.map((trip: any, idx: number) => {
            const isActive = idx === activeTripIndex;
            const tripColor = TRIP_COLORS[idx % TRIP_COLORS.length];
            return (
              <button
                key={trip.tripNumber}
                onClick={() => setActiveTripIndex(idx)}
                style={{ borderColor: isActive ? tripColor : undefined }}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0 border ${
                  isActive
                    ? "bg-[#112d1b] text-white shadow-md ring-1"
                    : "bg-[#0d2414] border-[#1a3d22] text-[#86efac] hover:border-[#4ade80]/40"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: tripColor }} />
                <span>Trip #{trip.tripNumber}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({trip.stopsCount} stops · {trip.distanceKm}km)
                </span>
                {trip.hasHazard && (
                  <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                    HAZARD
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Layout: Map + Responsive Side Panel / Bottom Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Leaflet Map Container */}
        <div className="lg:col-span-8 bg-[#0d2414] border border-[#1a3d22] rounded-2xl overflow-hidden relative shadow-md">
          {/* Legend Overlay */}
          <div className="absolute top-3 right-3 z-[1000] bg-[#061309]/90 backdrop-blur-md border border-[#1a3d22] rounded-xl p-2.5 text-[11px] font-mono text-[#86efac] shadow-lg space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Hazard / Alert (Priority #1)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Critical Fill (&ge; 70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 opacity-60" />
              <span>Skipped (&lt; 70% fill)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />
              <span>★ Operations Depot</span>
            </div>
          </div>

          <div ref={mapContainerRef} className="w-full h-[420px] sm:h-[540px]" />
        </div>

        {/* Side Panel: Ordered Stops List */}
        <div className="lg:col-span-4 bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-4 flex flex-col h-[540px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a3d22] mb-3">
            <div>
              <div className="text-white font-display font-bold text-sm">
                Trip #{activeTrip?.tripNumber || 1} Stop Sequence
              </div>
              <div className="text-[11px] text-[#4b7a5a] font-mono">
                {activeTrip?.stopsCount || 0} collection stops · {activeTrip?.distanceKm || 0} km total
              </div>
            </div>
            <span className="text-[10px] font-mono bg-[#16a34a]/20 text-[#86efac] px-2 py-0.5 rounded-md border border-[#4ade80]/30 font-bold">
              {activeTrip?.utilizationPct || 0}% Load
            </span>
          </div>

          {/* Stops Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {(!activeTrip?.stops || activeTrip.stops.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#4b7a5a]">
                <CheckCircle2 size={36} className="text-[#4ade80] mb-2 opacity-80" />
                <div className="text-white text-sm font-semibold">No Bins Need Collection</div>
                <div className="text-xs mt-1">All bins in your assigned sector are below threshold.</div>
              </div>
            ) : (
              activeTrip.stops.map((stop: any) => {
                const isCollected = completedBinIds.includes(stop.binId);
                const isHazard = stop.priority === "CRITICAL_HAZARD";

                return (
                  <div
                    key={stop.binId}
                    className={`border rounded-xl p-3 transition-all ${
                      isCollected
                        ? "bg-[#061309]/60 border-[#1a3d22] opacity-60"
                        : isHazard
                        ? "bg-red-950/20 border-red-500/50 shadow-xs"
                        : "bg-[#061309] border-[#1a3d22] hover:border-[#4ade80]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isCollected
                            ? "bg-[#16a34a] text-white"
                            : isHazard
                            ? "bg-red-500 text-white"
                            : "bg-[#1a3d22] text-[#86efac]"
                        }`}>
                          {isCollected ? "✓" : stop.stopNumber}
                        </span>
                        <div>
                          <div className="text-white text-xs font-bold font-mono">{stop.name}</div>
                          <div className="text-[11px] text-[#4b7a5a] truncate max-w-[150px]">{stop.location}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        stop.fillLevel >= 85 ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {stop.fillLevel}% fill
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#86efac] mt-2 pt-2 border-t border-[#1a3d22]/50">
                      <span>Leg: {stop.legDistanceKm} km (~{stop.etaMinutes}m ETA)</span>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Google Maps directions"
                          className="text-[#60a5fa] hover:underline flex items-center gap-1"
                        >
                          <Navigation size={11} />
                          <span>Nav</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleMarkCollected(stop.binId)}
                          disabled={isCollected}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            isCollected
                              ? "bg-transparent text-[#4b7a5a] cursor-default"
                              : "bg-[#16a34a]/30 hover:bg-[#16a34a] text-[#86efac] hover:text-white border border-[#4ade80]/40"
                          }`}
                        >
                          {isCollected ? "Collected" : "Mark Done"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Strategy Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a3d22] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#16a34a]/20 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80]">
                  <Sliders size={18} />
                </div>
                <div>
                  <div className="text-white font-display font-bold text-base">Route Optimization Benchmark</div>
                  <div className="text-xs text-[#4b7a5a]">Empirical evaluation across 3 routing strategies</div>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#1a3d22] flex items-center justify-center text-[#4b7a5a] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {loadingCompare ? (
              <div className="py-12 text-center text-xs text-[#86efac] font-mono flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-[#4ade80]" />
                Calculating benchmark strategies from real data...
              </div>
            ) : compareData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Baseline A */}
                  <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4">
                    <div className="text-[11px] font-mono text-[#4b7a5a]">BASELINE A</div>
                    <div className="text-sm font-bold text-white mt-1">Fixed Sequence</div>
                    <div className="text-lg font-bold text-red-400 mt-2 font-mono">
                      {compareData.baselineA.totalDistanceKm} km
                    </div>
                    <div className="text-xs text-[#4b7a5a] mt-1">
                      Visits all {compareData.baselineA.binsVisited} bins
                    </div>
                    <div className="text-xs text-[#facc15] font-mono mt-2">
                      Est. Fuel: ৳{compareData.baselineA.estimatedFuelCostBdt}
                    </div>
                  </div>

                  {/* Baseline B */}
                  <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4">
                    <div className="text-[11px] font-mono text-[#4b7a5a]">BASELINE B</div>
                    <div className="text-sm font-bold text-white mt-1">Greedy Nearest</div>
                    <div className="text-lg font-bold text-orange-400 mt-2 font-mono">
                      {compareData.baselineB.totalDistanceKm} km
                    </div>
                    <div className="text-xs text-[#4b7a5a] mt-1">
                      Visits all {compareData.baselineB.binsVisited} bins
                    </div>
                    <div className="text-xs text-[#facc15] font-mono mt-2">
                      Est. Fuel: ৳{compareData.baselineB.estimatedFuelCostBdt}
                    </div>
                  </div>

                  {/* Proposed */}
                  <div className="bg-[#061309] border border-[#4ade80]/60 rounded-xl p-4 shadow-lg shadow-[#16a34a]/10">
                    <div className="text-[11px] font-mono text-[#4ade80]">PROPOSED</div>
                    <div className="text-sm font-bold text-white mt-1">Dynamic CVRP</div>
                    <div className="text-lg font-bold text-[#4ade80] mt-2 font-mono">
                      {compareData.proposed.totalDistanceKm} km
                    </div>
                    <div className="text-xs text-[#86efac] mt-1">
                      {compareData.proposed.binsVisited} candidates ({compareData.proposed.skippedBinsCount} skipped)
                    </div>
                    <div className="text-xs text-[#4ade80] font-mono mt-2 font-bold">
                      Est. Fuel: ৳{compareData.proposed.estimatedFuelCostBdt}
                    </div>
                  </div>
                </div>

                {/* Savings Summary Banner */}
                {compareData.comparisonMetrics && (
                  <div className="bg-[#112d1b] border border-[#4ade80]/40 rounded-xl p-4 text-xs font-mono space-y-2">
                    <div className="text-[#4ade80] font-bold flex items-center gap-1.5">
                      <TrendingDown size={14} />
                      <span>Empirical Savings vs Static Baseline A:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-white">
                      <div>
                        Distance Saved:{" "}
                        <strong className="text-[#4ade80]">
                          {compareData.comparisonMetrics.distanceSavedVsBaselineAKm} km
                        </strong>
                      </div>
                      <div>
                        Fuel Cost Saved:{" "}
                        <strong className="text-[#facc15]">
                          ৳{compareData.comparisonMetrics.fuelSavingsVsBaselineABdt} BDT
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
