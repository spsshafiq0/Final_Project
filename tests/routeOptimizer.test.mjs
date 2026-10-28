import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  haversineDistanceKm,
  isCandidateMustVisit,
  getBinDemandKg,
  clusterCandidates,
  solveCVRPCluster,
  optimizeRouteForScope,
  compareRouteStrategies,
} from "../services/routeOptimizer.js";
import { getDriverBinScope } from "../services/driverScope.js";

describe("IntelliWaste Route Optimizer Unit Test Suite", () => {
  const depot = { lat: 23.8103, lon: 90.4125, name: "Depot" };
  const dumpSite = { lat: 23.8103, lon: 90.4125, name: "Dump" };

  test("1. Driver scope helper returns strict scope for CC-only and Ward-specific", () => {
    // CC only
    const driverCCOnly = {
      id: "d1",
      cityCorpId: "dncc",
      assignment: { cityCorporation: "dncc", ward: null }
    };
    const scope1 = getDriverBinScope(driverCCOnly);
    assert.equal(scope1.cityCorporation, "dncc");
    assert.equal(scope1.cityCorpId, "dncc");
    assert.equal(scope1.ward, undefined);
    assert.equal(scope1.wardId, undefined);

    // CC + Ward
    const driverWard = {
      id: "d2",
      cityCorpId: "dncc",
      wardId: "ward-01",
      assignment: { cityCorporation: "dncc", ward: "ward-01" }
    };
    const scope2 = getDriverBinScope(driverWard);
    assert.equal(scope2.cityCorporation, "dncc");
    assert.equal(scope2.ward, "ward-01");
    assert.equal(scope2.wardId, "ward-01");

    // Driver without CC must throw
    assert.throws(() => getDriverBinScope({}), /assigned City Corporation/);
  });

  test("2. Candidate filtering selects fill >= 70%, 12h forecast, and active hazards", () => {
    const lowFill = { fill: 40, status: "normal" };
    const highFill = { fill: 75, status: "normal" };
    const hazardBin = { fill: 20, fire: true };
    const forecastOverflow = { fill: 45, forecastFull90At: new Date(Date.now() + 6 * 3600 * 1000).toISOString() };
    const forecastFarAway = { fill: 45, forecastFull90At: new Date(Date.now() + 24 * 3600 * 1000).toISOString() };

    assert.equal(isCandidateMustVisit(lowFill), false);
    assert.equal(isCandidateMustVisit(highFill), true);
    assert.equal(isCandidateMustVisit(hazardBin), true);
    assert.equal(isCandidateMustVisit(forecastOverflow), true);
    assert.equal(isCandidateMustVisit(forecastFarAway), false);
  });

  test("3. Truck capacity is strictly respected across all generated trips", async () => {
    // Generate 30 candidate bins each with 100kg demand = 3000kg total demand
    // Truck capacity is 1000kg, so at least 3 trips are required
    const sampleBins = [];
    for (let i = 1; i <= 30; i++) {
      sampleBins.push({
        id: `bin-${i}`,
        binCode: `B-${i}`,
        location: `Location ${i}`,
        lat: 23.80 + (i * 0.003),
        lon: 90.40 + (i * 0.002),
        fillLevel: 80,
        capacityKg: 125, // 80% of 125 = 100kg
        status: "normal",
      });
    }

    const result = await optimizeRouteForScope({
      binsInScope: sampleBins,
      depot,
      dumpSite,
      truckCapacityKg: 1000,
    });

    assert.ok(result.trips.length >= 3, `Expected at least 3 trips, got ${result.trips.length}`);
    for (const trip of result.trips) {
      assert.ok(trip.loadKg <= 1000, `Trip ${trip.tripNumber} load ${trip.loadKg}kg exceeded capacity 1000kg!`);
      assert.ok(trip.stops.length > 0, "Trip must have stops");
    }
  });

  test("4. High-penalty hazard bins are always visited and prioritized", async () => {
    const sampleBins = [
      { id: "b1", lat: 23.82, lon: 90.41, fillLevel: 75, capacityKg: 100, status: "normal" },
      { id: "hazard-1", lat: 23.83, lon: 90.42, fillLevel: 30, capacityKg: 100, fire: true, status: "critical" },
      { id: "b2", lat: 23.81, lon: 90.40, fillLevel: 85, capacityKg: 100, status: "normal" },
    ];

    const result = await optimizeRouteForScope({
      binsInScope: sampleBins,
      depot,
      dumpSite,
    });

    const allVisitedIds = result.trips.flatMap(t => t.stops.map(s => s.binId));
    assert.ok(allVisitedIds.includes("hazard-1"), "Hazard bin must be visited despite low fill!");
    assert.ok(result.trips[0].hasHazard, "First trip must contain the hazard bin");
  });

  test("5. Large input scalability (1,000 bins) completes in reasonable time without matrix overflow", async () => {
    const thousandBins = [];
    for (let i = 0; i < 1000; i++) {
      thousandBins.push({
        id: `large-bin-${i}`,
        binCode: `LB-${i}`,
        location: `Street ${i}`,
        lat: 23.70 + (Math.sin(i) * 0.08),
        lon: 90.35 + (Math.cos(i) * 0.08),
        fillLevel: (i % 3 === 0) ? 85 : 40, // ~333 candidates
        capacityKg: 120,
        status: (i === 42) ? "critical" : "normal",
        fire: i === 42,
      });
    }

    const start = Date.now();
    const result = await optimizeRouteForScope({
      binsInScope: thousandBins,
      depot,
      dumpSite,
      truckCapacityKg: 1000,
      includeGeometry: false,
    });
    const elapsed = Date.now() - start;

    console.log(`[Scalability Test] Processed 1000 bins (${result.candidateCount} candidates, ${result.trips.length} trips) in ${elapsed} ms.`);
    assert.ok(elapsed < 20000, `Expected run to take < 20s, took ${elapsed}ms`);
    assert.ok(result.candidateCount > 300, "Should select > 300 candidates");
    assert.ok(result.trips.length > 0, "Should generate trips");
  });

  test("6. Route comparison computes all 3 baselines from real data", async () => {
    const bins = [
      { id: "b1", binCode: "B1", lat: 23.82, lon: 90.41, fillLevel: 95, capacityKg: 100, status: "normal" },
      { id: "b2", binCode: "B2", lat: 23.84, lon: 90.43, fillLevel: 30, capacityKg: 100, status: "normal" },
      { id: "b3", binCode: "B3", lat: 23.83, lon: 90.42, fillLevel: 80, capacityKg: 100, status: "normal" },
    ];

    const comparison = await compareRouteStrategies(bins, depot);
    assert.ok(comparison.baselineA.totalDistanceKm > 0);
    assert.ok(comparison.baselineB.totalDistanceKm > 0);
    assert.ok(comparison.proposed.totalDistanceKm > 0);
    assert.equal(comparison.proposed.binsVisited, 2); // b1 and b3 (b2 has 30% fill and is skipped)
  });

  test("7. Route starts and ends at the depot", async () => {
    const bins = [
      { id: "b1", binCode: "B1", lat: 23.82, lon: 90.41, fillLevel: 85, capacityKg: 100, status: "normal" },
      { id: "b2", binCode: "B2", lat: 23.83, lon: 90.42, fillLevel: 90, capacityKg: 100, status: "normal" },
    ];

    const result = await optimizeRouteForScope({
      binsInScope: bins,
      depot,
      dumpSite,
      truckCapacityKg: 1000,
    });

    assert.ok(result.trips.length > 0, "Must generate at least one trip");
    for (const trip of result.trips) {
      assert.equal(trip.depot.lat, depot.lat);
      assert.equal(trip.depot.lon, depot.lon);
      assert.equal(trip.dumpSite.lat, dumpSite.lat);
      assert.equal(trip.dumpSite.lon, dumpSite.lon);
      // Geometry coordinates start and end at depot
      if (trip.geometry?.coordinates?.length > 0) {
        const firstCoord = trip.geometry.coordinates[0];
        const lastCoord = trip.geometry.coordinates[trip.geometry.coordinates.length - 1];
        assert.ok(Math.abs(firstCoord[1] - depot.lat) < 0.001);
        assert.ok(Math.abs(firstCoord[0] - depot.lon) < 0.001);
        assert.ok(Math.abs(lastCoord[1] - dumpSite.lat) < 0.001);
        assert.ok(Math.abs(lastCoord[0] - dumpSite.lon) < 0.001);
      }
    }
  });

  test("8. Driver isolation: Driver cannot see another ward or city corporation's bins", () => {
    const bins = [
      { id: "b-w33-1", binCode: "B-33-1", cityCorpId: "cc-dncc", cityCorporation: "cc-dncc", wardId: "ward-33" },
      { id: "b-w33-2", binCode: "B-33-2", cityCorpId: "cc-dncc", cityCorporation: "cc-dncc", wardId: "ward-33" },
      { id: "b-w19-1", binCode: "B-19-1", cityCorpId: "cc-dncc", cityCorporation: "cc-dncc", wardId: "ward-19" },
      { id: "b-dscc-1", binCode: "B-DS-1", cityCorpId: "cc-dscc", cityCorporation: "cc-dscc", wardId: "ward-dscc-20" },
    ];

    // Scenario A: Ward 33 scoped driver
    const ward33Driver = {
      id: "driver-w33",
      cityCorpId: "cc-dncc",
      assignment: { cityCorporation: "cc-dncc", ward: "ward-33" },
    };
    const scopeA = getDriverBinScope(ward33Driver);

    // Apply scope filter
    const visibleBinsA = bins.filter(b => {
      if (scopeA.wardId && b.wardId !== scopeA.wardId) return false;
      if (b.cityCorpId !== scopeA.cityCorpId && b.cityCorporation !== scopeA.cityCorporation) return false;
      return true;
    });

    assert.equal(visibleBinsA.length, 2);
    assert.deepEqual(visibleBinsA.map(b => b.id), ["b-w33-1", "b-w33-2"]);
    assert.ok(!visibleBinsA.some(b => b.wardId === "ward-19"), "Must NOT see ward-19 bins");
    assert.ok(!visibleBinsA.some(b => b.cityCorpId === "cc-dscc"), "Must NOT see DSCC bins");

    // Scenario B: DNCC City-wide driver (no ward restriction)
    const dnccWideDriver = {
      id: "driver-dncc",
      cityCorpId: "cc-dncc",
      assignment: { cityCorporation: "cc-dncc", ward: null },
    };
    const scopeB = getDriverBinScope(dnccWideDriver);

    const visibleBinsB = bins.filter(b => {
      if (scopeB.wardId && b.wardId !== scopeB.wardId) return false;
      if (b.cityCorpId !== scopeB.cityCorpId && b.cityCorporation !== scopeB.cityCorporation) return false;
      return true;
    });

    assert.equal(visibleBinsB.length, 3);
    assert.ok(visibleBinsB.some(b => b.wardId === "ward-33"));
    assert.ok(visibleBinsB.some(b => b.wardId === "ward-19"));
    assert.ok(!visibleBinsB.some(b => b.cityCorpId === "cc-dscc"), "Must NOT see DSCC bins");
  });

  test("9. Route optimizer handles empty bins list gracefully without crashing", async () => {
    const result = await optimizeRouteForScope({
      binsInScope: [],
      depot,
      dumpSite,
    });
    assert.equal(result.candidateCount, 0);
    assert.equal(result.trips.length, 0);
    assert.equal(result.totalDistanceKm, 0);
  });

  test("10. Dynamic City Corporation and Ward scope assignment works with arbitrary custom IDs", () => {
    const driverCustom = {
      id: "driver-custom-01",
      cityCorpId: "city-sylhet-north",
      wardId: "ward-sn-04",
      assignment: { cityCorporation: "city-sylhet-north", ward: "ward-sn-04" },
    };
    const scope = getDriverBinScope(driverCustom);
    assert.equal(scope.cityCorpId, "city-sylhet-north");
    assert.equal(scope.cityCorporation, "city-sylhet-north");
    assert.equal(scope.wardId, "ward-sn-04");
    assert.equal(scope.ward, "ward-sn-04");
  });
});

