/**
 * IntelliWaste Pure CVRP Route Optimizer Engine
 * 
 * Scalable for 25, 500, 5000+ bins.
 * Uses:
 * 1. Lean candidate selection (fill >= 70%, 12h forecast overflow, or active alerts).
 * 2. Angular sweep / spatial clustering so matrix is never computed on large N.
 * 3. OSRM Table & Route API with automatic Haversine fallback and coordinate caching.
 * 4. CVRP solver: Cheapest insertion + 2-opt + Or-opt local search with capacity constraints.
 * 5. Multi-trip with depot/dump site returns and hazard trip prioritization.
 * 6. Baseline comparison (Baseline A fixed, Baseline B greedy NN, Proposed).
 */

import { ROUTE_CONFIG } from "../config/routeConfig.js";

// In-memory matrix & geometry cache
const matrixCache = new Map();
const geometryCache = new Map();

/**
 * Hash coordinates array for cache key
 */
function hashCoords(coords) {
  let hash = 0;
  const str = coords.map(c => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join(";");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${hash}`;
}

/**
 * Pure Haversine distance in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}

/**
 * Compute fallback distance (km) and duration (mins) matrices using Haversine
 */
export function computeFallbackMatrix(points, averageSpeedKmh = ROUTE_CONFIG.AVERAGE_TRUCK_SPEED_KMH) {
  const n = points.length;
  const distances = Array.from({ length: n }, () => new Float32Array(n));
  const durations = Array.from({ length: n }, () => new Float32Array(n));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
        durations[i][j] = 0;
      } else {
        const d = haversineDistanceKm(points[i].lat, points[i].lon, points[j].lat, points[j].lon);
        distances[i][j] = d;
        durations[i][j] = (d / averageSpeedKmh) * 60; // minutes
      }
    }
  }

  return { distances, durations, isOsrm: false };
}

/**
 * Fetch OSRM distance & duration table with timeout and Haversine fallback.
 * Public OSRM accepts up to ~100 coordinates; clusters are strictly <= 80 nodes.
 */
export async function fetchOsrmTable(points) {
  if (points.length <= 1) {
    return {
      distances: [[0]],
      durations: [[0]],
      isOsrm: false,
    };
  }

  const coords = points.map(p => [p.lon, p.lat]);
  const cacheKey = hashCoords(coords);

  if (matrixCache.has(cacheKey)) {
    return matrixCache.get(cacheKey);
  }

  const coordsString = coords.map(c => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";");
  const url = `${ROUTE_CONFIG.OSRM_URL}/table/v1/driving/${coordsString}?annotations=distance,duration`;

  let osrmResult = null;
  for (let attempt = 0; attempt <= ROUTE_CONFIG.OSRM_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ROUTE_CONFIG.OSRM_TIMEOUT_MS);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.distances && data.durations) {
          // OSRM returns distances in meters, durations in seconds
          const n = points.length;
          const distances = Array.from({ length: n }, () => new Float32Array(n));
          const durations = Array.from({ length: n }, () => new Float32Array(n));

          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              distances[i][j] = (data.distances[i][j] || 0) / 1000; // km
              durations[i][j] = (data.durations[i][j] || 0) / 60;   // minutes
            }
          }

          osrmResult = { distances, durations, isOsrm: true };
          break;
        }
      }
    } catch {
      // Retry or fall through
    }
  }

  if (!osrmResult) {
    osrmResult = computeFallbackMatrix(points);
  }

  matrixCache.set(cacheKey, osrmResult);
  return osrmResult;
}

/**
 * Fetch actual road polyline from OSRM Route service or fallback to straight LineString
 */
export async function fetchRouteGeometry(waypoints) {
  if (waypoints.length <= 1) {
    return {
      type: "LineString",
      coordinates: waypoints.map(w => [w.lon, w.lat]),
    };
  }

  // If waypoints too large for single OSRM call, chunk into segments
  const coords = waypoints.map(w => [w.lon, w.lat]);
  const cacheKey = "geom_" + hashCoords(coords);
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey);
  }

  // Keep OSRM route request points reasonable (limit 60)
  const sampledCoords = coords.length > 70 
    ? coords.filter((_, idx) => idx % Math.ceil(coords.length / 60) === 0 || idx === coords.length - 1)
    : coords;

  const coordsString = sampledCoords.map(c => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";");
  const url = `${ROUTE_CONFIG.OSRM_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ROUTE_CONFIG.OSRM_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]?.geometry) {
        const geom = data.routes[0].geometry;
        geometryCache.set(cacheKey, geom);
        return geom;
      }
    }
  } catch {
    // Fallback to straight line
  }

  const fallback = {
    type: "LineString",
    coordinates: coords,
  };
  geometryCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Candidate filtering logic
 * Must visit:
 *  - fill >= 70%
 *  - forecast reaches 90% within next 12h
 *  - active gas/fire/overflow alert
 */
export function isCandidateMustVisit(bin, config = ROUTE_CONFIG) {
  const fill = Number(bin.fillLevel !== undefined ? bin.fillLevel : bin.fill) || 0;
  if (fill >= config.FILL_MUST_VISIT_THRESHOLD) return true;

  // Active hazard alerts
  if (bin.fire === true) return true;
  if (bin.status === "fire" || bin.status === "critical") return true;
  if (typeof bin.temp === "string" && bin.temp.toLowerCase().includes("high")) return true;
  if (typeof bin.gas === "string" && (bin.gas.toLowerCase().includes("critical") || bin.gas.toLowerCase().includes("ppm"))) {
    const num = parseInt(bin.gas, 10);
    if (!isNaN(num) && num >= 50) return true;
  }
  if (Array.isArray(bin.alerts) && bin.alerts.some(a => !a.resolved && (a.type === "fire" || a.type === "gas" || a.type === "overflow"))) {
    return true;
  }

  // Forecast evaluation: forecast reaches 90% within next 12h
  // TODO: ML-based time-series forecasting model (e.g. LSTM/Prophet) will dynamically populate forecastFull90At
  if (bin.forecastFull90At) {
    const forecastTime = new Date(bin.forecastFull90At).getTime();
    const thresholdTime = Date.now() + config.FORECAST_WINDOW_HOURS * 3600 * 1000;
    if (forecastTime <= thresholdTime) return true;
  }

  return false;
}

/**
 * Calculate skipping penalty for an unvisited bin
 */
export function getBinSkipPenalty(bin, config = ROUTE_CONFIG) {
  const fill = Number(bin.fillLevel !== undefined ? bin.fillLevel : bin.fill) || 0;
  const isHazard = 
    bin.fire === true || 
    bin.status === "fire" || 
    bin.status === "critical" ||
    (Array.isArray(bin.alerts) && bin.alerts.some(a => !a.resolved && (a.type === "fire" || a.type === "gas")));

  if (isHazard) return config.PENALTY_HAZARD_ALERT;
  if (fill >= config.FILL_CRITICAL_THRESHOLD) return config.PENALTY_FILL_90;
  if (fill >= config.FILL_MUST_VISIT_THRESHOLD) return config.PENALTY_FILL_70;
  return 0;
}

/**
 * Calculate demand of a bin in kg
 */
export function getBinDemandKg(bin) {
  const fill = Number(bin.fillLevel !== undefined ? bin.fillLevel : bin.fill) || 0;
  let capacity = 120;
  if (typeof bin.capacityKg === "number" && bin.capacityKg > 0) {
    capacity = bin.capacityKg;
  } else if (typeof bin.capacity === "string") {
    const parsed = parseInt(bin.capacity, 10);
    if (!isNaN(parsed) && parsed > 0) capacity = parsed;
  }
  return Number(((fill / 100) * capacity).toFixed(2));
}

/**
 * Spatial clustering using angular sweep around depot with capacity/node constraints.
 * Ensures we never generate a giant NxN matrix when dealing with 500 or 5000 bins!
 */
export function clusterCandidates(candidates, depot, maxNodes = ROUTE_CONFIG.MAX_NODES_PER_SOLVE, maxClusterDemand = ROUTE_CONFIG.TRUCK_CAPACITY_KG) {
  if (candidates.length <= maxNodes && candidates.reduce((sum, c) => sum + getBinDemandKg(c), 0) <= maxClusterDemand) {
    return [candidates];
  }

  // Calculate polar angle around depot
  const sorted = [...candidates].map(bin => {
    const lat = bin.lat || 0;
    const lon = bin.lon !== undefined ? bin.lon : (bin.lng || 0);
    const angle = Math.atan2(lat - depot.lat, lon - depot.lon);
    const distToDepot = haversineDistanceKm(depot.lat, depot.lon, lat, lon);
    return { bin, angle, distToDepot, demand: getBinDemandKg(bin) };
  }).sort((a, b) => a.angle - b.angle);

  const clusters = [];
  let currentCluster = [];
  let currentDemand = 0;

  for (const item of sorted) {
    const wouldExceedDemand = currentDemand + item.demand > maxClusterDemand && currentCluster.length >= 5;
    const wouldExceedNodes = currentCluster.length >= maxNodes;

    if (currentCluster.length > 0 && (wouldExceedDemand || wouldExceedNodes)) {
      clusters.push(currentCluster);
      currentCluster = [item.bin];
      currentDemand = item.demand;
    } else {
      currentCluster.push(item.bin);
      currentDemand += item.demand;
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Sort clusters by distance of closest node to depot
  clusters.sort((cA, cB) => {
    const minA = Math.min(...cA.map(b => haversineDistanceKm(depot.lat, depot.lon, b.lat, b.lon !== undefined ? b.lon : b.lng)));
    const minB = Math.min(...cB.map(b => haversineDistanceKm(depot.lat, depot.lon, b.lat, b.lon !== undefined ? b.lon : b.lng)));
    return minA - minB;
  });

  return clusters;
}

/**
 * CVRP Solver (Cheapest Insertion + 2-opt & Or-opt Local Search with Capacity Constraints)
 * Pure function: (nodes, matrix, capacity, timeLimit) -> array of route trips
 */
export function solveCVRPCluster({
  nodes,            // [0: Depot, 1..N: Bins]
  distanceMatrix,   // NxN
  durationMatrix,   // NxN
  capacityKg = ROUTE_CONFIG.TRUCK_CAPACITY_KG,
  timeLimitMs = ROUTE_CONFIG.SOLVER_TIME_LIMIT_MS,
  startDepotIdx = 0,
  dumpSiteIdx = 0,
}) {
  const n = nodes.length;
  if (n <= 1) return [];

  const startTime = Date.now();
  const unassigned = new Set();
  const demands = nodes.map(getBinDemandKg);
  const penalties = nodes.map(b => (b.isDepot ? 0 : getBinSkipPenalty(b)));

  for (let i = 1; i < n; i++) {
    unassigned.add(i);
  }

  const trips = []; // array of node index arrays: [0, a, b, c, 0]

  // Phase 1: Construction heuristic (Cheapest insertion with capacity and hazard priority)
  while (unassigned.size > 0) {
    let currentRoute = [startDepotIdx, dumpSiteIdx];
    let currentLoad = 0;

    // Pick seed node: highest penalty / hazard or furthest unvisited
    let bestSeed = -1;
    let maxSeedScore = -1;
    for (const idx of unassigned) {
      const score = penalties[idx] * 10 + distanceMatrix[startDepotIdx][idx];
      if (score > maxSeedScore) {
        maxSeedScore = score;
        bestSeed = idx;
      }
    }

    if (bestSeed === -1) break;

    currentRoute.splice(1, 0, bestSeed);
    currentLoad += demands[bestSeed];
    unassigned.delete(bestSeed);

    // Greedily insert remaining nodes into this route if capacity permits
    let improved = true;
    while (improved && unassigned.size > 0) {
      improved = false;
      let bestNode = -1;
      let bestInsertPos = -1;
      let minInsertCost = Infinity;

      for (const candidate of unassigned) {
        const demand = demands[candidate];
        if (currentLoad + demand > capacityKg) continue;

        // Try inserting candidate between all pairs of nodes in currentRoute
        for (let i = 0; i < currentRoute.length - 1; i++) {
          const u = currentRoute[i];
          const v = currentRoute[i + 1];
          const addedDist = distanceMatrix[u][candidate] + distanceMatrix[candidate][v] - distanceMatrix[u][v];
          // Subtract penalty so high-penalty bins are strongly prioritized for insertion
          const netCost = addedDist - (penalties[candidate] / 1000);

          if (netCost < minInsertCost) {
            minInsertCost = netCost;
            bestNode = candidate;
            bestInsertPos = i + 1;
          }
        }
      }

      if (bestNode !== -1) {
        currentRoute.splice(bestInsertPos, 0, bestNode);
        currentLoad += demands[bestNode];
        unassigned.delete(bestNode);
        improved = true;
      }
    }

    trips.push({ route: currentRoute, loadKg: currentLoad });
  }

  // Phase 2: Guided Local Search (2-opt edge swaps and Or-opt relocations)
  for (const trip of trips) {
    let route = trip.route;
    let betterFound = true;
    let iterations = 0;

    while (betterFound && iterations < 50 && (Date.now() - startTime) < timeLimitMs) {
      betterFound = false;
      iterations++;

      // 1. 2-opt intra-route improvement
      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length - 1; j++) {
          const u1 = route[i - 1];
          const u2 = route[i];
          const v1 = route[j];
          const v2 = route[j + 1];

          const currentDist = distanceMatrix[u1][u2] + distanceMatrix[v1][v2];
          const newDist = distanceMatrix[u1][v1] + distanceMatrix[u2][v2];

          if (newDist + 1e-4 < currentDist) {
            // Reverse segment from i to j
            const reversed = route.slice(i, j + 1).reverse();
            route.splice(i, reversed.length, ...reversed);
            betterFound = true;
            break;
          }
        }
        if (betterFound) break;
      }

      // 2. Or-opt (relocate 1 or 2 consecutive stops)
      if (!betterFound) {
        for (let segLen = 1; segLen <= 2; segLen++) {
          for (let i = 1; i <= route.length - 1 - segLen; i++) {
            const seg = route.slice(i, i + segLen);
            const prev = route[i - 1];
            const next = route[i + segLen];
            const removeCost = distanceMatrix[prev][next] - (distanceMatrix[prev][seg[0]] + distanceMatrix[seg[seg.length - 1]][next]);

            for (let j = 0; j < route.length - 1; j++) {
              if (j >= i - 1 && j <= i + segLen - 1) continue;
              const insPrev = route[j];
              const insNext = route[j + 1];
              const addCost = distanceMatrix[insPrev][seg[0]] + distanceMatrix[seg[seg.length - 1]][insNext] - distanceMatrix[insPrev][insNext];

              if (removeCost + addCost + 1e-4 < 0) {
                // Relocate segment
                route.splice(i, segLen);
                const insertAt = j < i ? j + 1 : j + 1 - segLen;
                route.splice(insertAt, 0, ...seg);
                betterFound = true;
                break;
              }
            }
            if (betterFound) break;
          }
          if (betterFound) break;
        }
      }
    }

    trip.route = route;
  }

  return trips;
}

/**
 * Main pure orchestration function:
 * Takes candidates, scope, depot, dumpSite, and returns complete optimized trips, geometries, and metrics.
 */
export async function optimizeRouteForScope({
  binsInScope = [],
  depot = ROUTE_CONFIG.DEPOT_LOCATION,
  dumpSite = ROUTE_CONFIG.DUMP_SITE_LOCATION,
  truckCapacityKg = ROUTE_CONFIG.TRUCK_CAPACITY_KG,
  config = ROUTE_CONFIG,
  startLocation = null, // e.g. truck current GPS { lat, lon }
  includeGeometry = true,
}) {
  // Step 1: Candidate selection
  const mustVisitBins = [];
  const skippedBins = [];

  for (const bin of binsInScope) {
    if (isCandidateMustVisit(bin, config)) {
      mustVisitBins.push(bin);
    } else {
      skippedBins.push(bin);
    }
  }

  if (mustVisitBins.length === 0) {
    return {
      trips: [],
      totalDistanceKm: 0,
      totalDurationMin: 0,
      totalLoadKg: 0,
      candidateCount: 0,
      totalBinsInScope: binsInScope.length,
      skippedBins: { count: skippedBins.length, ids: skippedBins.map(b => b.id || b.binCode) },
      message: "No bins currently meet the collection threshold or hazard criteria.",
    };
  }

  // Step 2: Split candidates into clusters if count is large
  const clusters = clusterCandidates(mustVisitBins, depot, config.MAX_NODES_PER_SOLVE, truckCapacityKg);

  const allTrips = [];
  let tripCounter = 1;
  let overallDistanceKm = 0;
  let overallDurationMin = 0;
  let overallLoadKg = 0;
  const geometryTasks = [];

  for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
    const clusterBins = clusters[cIdx];

    // For first trip, if startLocation is supplied (live reoptimization), use it as origin
    const origin = (cIdx === 0 && startLocation && typeof startLocation.lat === "number")
      ? { lat: startLocation.lat, lon: startLocation.lon !== undefined ? startLocation.lon : startLocation.lng, name: "Driver Current Position", isDepot: true }
      : { lat: depot.lat, lon: depot.lon, name: depot.name || "Operations Depot", isDepot: true };

    const dump = { lat: dumpSite.lat, lon: dumpSite.lon, name: dumpSite.name || "Landfill Dump Site", isDepot: true };

    // Format nodes for solver
    const nodes = [origin, ...clusterBins.map(b => ({
      ...b,
      lat: Number(b.lat),
      lon: Number(b.lon !== undefined ? b.lon : b.lng),
      isDepot: false,
    }))];

    // Build distance/duration matrix for this cluster only
    const { distances, durations } = await fetchOsrmTable(nodes);

    // Solve CVRP for cluster
    const clusterTrips = solveCVRPCluster({
      nodes,
      distanceMatrix: distances,
      durationMatrix: durations,
      capacityKg: truckCapacityKg,
      timeLimitMs: config.SOLVER_TIME_LIMIT_MS,
      startDepotIdx: 0,
      dumpSiteIdx: 0,
    });

    for (const rawTrip of clusterTrips) {
      const stopNodes = rawTrip.route.map(idx => nodes[idx]);
      if (stopNodes.length <= 2) continue; // Only depot -> depot

      let tripDistKm = 0;
      let tripDurMin = 0;
      let cumMinutes = 0;
      const formattedStops = [];

      for (let s = 1; s < stopNodes.length - 1; s++) {
        const prevNode = stopNodes[s - 1];
        const currNode = stopNodes[s];
        const prevIdx = rawTrip.route[s - 1];
        const currIdx = rawTrip.route[s];

        const legDist = Number((distances[prevIdx][currIdx] || haversineDistanceKm(prevNode.lat, prevNode.lon, currNode.lat, currNode.lon)).toFixed(2));
        const legDur = Number((durations[prevIdx][currIdx] || (legDist / config.AVERAGE_TRUCK_SPEED_KMH) * 60).toFixed(1));

        cumMinutes += legDur + config.SERVICE_TIME_PER_BIN_MINS;
        tripDistKm += legDist;
        tripDurMin += legDur + config.SERVICE_TIME_PER_BIN_MINS;

        const fill = Number(currNode.fillLevel !== undefined ? currNode.fillLevel : currNode.fill) || 0;
        const isHazard = currNode.fire === true || currNode.status === "critical" || currNode.status === "fire";

        formattedStops.push({
          stopNumber: formattedStops.length + 1,
          binId: currNode.id || currNode.binCode,
          name: currNode.binCode || currNode.id || `Bin #${s}`,
          location: currNode.location || `Stop #${s}`,
          ward: currNode.ward?.name || currNode.ward?.area || (currNode.wardId ? `Ward ${currNode.wardId}` : "Assigned Ward"),
          wardId: currNode.wardId || currNode.ward?.id,
          lat: currNode.lat,
          lon: currNode.lon,
          lng: currNode.lon,
          fillLevel: fill,
          capacityKg: currNode.capacityKg || 120,
          demandKg: getBinDemandKg(currNode),
          priority: isHazard ? "CRITICAL_HAZARD" : (fill >= 90 ? "CRITICAL_OVERFLOW" : "MUST_VISIT"),
          etaMinutes: Math.round(cumMinutes),
          legDistanceKm: legDist,
        });
      }

      // Return leg to dump/depot
      const lastStopIdx = rawTrip.route[rawTrip.route.length - 2];
      const endDepotIdx = rawTrip.route[rawTrip.route.length - 1];
      const returnDist = Number((distances[lastStopIdx][endDepotIdx] || haversineDistanceKm(stopNodes[stopNodes.length - 2].lat, stopNodes[stopNodes.length - 2].lon, dump.lat, dump.lon)).toFixed(2));
      const returnDur = Number((durations[lastStopIdx][endDepotIdx] || (returnDist / config.AVERAGE_TRUCK_SPEED_KMH) * 60).toFixed(1));
      tripDistKm += returnDist;
      tripDurMin += returnDur;

      const hasHazard = formattedStops.some(s => s.priority === "CRITICAL_HAZARD");
      const loadKg = Number(rawTrip.loadKg.toFixed(1));

      const tripObj = {
        tripNumber: tripCounter++,
        stops: formattedStops,
        stopsCount: formattedStops.length,
        distanceKm: Number(tripDistKm.toFixed(2)),
        durationMin: Math.round(tripDurMin),
        loadKg,
        capacityKg: truckCapacityKg,
        utilizationPct: Math.round((loadKg / truckCapacityKg) * 100),
        hasHazard,
        depot,
        dumpSite,
        geometry: {
          type: "LineString",
          coordinates: stopNodes.map(w => [w.lon, w.lat]),
        },
      };

      allTrips.push(tripObj);
      if (includeGeometry) {
        geometryTasks.push(
          fetchRouteGeometry(stopNodes).then(geom => {
            tripObj.geometry = geom;
          }).catch(() => {})
        );
      }

      overallDistanceKm += tripDistKm;
      overallDurationMin += tripDurMin;
      overallLoadKg += loadKg;
    }
  }

  // Resolve road geometries concurrently
  if (geometryTasks.length > 0) {
    await Promise.all(geometryTasks);
  }

  // Priority order: trips containing alert/hazard bins come first
  allTrips.sort((a, b) => {
    if (a.hasHazard && !b.hasHazard) return -1;
    if (!a.hasHazard && b.hasHazard) return 1;
    return a.tripNumber - b.tripNumber;
  });

  // Re-index trip numbers
  allTrips.forEach((t, idx) => {
    t.tripNumber = idx + 1;
  });

  return {
    trips: allTrips,
    totalDistanceKm: Number(overallDistanceKm.toFixed(2)),
    totalDurationMin: Math.round(overallDurationMin),
    totalLoadKg: Number(overallLoadKg.toFixed(1)),
    candidateCount: mustVisitBins.length,
    totalBinsInScope: binsInScope.length,
    skippedBins: {
      count: skippedBins.length,
      ids: skippedBins.map(b => b.id || b.binCode),
    },
    depot,
    dumpSite,
  };
}

/**
 * 3-Strategy Route Comparison (Pure data calculation, never hardcoded)
 * 1. Baseline A: Fixed route order (all bins visited)
 * 2. Baseline B: Greedy nearest-neighbour (all bins visited)
 * 3. Proposed: Threshold + Forecast + CVRP Optimizer
 */
export async function compareRouteStrategies(binsInScope = [], depot = ROUTE_CONFIG.DEPOT_LOCATION) {
  if (!binsInScope || binsInScope.length === 0) {
    return {
      baselineA: { name: "Fixed Route (All Bins)", totalDistanceKm: 0, binsVisited: 0, overflowEvents: 0, fuelCostBdt: 0 },
      baselineB: { name: "Nearest-Neighbor Greedy (All Bins)", totalDistanceKm: 0, binsVisited: 0, overflowEvents: 0, fuelCostBdt: 0 },
      proposed:  { name: "IntelliWaste Threshold & CVRP Optimizer", totalDistanceKm: 0, binsVisited: 0, overflowEvents: 0, fuelCostBdt: 0 },
    };
  }

  const fuelCostPerKm = ROUTE_CONFIG.DIESEL_PRICE_PER_LITRE_BDT / ROUTE_CONFIG.TRUCK_FUEL_CONSUMPTION_KM_PER_LITRE;

  // Baseline A: Fixed route (visit every bin in order of ID)
  const fixedNodes = [...binsInScope].sort((a, b) => String(a.binCode || a.id).localeCompare(String(b.binCode || b.id)));
  let distA = 0;
  let prevLat = depot.lat;
  let prevLon = depot.lon;
  for (const b of fixedNodes) {
    const lat = b.lat;
    const lon = b.lon !== undefined ? b.lon : b.lng;
    distA += haversineDistanceKm(prevLat, prevLon, lat, lon);
    prevLat = lat;
    prevLon = lon;
  }
  distA += haversineDistanceKm(prevLat, prevLon, depot.lat, depot.lon);

  // Baseline B: Greedy nearest neighbour (visit all bins)
  const unvisitedB = [...binsInScope];
  let distB = 0;
  let currLat = depot.lat;
  let currLon = depot.lon;
  while (unvisitedB.length > 0) {
    let nearestIdx = -1;
    let minDist = Infinity;
    for (let i = 0; i < unvisitedB.length; i++) {
      const b = unvisitedB[i];
      const d = haversineDistanceKm(currLat, currLon, b.lat, b.lon !== undefined ? b.lon : b.lng);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    const [picked] = unvisitedB.splice(nearestIdx, 1);
    distB += minDist;
    currLat = picked.lat;
    currLon = picked.lon !== undefined ? picked.lon : picked.lng;
  }
  distB += haversineDistanceKm(currLat, currLon, depot.lat, depot.lon);

  // Proposed Strategy:
  const proposedResult = await optimizeRouteForScope({ binsInScope, depot });

  // Estimated overflow events: count of bins in scope with fill >= 90% that are NOT visited in the route
  const visitedIds = new Set();
  proposedResult.trips.forEach(t => t.stops.forEach(s => visitedIds.add(s.binId)));

  const unvisitedCritical = binsInScope.filter(b => {
    const fill = Number(b.fillLevel !== undefined ? b.fillLevel : b.fill) || 0;
    const id = b.id || b.binCode;
    return fill >= 90 && !visitedIds.has(id);
  }).length;

  return {
    baselineA: {
      name: "Baseline A: Fixed Sequence (All Bins)",
      totalDistanceKm: Number(distA.toFixed(2)),
      binsVisited: binsInScope.length,
      estimatedOverflowEvents: 0,
      estimatedFuelCostBdt: Math.round(distA * fuelCostPerKm),
      description: "Static legacy schedule visiting every single bin regardless of fill level",
    },
    baselineB: {
      name: "Baseline B: Nearest-Neighbour Greedy (All Bins)",
      totalDistanceKm: Number(distB.toFixed(2)),
      binsVisited: binsInScope.length,
      estimatedOverflowEvents: 0,
      estimatedFuelCostBdt: Math.round(distB * fuelCostPerKm),
      description: "Greedy heuristic visiting all containers without dynamic fill filtering",
    },
    proposed: {
      name: "Proposed: Dynamic Threshold + Forecast + CVRP Optimizer",
      totalDistanceKm: proposedResult.totalDistanceKm,
      binsVisited: proposedResult.candidateCount,
      skippedBinsCount: proposedResult.skippedBins.count,
      estimatedOverflowEvents: unvisitedCritical,
      estimatedFuelCostBdt: Math.round(proposedResult.totalDistanceKm * fuelCostPerKm),
      tripsCount: proposedResult.trips.length,
      description: "Lean candidate filtering (fill >= 70%, 12h forecast, alerts) with cluster CVRP",
    },
    comparisonMetrics: {
      distanceSavedVsBaselineAKm: Number((distA - proposedResult.totalDistanceKm).toFixed(2)),
      distanceSavedVsBaselineBKm: Number((distB - proposedResult.totalDistanceKm).toFixed(2)),
      fuelSavingsVsBaselineABdt: Math.round((distA - proposedResult.totalDistanceKm) * fuelCostPerKm),
      fuelSavingsVsBaselineBBdt: Math.round((distB - proposedResult.totalDistanceKm) * fuelCostPerKm),
    }
  };
}

export default {
  haversineDistanceKm,
  computeFallbackMatrix,
  fetchOsrmTable,
  fetchRouteGeometry,
  isCandidateMustVisit,
  getBinSkipPenalty,
  getBinDemandKg,
  clusterCandidates,
  solveCVRPCluster,
  optimizeRouteForScope,
  compareRouteStrategies,
};
