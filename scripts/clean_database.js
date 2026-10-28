import prisma from "../lib/prisma.js";

async function cleanDatabase() {
  console.log("Starting thorough database cleaning...");
  console.log("Rule: Keep ONLY Super Admin account(s). Purge all other information.");

  try {
    // 1. Identify Super Admin user(s)
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
    });

    console.log(`Found ${superAdmins.length} Super Admin(s) to preserve:`, superAdmins.map(s => s.username));

    if (superAdmins.length === 0) {
      throw new Error("No SUPER_ADMIN found! Aborting to prevent locking out the system.");
    }

    // 2. Unlink any ward or cityCorp references from Super Admin accounts
    for (const sa of superAdmins) {
      await prisma.user.update({
        where: { id: sa.id },
        data: {
          cityCorpId: null,
          wardId: null,
        },
      });
    }

    // 3. Delete dependent records in foreign-key safe order
    console.log("Deleting Alerts...");
    await prisma.alert.deleteMany({});

    console.log("Deleting Waste Reports...");
    await prisma.wasteReport.deleteMany({});

    console.log("Deleting Pickup Requests...");
    await prisma.pickupRequest.deleteMany({});

    console.log("Deleting Withdrawal Requests...");
    await prisma.withdrawalRequest.deleteMany({});

    console.log("Deleting Wallet Transactions...");
    await prisma.walletTransaction.deleteMany({});

    console.log("Deleting Pickup Schedules...");
    await prisma.pickupSchedule.deleteMany({});

    console.log("Deleting City Waste Items...");
    await prisma.cityWasteItem.deleteMany({});

    console.log("Deleting Routes...");
    await prisma.route.deleteMany({});

    console.log("Deleting Tracks...");
    await prisma.track.deleteMany({});

    console.log("Deleting Bins...");
    await prisma.bin.deleteMany({});

    console.log("Deleting non-Super Admin Users...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { not: "SUPER_ADMIN" },
      },
    });
    console.log(`Deleted ${deletedUsers.count} non-SuperAdmin users.`);

    console.log("Deleting Wards...");
    await prisma.ward.deleteMany({});

    console.log("Deleting City Corporations...");
    await prisma.cityCorporation.deleteMany({});

    console.log("Deleting non-essential Audit Logs...");
    await prisma.auditLog.deleteMany({});

    // 4. Verification
    const remainingUsers = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, email: true, role: true },
    });
    const citiesCount = await prisma.cityCorporation.count();
    const wardsCount = await prisma.ward.count();
    const binsCount = await prisma.bin.count();

    console.log("\n==========================================");
    console.log("CLEAN DATABASE VERIFICATION REPORT:");
    console.log("Preserved Users (Super Admin ONLY):", remainingUsers);
    console.log("Cities count:", citiesCount);
    console.log("Wards count:", wardsCount);
    console.log("Bins count:", binsCount);
    console.log("==========================================\n");
  } catch (error) {
    console.error("Error during database cleaning:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
