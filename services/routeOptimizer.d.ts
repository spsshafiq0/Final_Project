export interface Stop {
  binId: string;
  name: string;
  location: string;
  ward: string;
  lat: number;
  lon: number;
  fillLevel: number;
  demandKg: number;
  priority: string;
  etaMinutes: number;
  legDistanceKm: number;
  alerts?: any[];
  stopNumber: number;
}

export interface Trip {
  tripNumber: number;
  stops: Stop[];
  stopsCount: number;
  distanceKm: number;
  durationMin: number;
  loadKg: number;
  capacityKg: number;
  utilizationPct: number;
  hasHazard: boolean;
  depot?: { lat: number; lon: number; name?: string };
  dumpSite?: { lat: number; lon: number; name?: string };
  geometry?: {
    type: string;
    coordinates: number[][];
  };
}

export interface RouteOptimizationResult {
  trips: Trip[];
  totalDistanceKm: number;
  totalDurationMin: number;
  totalLoadKg: number;
  candidateCount: number;
  totalBinsInScope: number;
  skippedBins: {
    count: number;
    ids: string[];
  };
  depot?: { lat: number; lon: number; name?: string };
  dumpSite?: { lat: number; lon: number; name?: string };
  message?: string;
}

export interface StrategyComparison {
  baselineA: {
    name: string;
    totalDistanceKm: number;
    binsVisited: number;
    estimatedOverflowEvents: number;
    estimatedFuelCostBdt: number;
    description: string;
  };
  baselineB: {
    name: string;
    totalDistanceKm: number;
    binsVisited: number;
    estimatedOverflowEvents: number;
    estimatedFuelCostBdt: number;
    description: string;
  };
  proposed: {
    name: string;
    totalDistanceKm: number;
    binsVisited: number;
    estimatedOverflowEvents: number;
    estimatedFuelCostBdt: number;
    candidateCount: number;
    skippedBinsCount: number;
    tripsCount: number;
    description: string;
  };
  comparisonMetrics?: {
    distanceSavedVsBaselineAKm: number;
    distanceSavedVsBaselineBKm: number;
    fuelSavingsVsBaselineABdt: number;
    fuelSavingsVsBaselineBBdt: number;
  };
}

export interface OptimizeRouteOptions {
  binsInScope: any[];
  depot?: { lat: number; lon: number; name?: string };
  dumpSite?: { lat: number; lon: number; name?: string };
  truckCapacityKg?: number;
  config?: any;
  startLocation?: { lat: number; lon?: number; lng?: number; name?: string } | null;
  includeGeometry?: boolean;
}

export function optimizeRouteForScope(
  options: OptimizeRouteOptions
): Promise<RouteOptimizationResult>;

export function compareRouteStrategies(
  binsInScope?: any[],
  depot?: { lat: number; lon: number; name?: string }
): Promise<StrategyComparison>;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number;

export function isCandidateMustVisit(
  bin: any,
  config?: any
): boolean;

export function getBinDemandKg(bin: any): number;

export function clusterCandidates(
  candidates: any[],
  depot: { lat: number; lon: number },
  maxNodes?: number,
  maxClusterDemand?: number
): any[][];

export function solveCVRPCluster(params: any): any[];
