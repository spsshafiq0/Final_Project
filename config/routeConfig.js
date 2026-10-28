/**
 * IntelliWaste Route Optimizer Configuration
 * Tunable parameters for CVRP route optimization, candidate filtering, and OSRM integration.
 */

export const ROUTE_CONFIG = {
  // Candidate selection thresholds
  FILL_MUST_VISIT_THRESHOLD: Number(process.env.FILL_MUST_VISIT_THRESHOLD) || 70, // % fill
  FILL_CRITICAL_THRESHOLD: Number(process.env.FILL_CRITICAL_THRESHOLD) || 90,     // % fill
  FORECAST_WINDOW_HOURS: Number(process.env.FORECAST_WINDOW_HOURS) || 12,         // hours until predicted overflow

  // On-the-way inclusion threshold (optional opportunistic collection)
  ON_THE_WAY_FILL_THRESHOLD: Number(process.env.ON_THE_WAY_FILL_THRESHOLD) || 50, // %
  ON_THE_WAY_MAX_METERS: Number(process.env.ON_THE_WAY_MAX_METERS) || 300,        // meters from route

  // Scalability & Clustering
  MAX_NODES_PER_SOLVE: Number(process.env.MAX_NODES_PER_SOLVE) || 80,             // Max cluster size for OSRM table
  TRUCK_CAPACITY_KG: Number(process.env.TRUCK_CAPACITY_KG) || 1000,               // Standard collection truck payload capacity in kg
  SOLVER_TIME_LIMIT_MS: Number(process.env.SOLVER_TIME_LIMIT_MS) || 3000,         // Max time per cluster solver run in ms

  // Skipping Penalties (Objective function)
  PENALTY_HAZARD_ALERT: 100000, // Fire / gas / toxic / overflow alerts (practically mandatory)
  PENALTY_FILL_90: 5000,        // Critical fill >= 90%
  PENALTY_FILL_70: 1000,        // Must-visit fill >= 70%
  DISTANCE_COST_WEIGHT: 1.0,    // Weight per km

  // Speeds and fallback
  AVERAGE_TRUCK_SPEED_KMH: Number(process.env.AVERAGE_TRUCK_SPEED_KMH) || 25,     // City collection average speed (km/h)
  SERVICE_TIME_PER_BIN_MINS: Number(process.env.SERVICE_TIME_PER_BIN_MINS) || 2, // Handling time per bin stop

  // Central Operations Depot & Solid Waste Facility
  DEPOT_LOCATION: {
    lat: Number(process.env.DEPOT_LAT) || 23.8103,
    lon: Number(process.env.DEPOT_LON) || 90.4125,
    name: "Central Operations Depot"
  },
  DUMP_SITE_LOCATION: {
    lat: Number(process.env.DUMP_SITE_LAT) || 23.8103,
    lon: Number(process.env.DUMP_SITE_LON) || 90.4125,
    name: "Central Solid Waste Landfill / Dump Site"
  },

  // OSRM Routing Engine URL
  // Default public demo instance; configure self-hosted OSRM URL in production (e.g., http://localhost:5000)
  OSRM_URL: process.env.OSRM_URL || "https://router.project-osrm.org",
  OSRM_TIMEOUT_MS: Number(process.env.OSRM_TIMEOUT_MS) || 4000,
  OSRM_MAX_RETRIES: 2,

  // Evaluation Baselines
  DIESEL_PRICE_PER_LITRE_BDT: 105,
  TRUCK_FUEL_CONSUMPTION_KM_PER_LITRE: 3.5, // 3.5 km per liter for loaded municipal compaction truck
};

export default ROUTE_CONFIG;
