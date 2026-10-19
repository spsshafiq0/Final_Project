import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../prisma";
import { hashPassword } from "../auth";
import { apiHandler } from "../middleware";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    // Check if Super Admin already exists
    const superAdminExists = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (superAdminExists && req.query.force !== "true") {
      return res.status(200).json({
        message: "Database already seeded. Use ?force=true to re-seed or update.",
      });
    }

    const defaultPasswordHash = await hashPassword("admin123");
    const driverPasswordHash = await hashPassword("driver123");

    // 1. Create City Corporations
    const dncc = await prisma.cityCorporation.upsert({
      where: { code: "DNCC" },
      update: { pointRate: 0.20, minWithdrawPoints: 100, rewardActive: true },
      create: {
        name: "Dhaka North City Corporation",
        code: "DNCC",
        address: "Plot 23-26, Road 46, Gulshan-2, Dhaka",
        phone: "+880-2-9894415",
        email: "info@dncc.gov.bd",
        pointRate: 0.20,
        minWithdrawPoints: 100,
        rewardActive: true,
      },
    });

    const dscc = await prisma.cityCorporation.upsert({
      where: { code: "DSCC" },
      update: { pointRate: 0.25, minWithdrawPoints: 150, rewardActive: true },
      create: {
        name: "Dhaka South City Corporation",
        code: "DSCC",
        address: "Nagar Bhaban, Fulbaria, Dhaka",
        phone: "+880-2-9556014",
        email: "info@dscc.gov.bd",
        pointRate: 0.25,
        minWithdrawPoints: 150,
        rewardActive: true,
      },
    });

    const ccc = await prisma.cityCorporation.upsert({
      where: { code: "CCC" },
      update: {},
      create: {
        name: "Chattogram City Corporation",
        code: "CCC",
        address: "Tigerpass, Chattogram",
        phone: "+880-31-610170",
        email: "info@ccc.gov.bd",
      },
    });

    // 2. Create Wards under DNCC
    const ward1 = await prisma.ward.upsert({
      where: { id: "ward-01-dncc" },
      update: {},
      create: {
        id: "ward-01-dncc",
        name: "Ward 01",
        area: "Uttara Sector 1-4",
        population: 85000,
        councilor: "Md. Afsar Uddin",
        cityCorpId: dncc.id,
      },
    });

    const ward2 = await prisma.ward.upsert({
      where: { id: "ward-02-dncc" },
      update: {},
      create: {
        id: "ward-02-dncc",
        name: "Ward 02",
        area: "Uttara Sector 5-8",
        population: 92000,
        councilor: "Kazi Jahangir Alam",
        cityCorpId: dncc.id,
      },
    });

    const ward3 = await prisma.ward.upsert({
      where: { id: "ward-03-dncc" },
      update: {},
      create: {
        id: "ward-03-dncc",
        name: "Ward 03",
        area: "Mirpur-10 & Kazipara",
        population: 110000,
        councilor: "Rafiqul Islam",
        cityCorpId: dncc.id,
      },
    });

    const ward19 = await prisma.ward.upsert({
      where: { id: "ward-19-dncc" },
      update: {},
      create: {
        id: "ward-19-dncc",
        name: "Ward 19",
        area: "Gulshan & Banani",
        population: 78000,
        councilor: "Mofizur Rahman",
        cityCorpId: dncc.id,
      },
    });

    // Wards for DSCC
    const wardDhanmondi = await prisma.ward.upsert({
      where: { id: "ward-15-dscc" },
      update: {},
      create: {
        id: "ward-15-dscc",
        name: "Ward 15",
        area: "Dhanmondi R/A",
        population: 95000,
        councilor: "Zakir Hossain",
        cityCorpId: dscc.id,
      },
    });

    // 3. Create Users (Super Admin, City Admins, Ward Admins, Driver)
    // Super Admin
    await prisma.user.upsert({
      where: { username: "superadmin" },
      update: { password: defaultPasswordHash },
      create: {
        username: "superadmin",
        password: defaultPasswordHash,
        fullName: "Ministry Chief Director",
        role: "SUPER_ADMIN",
        email: "superadmin@intelliwaste.gov.bd",
        phone: "+880-1711-000001",
      },
    });

    // City Admins
    await prisma.user.upsert({
      where: { username: "city.admin" },
      update: { password: defaultPasswordHash, cityCorpId: dncc.id },
      create: {
        username: "city.admin",
        password: defaultPasswordHash,
        fullName: "DNCC Central Waste Officer",
        role: "CITY_ADMIN",
        cityCorpId: dncc.id,
        email: "admin@dncc.gov.bd",
        phone: "+880-1711-000002",
      },
    });

    await prisma.user.upsert({
      where: { username: "dscc.admin" },
      update: { password: defaultPasswordHash, cityCorpId: dscc.id },
      create: {
        username: "dscc.admin",
        password: defaultPasswordHash,
        fullName: "DSCC Waste Management Chief",
        role: "CITY_ADMIN",
        cityCorpId: dscc.id,
        email: "admin@dscc.gov.bd",
        phone: "+880-1711-000003",
      },
    });

    // Ward Admins
    await prisma.user.upsert({
      where: { username: "ward" },
      update: { password: defaultPasswordHash, wardId: ward1.id, cityCorpId: dncc.id },
      create: {
        username: "ward",
        password: defaultPasswordHash,
        fullName: "Ward 01 Inspector",
        role: "WARD_ADMIN",
        wardId: ward1.id,
        cityCorpId: dncc.id,
        phone: "+880-1711-000004",
      },
    });

    await prisma.user.upsert({
      where: { username: "ward02.admin" },
      update: { password: defaultPasswordHash, wardId: ward2.id, cityCorpId: dncc.id },
      create: {
        username: "ward02.admin",
        password: defaultPasswordHash,
        fullName: "Ward 02 Inspector",
        role: "WARD_ADMIN",
        wardId: ward2.id,
        cityCorpId: dncc.id,
        phone: "+880-1711-000005",
      },
    });

    // Driver User
    const driverUser = await prisma.user.upsert({
      where: { username: "driver01" },
      update: { password: driverPasswordHash },
      create: {
        username: "driver01",
        password: driverPasswordHash,
        fullName: "Abdul Karim (Truck Driver)",
        role: "DRIVER",
        phone: "+880-1811-123456",
      },
    });

    // 4. Create Citizen Demo User with initial points
    const citizenPasswordHash = await hashPassword("user123");
    const citizenUser = await prisma.user.upsert({
      where: { username: "citizen01" },
      update: { password: citizenPasswordHash, points: 2847 },
      create: {
        username: "citizen01",
        password: citizenPasswordHash,
        fullName: "Fatima Begum (Citizen)",
        role: "CITIZEN",
        points: 2847,
        phone: "+880-1711-889900",
        address: "House 12, Road 4, Sector 3, Uttara",
      },
    });

    // Commercial / Business Demo User
    const businessPasswordHash = await hashPassword("business123");
    await prisma.user.upsert({
      where: { username: "business01" },
      update: { password: businessPasswordHash },
      create: {
        username: "business01",
        password: businessPasswordHash,
        fullName: "Grand Palace Hotel & Suites",
        role: "BUSINESS",
        phone: "+880-1911-554433",
        address: "Plot 14, Road 11, Banani, Dhaka",
      },
    });

    // 5. Create Sample Cash Withdrawals in Ward 01
    await prisma.withdrawalRequest.upsert({
      where: { verificationCode: "WDR-5821" },
      update: {},
      create: {
        verificationCode: "WDR-5821",
        points: 500,
        amount: 100.0,
        status: "pending",
        citizenId: citizenUser.id,
        citizenName: citizenUser.fullName,
        citizenPhone: citizenUser.phone,
        wardId: ward1.id,
        notes: "Citizen requested cash payout from Ward 01 office",
      },
    });

    await prisma.withdrawalRequest.upsert({
      where: { verificationCode: "WDR-3140" },
      update: {},
      create: {
        verificationCode: "WDR-3140",
        points: 300,
        amount: 60.0,
        status: "paid",
        citizenId: citizenUser.id,
        citizenName: "Rahim Khan",
        citizenPhone: "01711-223344",
        wardId: ward1.id,
        paidAt: new Date(),
        notes: "Cash disbursed by Ward 01 inspector",
      },
    });

    // 4. Create Initial Bins
    const sampleBins = [
      { binCode: "B-001", location: "Sector 3 Park, Gate 2", capacity: "240L", fill: 35, weight: 42, temp: "24°C", gas: "Low", fire: false, status: "normal", wardId: ward1.id, lat: 23.868, lng: 90.398 },
      { binCode: "B-002", location: "Uttara North Metro Station Gate 1", capacity: "120L", fill: 78, weight: 65, temp: "27°C", gas: "Medium", fire: false, status: "warning", wardId: ward1.id, lat: 23.871, lng: 90.395 },
      { binCode: "B-003", location: "House 12, Road 7 Market Corner", capacity: "240L", fill: 94, weight: 110, temp: "31°C", gas: "High", fire: false, status: "critical", wardId: ward1.id, lat: 23.865, lng: 90.401 },
      { binCode: "B-004", location: "Sector 7 Community Center", capacity: "240L", fill: 45, weight: 50, temp: "25°C", gas: "Low", fire: false, status: "normal", wardId: ward2.id, lat: 23.862, lng: 90.405 },
      { binCode: "B-005", location: "Mirpur-10 Roundabout East", capacity: "360L", fill: 88, weight: 140, temp: "28°C", gas: "Medium", fire: false, status: "warning", wardId: ward3.id, lat: 23.807, lng: 90.368 },
      { binCode: "B-006", location: "Gulshan-2 Circle South", capacity: "240L", fill: 20, weight: 25, temp: "24°C", gas: "Low", fire: false, status: "normal", wardId: ward19.id, lat: 23.793, lng: 90.414 },
    ];

    for (const b of sampleBins) {
      await prisma.bin.upsert({
        where: { binCode: b.binCode },
        update: {},
        create: {
          ...b,
          status: b.status as any,
          lastCollected: new Date(),
        },
      });
    }

    // 5. Create Initial Tracks
    const sampleTracks = [
      { truckId: "DNCC-T01", route: "Sector 1 → Sector 3 → Metro", stops: 12, status: "active", progress: 68, load: "2.8t / 4t", fuel: 72, wardId: ward1.id, driverId: driverUser.id, gpsLat: 23.869, gpsLng: 90.397 },
      { truckId: "DNCC-T02", route: "Sector 5 → Sector 7 Market", stops: 8, status: "idle", progress: 100, load: "3.5t / 4t", fuel: 45, wardId: ward2.id, gpsLat: 23.863, gpsLng: 90.403 },
      { truckId: "DNCC-T03", route: "Mirpur-10 → Kazipara Main Rd", stops: 15, status: "active", progress: 40, load: "1.9t / 5t", fuel: 85, wardId: ward3.id, gpsLat: 23.805, gpsLng: 90.369 },
    ];

    for (const t of sampleTracks) {
      const existingTrack = await prisma.track.findFirst({ where: { truckId: t.truckId } });
      if (!existingTrack) {
        await prisma.track.create({
          data: {
            ...t,
            status: t.status as any,
          },
        });
      }
    }

    // 6. Create Initial Alert
    const criticalBin = await prisma.bin.findUnique({ where: { binCode: "B-003" } });
    if (criticalBin) {
      await prisma.alert.create({
        data: {
          type: "overflow",
          message: "Bin B-003 at House 12, Road 7 Market is at 94% capacity",
          priority: "critical",
          binId: criticalBin.id,
          wardId: ward1.id,
        },
      });
    }

    return res.status(200).json({
      message: "Database seeded successfully!",
      cityCorporations: 3,
      wards: 5,
      bins: 6,
      tracks: 3,
      users: 8,
      credentials: [
        { role: "SUPER_ADMIN", username: "superadmin", password: "admin123", title: "Super Admin (Ministry Chief)", jurisdiction: "National Oversight" },
        { role: "CITY_ADMIN", username: "city.admin", password: "admin123", title: "City Corporation Admin", jurisdiction: "DNCC (Dhaka North)" },
        { role: "CITY_ADMIN", username: "dscc.admin", password: "admin123", title: "City Corporation Admin", jurisdiction: "DSCC (Dhaka South)" },
        { role: "WARD_ADMIN", username: "ward", password: "admin123", title: "Ward Sub-Admin", jurisdiction: "Ward 01 (Uttara Sector 1-4)" },
        { role: "WARD_ADMIN", username: "ward02.admin", password: "admin123", title: "Ward Sub-Admin", jurisdiction: "Ward 02 (Uttara Sector 5-8)" },
        { role: "CITIZEN", username: "citizen01", password: "user123", title: "Citizen (Fatima Begum - 2,847 pts)", jurisdiction: "Ward 01 (Uttara)" },
        { role: "DRIVER", username: "driver01", password: "driver123", title: "Collector / Truck Driver", jurisdiction: "DNCC-T01 Route" },
        { role: "BUSINESS", username: "business01", password: "business123", title: "Commercial Client", jurisdiction: "Banani Commercial Area" },
      ],
    });
  },
  { allowedMethods: ["POST", "GET"] }
);
