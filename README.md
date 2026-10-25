# IntelliWaste — Smart Waste Management & Dynamic CVRP Route Optimizer

IntelliWaste is an enterprise smart municipal solid waste management platform built with React, Node.js, Leaflet, and Prisma (with resilient multi-tier memory store fallback).

---

## 🚀 Core Route Optimization System

The Driver Route Optimization subsystem provides scalable, automated collection routes with real road paths, visit order, ETA, and truck capacity constraints for **25, 500, to 5000+ smart bins**.

### 1. Data Model & Hierarchy (`CityCorporation` → `Ward` → `Bin`)

- **CityCorporation**: Top-level municipal authority (e.g., Dhaka North City Corporation `DNCC`, Dhaka South City Corporation `DSCC`, Chattogram City Corporation `CCC`).
- **Ward**: Administrative ward subdivision belonging strictly to one City Corporation (e.g., `Ward 01 - Uttara North`, `Ward 33 - Mohammadpur`).
- **Bin**: Smart waste receptacle equipped with ultrasonic fill level, gas sensors (NH₃ / methane), temperature, and fire alerts. Contains mandatory fields:
  - `cityCorporation` / `cityCorpId`: Ref to parent City Corporation.
  - `ward` / `wardId`: Ref to parent Ward.
  - `lat`, `lng` / `lon`: Geographic coordinates.
  - `capacityKg`: Bin physical volume capacity (120 kg, 240 kg, 360 kg).
  - `fillLevel` / `fill`: Current telemetry fill level (0–100%).
  - `forecastFull90At`: Predicted timestamp when bin will hit 90% capacity (*TODO: ML time-series model integration*).
  - **Indexes**: Compound index `{ cityCorporation: 1, ward: 1 }`, spatial coordinates `{ lat: 1, lng: 1 }`, and status index.
  - **Server-side validation**: Server validates that the selected ward belongs to the selected city corporation before bin creation.

### 2. Driver Scoping Architecture

Drivers never configure routes or pick bins manually. Driver scoping is strictly enforced on the server via `getDriverBinScope(driver)`:
- **Full City Corporation Scope**: When `assignment.ward` is null / unselected, the driver's jurisdiction covers **all bins** across that City Corporation. The Driver Map interface automatically provides ward filter chips to view all or specific sectors.
- **Ward-Restricted Scope**: When `assignment.ward` is specified, the driver is strictly confined to bins in that single ward. Drivers can never query, view, or receive directions for bins outside their jurisdiction.

### 3. CVRP Algorithm & Scalability

- **Candidate Pre-filtering**:
  - `Must Visit`: Bins with `fill >= 70%`, OR `forecast reaches 90% within next 12h`, OR active hazards (fire, critical toxic gas, overflow).
  - `Skipped`: Sub-threshold bins (< 70% fill) are omitted from the solver and rendered as small grey markers on the map.
- **Angular Sweep Spatial Clustering**:
  - To prevent giant $N \times N$ matrix explosion on large datasets (500, 5,000+ bins), candidates are partitioned into geographic clusters ($\le 80$ nodes or $\le 1000$ kg truck load) using polar angle around the operations depot.
- **Distance Matrix & OSRM Integration**:
  - OSRM Table API calculates real driving distance and duration matrices per cluster.
  - Automatic fallback to high-precision Haversine distance ($25\text{ km/h}$ average urban truck speed) if OSRM is unreachable or timed out.
  - Matrix results and polylines are cached in-memory using 64-bit coordinate hashes.
- **Guided Local Search CVRP Solver**:
  - **Initial Solution**: Capacity-constrained cheapest insertion heuristic prioritizing hazard penalties (`PENALTY_HAZARD_ALERT = 100,000`).
  - **Local Improvement**: 2-opt intra-trip edge swapping and Or-opt (relocation of 1–2 consecutive stops) under truck capacity constraints.
  - **Multi-trip Generation**: When cumulative load reaches truck capacity ($1,000\text{ kg}$), route returns to depot/dump site, unloads, and continues next trip. Trips containing critical hazard/fire bins are sorted first.
  - **Road Geometry**: OSRM `/route/v1/driving` delivers GeoJSON `LineString` road polylines per trip.

---

## 📡 API Endpoints

All driver endpoints enforce authentication and use `getDriverBinScope`:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/routes/optimize` | `GET` | Computes fresh CVRP route for authenticated driver's scope and persists it to DB. |
| `/api/routes/current` | `GET` | Fetches active persisted route for driver across page reloads. |
| `/api/routes/reoptimize` | `POST` | Dynamically re-solves remaining stops starting from driver's live GPS coordinates `{ currentLat, currentLon, completedBinIds }`. Rate-limited per driver. |
| `/api/routes/bins` | `GET` | Lightweight list of bins in scope. Supports `bbox` (`west,south,east,north`) and `ward` filter. |
| `/api/routes/compare` | `GET` | Real-data benchmark comparing **Baseline A** (Fixed Sequence), **Baseline B** (Greedy Nearest), and **Proposed** (IntelliWaste CVRP). |

---

## 🧪 Testing & Execution

### 1. Run Unit Tests
```bash
npm test
# Equivalent to: node --test tests/routeOptimizer.test.mjs
```
The test suite validates:
1. `getDriverBinScope` strict scope generation (CC-only vs Ward-specific).
2. Candidate filtering for $\ge 70\%$ fill, 12h forecast overflow, and active hazards.
3. Strict enforcement of truck payload capacity across multi-trips.
4. Hazard bin prioritization at stop #1.
5. Large dataset scalability ($1,000\text{ bins}$ clustered and solved without matrix overflow).
6. 3-strategy empirical benchmark calculation.
7. Depot start and finish geometry verification.
8. Cross-ward and cross-city driver isolation.

### 2. Database Migration & Seed
```bash
npm run seed
# Custom bin count:
# Linux/macOS: BIN_COUNT=250 npm run seed
# Windows PowerShell: $env:BIN_COUNT="250"; npm run seed
```

### 3. Production Build
```bash
npm run build
```

### 4. Local Development Server
```bash
npm run dev
```

---

## 🗺️ Driver App & Leaflet Map Features

- **Interactive Leaflet Canvas Map**: High-performance canvas rendering that stays fluid even with thousands of bins.
- **Dynamic Color-Coded Stops**:
  - 🔴 **Red**: Hazard / Fire / Toxic gas alert (Priority #1)
  - 🟠 **Orange**: Critical fill ($\ge 70\%$)
  - ⚪ **Small Grey**: Skipped sub-threshold bins (< 70% fill)
  - 🟢 **Green Check**: Completed collection stop
  - ⭐ **Gold Star**: Central Operations Depot & Landfill
- **Multi-Trip Tabs**: Individual tabs for each trip with distinct road polyline colors and payload indicators.
- **Turn-by-Turn Stop Panel**: Stop sequence, bin code, leg distance, ETA, Google Maps navigation button, and "Mark Done" action that triggers live re-optimization.
- **Benchmark Modal**: Live visual comparison of fuel cost and distance savings vs legacy schedules.
