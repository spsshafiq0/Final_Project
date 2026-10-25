/**
 * IntelliWaste Idempotent Seed & Migration Script
 * 
 * Hierarchy: CityCorporation -> Ward -> Bin
 * - Backfills existing bins lacking cityCorporation or ward references
 * - Seeds City Corporations (DNCC, DSCC, CCC) and multiple Wards
 * - Generates configurable count of bins (BIN_COUNT=25 up to 2000)
 * - Seeds demo drivers for both CC-wide scope and Ward-restricted scope
 * 
 * Usage:
 *   node scripts/seed.js
 *   BIN_COUNT=200 node scripts/seed.js
 */

import fs from "node:fs";
import path from "node:path";

// Auto-load .env for local script execution
if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import prisma from "../lib/prisma.js";
import { memoryDb } from "../lib/store.js";
import { hashPassword } from "../lib/auth.js";

const DEFAULT_BIN_COUNT = Number(process.env.BIN_COUNT) || 60;

// Coordinate centers for realistic Dhaka metropolitan ward distribution
const WARD_GEO_CENTERS = {
  // DNCC
  "Ward 01": { lat: 23.868, lon: 90.400, area: "Uttara North" },
  "Ward 11": { lat: 23.815, lon: 90.365, area: "Mirpur 10" },
  "Ward 19": { lat: 23.792, lon: 90.415, area: "Gulshan & Banani" },
  "Ward 33": { lat: 23.765, lon: 90.362, area: "Mohammadpur" },
  "Ward 34": { lat: 23.778, lon: 90.370, area: "Agargaon & Rangs" },
  // DSCC
  "Ward 20": { lat: 23.746, lon: 90.378, area: "Dhanmondi" },
  "Ward 24": { lat: 23.719, lon: 90.388, area: "Lalbagh Fort" },
  "Ward 39": { lat: 23.725, lon: 90.418, area: "Motijheel Commercial Area" },
};

export async function runMigrationAndSeed(binCount = DEFAULT_BIN_COUNT) {
  console.log(`[Seed/Migration Engine] Starting seed with target BIN_COUNT=${binCount}...`);

  // 1. Backfill existing bins (Rule: Never delete data; backfill or log for review)
  try {
    const existingBins = await prisma.bin.findMany({
      include: { ward: true },
    }).catch(() => []);

    for (const bin of existingBins) {
      if (!bin.cityCorpId && bin.ward?.cityCorpId) {
        await prisma.bin.update({
          where: { id: bin.id },
          data: {
            cityCorpId: bin.ward.cityCorpId,
            capacityKg: bin.capacityKg || 120,
            fillLevel: bin.fillLevel || bin.fill || 0,
          },
        }).catch(() => {});
      } else if (!bin.cityCorpId && !bin.wardId) {
        console.warn(`[Review Required] Bin ${bin.id} (${bin.binCode}) lacks both ward and city corporation.`);
      }
    }
  } catch {}

  // 2. Seed City Corporations
  const citiesData = [
    {
      id: "cc-dncc",
      name: "Dhaka North City Corporation",
      code: "DNCC",
      address: "Gulshan Center Point, Plot 23-26, Road 90, Gulshan 2, Dhaka",
      phone: "+880-2-9855501",
      email: "contact@dncc.gov.bd",
      pointRate: 0.20,
      minWithdrawPoints: 100,
    },
    {
      id: "cc-dscc",
      name: "Dhaka South City Corporation",
      code: "DSCC",
      address: "Nagar Bhaban, Phoenix Road, Fulbaria, Dhaka",
      phone: "+880-2-9556014",
      email: "info@dscc.gov.bd",
      pointRate: 0.25,
      minWithdrawPoints: 100,
    },
    {
      id: "cc-ccc",
      name: "Chattogram City Corporation",
      code: "CCC",
      address: "Tigerpass, Chattogram",
      phone: "+880-31-610111",
      email: "mayor@ccc.gov.bd",
      pointRate: 0.20,
      minWithdrawPoints: 100,
    },
  ];

  const cityIdMap = new Map();
  for (const c of citiesData) {
    // Memory store
    if (!memoryDb.cities.some(x => x.id === c.id || x.code === c.code)) {
      memoryDb.cities.push({
        ...c,
        active: true,
        rewardActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    // Prisma DB
    try {
      const cityRec = await prisma.cityCorporation.upsert({
        where: { code: c.code },
        update: { name: c.name, address: c.address, phone: c.phone, email: c.email },
        create: {
          id: c.id,
          name: c.name,
          code: c.code,
          address: c.address,
          phone: c.phone,
          email: c.email,
          pointRate: c.pointRate,
          minWithdrawPoints: c.minWithdrawPoints,
        },
      });
      cityIdMap.set(c.code, cityRec.id);
      cityIdMap.set(c.id, cityRec.id);
    } catch {
      cityIdMap.set(c.code, c.id);
      cityIdMap.set(c.id, c.id);
    }
  }

  // 3. Seed Wards
  const wardsData = [
    // DNCC Wards
    { id: "ward-dncc-01", name: "Ward 01", area: "Uttara North", cityCorpId: "cc-dncc", population: 145000, councilor: "Md. Afsar Uddin" },
    { id: "ward-dncc-11", name: "Ward 11", area: "Mirpur 10", cityCorpId: "cc-dncc", population: 180000, councilor: "Dewan Abdul Mannan" },
    { id: "ward-dncc-19", name: "Ward 19", area: "Gulshan & Banani", cityCorpId: "cc-dncc", population: 120000, councilor: "Md. Mofizur Rahman" },
    { id: "ward-dncc-33", name: "Ward 33", area: "Mohammadpur", cityCorpId: "cc-dncc", population: 165000, councilor: "Tarequzzaman Rajib" },
    { id: "ward-dncc-34", name: "Ward 34", area: "Agargaon & Rangs", cityCorpId: "cc-dncc", population: 135000, councilor: "Sheikh Mohammad Hossain" },
    // DSCC Wards
    { id: "ward-dscc-20", name: "Ward 20", area: "Dhanmondi", cityCorpId: "cc-dscc", population: 110000, councilor: "Nasir Ahmed" },
    { id: "ward-dscc-24", name: "Ward 24", area: "Lalbagh Fort", cityCorpId: "cc-dscc", population: 195000, councilor: "Mokbul Hossain" },
    { id: "ward-dscc-39", name: "Ward 39", area: "Motijheel Commercial", cityCorpId: "cc-dscc", population: 140000, councilor: "Kazi Habib" },
  ];

  const wardIdMap = new Map();
  for (const w of wardsData) {
    const realCityCorpId = cityIdMap.get(w.cityCorpId) || cityIdMap.get("DNCC") || w.cityCorpId;
    w.cityCorpId = realCityCorpId;

    if (!memoryDb.wards.some(x => x.id === w.id)) {
      memoryDb.wards.push({
        ...w,
        reportEnabled: true,
        withdrawEnabled: true,
        createdAt: new Date().toISOString(),
      });
    }
    try {
      const existingWard = await prisma.ward.findFirst({
        where: { name: w.name, cityCorpId: realCityCorpId },
      });

      let wardRec;
      if (existingWard) {
        wardRec = await prisma.ward.update({
          where: { id: existingWard.id },
          data: { area: w.area, population: w.population, councilor: w.councilor },
        });
      } else {
        wardRec = await prisma.ward.create({
          data: {
            id: w.id,
            name: w.name,
            area: w.area,
            cityCorpId: realCityCorpId,
            population: w.population,
            councilor: w.councilor,
          },
        });
      }
      wardIdMap.set(w.name, wardRec.id);
      wardIdMap.set(w.id, wardRec.id);
    } catch {
      wardIdMap.set(w.name, w.id);
      wardIdMap.set(w.id, w.id);
    }
  }

  // 4. Seed Drivers with Scopes
  const dnccId = cityIdMap.get("DNCC") || "cc-dncc";
  const ward33Id = wardIdMap.get("Ward 33") || "ward-dncc-33";
  const ward19Id = wardIdMap.get("Ward 19") || "ward-dncc-19";

  const hashedDemoPassword = await hashPassword("password123");
  const demoDrivers = [
    {
      id: "driver-dncc-all",
      username: "driver_dncc",
      fullName: "Kamal Hossain (DNCC City-Wide Driver)",
      email: "kamal.driver@smartcity.gov.bd",
      phone: "+880-1711-889901",
      role: "DRIVER",
      cityCorpId: dnccId,
      wardId: null, // Entire DNCC
      assignment: { cityCorporation: dnccId, ward: null },
    },
    {
      id: "driver-ward33",
      username: "driver_ward33",
      fullName: "Rafiqul Islam (Ward 33 Mohammadpur Driver)",
      email: "rafiq.driver@smartcity.gov.bd",
      phone: "+880-1812-774411",
      role: "DRIVER",
      cityCorpId: dnccId,
      wardId: ward33Id, // Ward 33 Only
      assignment: { cityCorporation: dnccId, ward: ward33Id },
    },
    {
      id: "driver-ward19",
      username: "driver_ward19",
      fullName: "Shah Alam (Ward 19 Gulshan Driver)",
      email: "shahalam.driver@smartcity.gov.bd",
      phone: "+880-1913-665522",
      role: "DRIVER",
      cityCorpId: dnccId,
      wardId: ward19Id, // Ward 19 Only
      assignment: { cityCorporation: dnccId, ward: ward19Id },
    },
  ];

  for (const d of demoDrivers) {
    const existingMem = memoryDb.users.find(u => u.username === d.username);
    if (!existingMem) {
      memoryDb.users.push({
        ...d,
        password: hashedDemoPassword,
        active: true,
        points: 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      Object.assign(existingMem, {
        cityCorpId: d.cityCorpId,
        wardId: d.wardId,
        assignment: d.assignment,
      });
    }

    try {
      await prisma.user.upsert({
        where: { username: d.username },
        update: {
          fullName: d.fullName,
          cityCorpId: d.cityCorpId,
          wardId: d.wardId,
          role: "DRIVER",
        },
        create: {
          id: d.id,
          username: d.username,
          password: hashedDemoPassword,
          fullName: d.fullName,
          email: d.email,
          phone: d.phone,
          role: "DRIVER",
          cityCorpId: d.cityCorpId,
          wardId: d.wardId,
        },
      });
    } catch {}
  }

  // 5. Seed Bins Spread Across Wards with Realistic Fill & Sensor Telemetry
  const dnccWards = wardsData.filter(w => w.cityCorpId === dnccId || w.cityCorpId === "cc-dncc");
  const binsToCreate = [];

  for (let i = 1; i <= binCount; i++) {
    const assignedWard = dnccWards[(i - 1) % dnccWards.length];
    const geo = WARD_GEO_CENTERS[assignedWard.name] || { lat: 23.78, lon: 90.40, area: assignedWard.area };

    // Jitter around ward center (~500m to 1.5km spread)
    const latOffset = (Math.sin(i * 1.7) * 0.012) + ((i % 5) * 0.002);
    const lonOffset = (Math.cos(i * 1.3) * 0.014) + ((i % 4) * 0.003);
    const binLat = Number((geo.lat + latOffset).toFixed(5));
    const binLng = Number((geo.lon + lonOffset).toFixed(5));

    // Fill level distribution:
    // - 10% hazard (fire/gas alert)
    // - 25% critical/must-visit (70% - 98%)
    // - 65% normal (15% - 65%)
    let fill = 45;
    let temp = "Normal";
    let gas = "Normal";
    let fire = false;
    let status = "normal";
    let forecastFull90At = null;

    if (i % 10 === 0) {
      // Critical Hazard Bin
      fill = 92 + (i % 7);
      temp = "54°C";
      gas = "82 ppm NH3 (Toxic)";
      fire = i % 20 === 0;
      status = fire ? "fire" : "critical";
    } else if (i % 3 === 0) {
      // High Fill Must-Visit Candidate
      fill = 72 + ((i * 3) % 25);
      temp = "34°C";
      gas = "28 ppm";
      status = fill >= 85 ? "warning" : "normal";
      if (i % 6 === 0) {
        // Forecast reaching 90% in 4-8 hours
        forecastFull90At = new Date(Date.now() + (4 + (i % 5)) * 3600 * 1000).toISOString();
      }
    } else {
      // Normal Bin
      fill = 15 + ((i * 7) % 50);
      temp = "27°C";
      gas = "8 ppm";
      status = "normal";
    }

    const binCode = `B-${String(i).padStart(3, "0")}`;
    const capacityKg = i % 4 === 0 ? 240 : 120;

    binsToCreate.push({
      id: `bin-seed-${i}`,
      binCode,
      location: `${assignedWard.area}, Sector ${((i % 12) + 1)}, Road ${((i % 24) + 1)}`,
      capacity: `${capacityKg}L`,
      capacityKg,
      fill,
      fillLevel: fill,
      weight: Math.round((fill / 100) * capacityKg),
      temp,
      gas,
      fire,
      status,
      lat: binLat,
      lng: binLng,
      lon: binLng,
      wardId: wardIdMap.get(assignedWard.id) || wardIdMap.get(assignedWard.name) || assignedWard.id,
      ward: wardIdMap.get(assignedWard.id) || wardIdMap.get(assignedWard.name) || assignedWard.id,
      cityCorpId: cityIdMap.get(assignedWard.cityCorpId) || assignedWard.cityCorpId,
      cityCorporation: cityIdMap.get(assignedWard.cityCorpId) || assignedWard.cityCorpId,
      forecastFull90At,
      createdAt: new Date().toISOString(),
    });
  }

  // Idempotently sync into memoryDb
  const existingCodeSet = new Set(memoryDb.bins.map(b => b.binCode));
  for (const b of binsToCreate) {
    if (!existingCodeSet.has(b.binCode)) {
      memoryDb.bins.push(b);
      existingCodeSet.add(b.binCode);
    } else {
      const idx = memoryDb.bins.findIndex(x => x.binCode === b.binCode);
      if (idx >= 0) {
        Object.assign(memoryDb.bins[idx], b);
      }
    }
  }

  // Idempotently sync into Prisma DB
  let dbCreated = 0;
  for (const b of binsToCreate) {
    try {
      await prisma.bin.upsert({
        where: { binCode: b.binCode },
        update: {
          location: b.location,
          capacity: b.capacity,
          capacityKg: b.capacityKg,
          fill: b.fill,
          fillLevel: b.fillLevel,
          temp: b.temp,
          gas: b.gas,
          fire: b.fire,
          status: b.status,
          lat: b.lat,
          lng: b.lng,
          wardId: b.wardId,
          cityCorpId: b.cityCorpId,
          forecastFull90At: b.forecastFull90At ? new Date(b.forecastFull90At) : null,
        },
        create: {
          id: b.id,
          binCode: b.binCode,
          location: b.location,
          capacity: b.capacity,
          capacityKg: b.capacityKg,
          fill: b.fill,
          fillLevel: b.fillLevel,
          temp: b.temp,
          gas: b.gas,
          fire: b.fire,
          status: b.status,
          lat: b.lat,
          lng: b.lng,
          wardId: b.wardId,
          cityCorpId: b.cityCorpId,
          forecastFull90At: b.forecastFull90At ? new Date(b.forecastFull90At) : null,
        },
      });
      dbCreated++;
    } catch (err) {
      if (dbCreated === 0) console.error("Prisma bin error:", err);
    }
  }

  console.log(`[Seed/Migration Complete] Seeded ${citiesData.length} City Corps, ${wardsData.length} Wards, ${binsToCreate.length} Bins (${dbCreated} synced to PostgreSQL), and 3 Scoped Drivers.`);
  return {
    success: true,
    cities: citiesData.length,
    wards: wardsData.length,
    bins: binsToCreate.length,
    drivers: demoDrivers.length,
  };
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  runMigrationAndSeed()
    .then(r => {
      console.log("Migration and Seed finished successfully:", r);
      process.exit(0);
    })
    .catch(err => {
      console.error("Migration/Seed error:", err);
      process.exit(1);
    });
}

export default runMigrationAndSeed;
