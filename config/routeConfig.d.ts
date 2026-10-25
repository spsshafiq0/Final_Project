export interface RouteConfig {
  FILL_MUST_VISIT_THRESHOLD: number;
  FILL_CRITICAL_THRESHOLD: number;
  FORECAST_WINDOW_HOURS: number;
  ON_THE_WAY_FILL_THRESHOLD: number;
  ON_THE_WAY_MAX_METERS: number;
  MAX_NODES_PER_SOLVE: number;
  TRUCK_CAPACITY_KG: number;
  SOLVER_TIME_LIMIT_MS: number;
  PENALTY_HAZARD_ALERT: number;
  PENALTY_FILL_90: number;
  PENALTY_FILL_70: number;
  DISTANCE_COST_WEIGHT: number;
  AVERAGE_TRUCK_SPEED_KMH: number;
  SERVICE_TIME_PER_BIN_MINS: number;
  DEPOT_LOCATION: { lat: number; lon: number; name?: string };
  DUMP_SITE_LOCATION: { lat: number; lon: number; name?: string };
  OSRM_URL: string;
  OSRM_TIMEOUT_MS: number;
  OSRM_MAX_RETRIES: number;
  DIESEL_PRICE_PER_LITRE_BDT: number;
  TRUCK_FUEL_CONSUMPTION_KM_PER_LITRE: number;
}

export const ROUTE_CONFIG: RouteConfig;
export default ROUTE_CONFIG;
