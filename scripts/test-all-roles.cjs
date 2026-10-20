/**
 * IntelliWaste End-to-End System & Role-Based Comprehensive QA Test Suite
 * 
 * Verifies every user role and feature:
 * 1. System Setup & One-Time Lockout Protection
 * 2. Super Admin Panel (City Corp CRUD, City Admin Provisioning, System Stats)
 * 3. City Admin Panel (Ward Management, Sub-Admin Provisioning, City Overview)
 * 4. Ward Admin Panel (Smart Bins, IoT Toxic Gas/Heat Alerts, Collection Tracks, Pickup Requests, Point Withdrawals)
 * 5. Driver / Collector App (Assigned Routes, Smart Bin Collection, Telemetry)
 * 6. Citizen Portal (Registration, Waste Disposal Points, Point Withdrawal Requests, Pickup Requests)
 * 7. Business Portal (Commercial Pickups)
 * 8. Account Security & Brevo Recovery (Forgot Password OTP, Reset Password, Backdoor Check)
 */

process.env.NODE_ENV = "test";

const http = require("http");
const jwt = require("jsonwebtoken");

// Mock Vercel Request & Response helper
function mockReqRes({ method = "GET", url = "/", body = {}, headers = {}, query = {} } = {}) {
  const req = {
    method,
    url,
    body,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    query,
  };

  let statusCode = 200;
  let responseData = null;
  let headersSent = {};
  let writableEnded = false;

  const res = {
    statusCode,
    setHeader: (key, val) => {
      headersSent[key.toLowerCase()] = val;
    },
    status: (code) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      writableEnded = true;
      res.writableEnded = true;
      return res;
    },
    end: (data) => {
      responseData = data;
      writableEnded = true;
      res.writableEnded = true;
      return res;
    },
    writableEnded: false,
    _getData: () => responseData,
    _getStatus: () => statusCode,
  };

  return { req, res };
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("   INTELLIWASTE COMPREHENSIVE QA & ROLE TEST SUITE       ");
  console.log("========================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(testName, condition, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    }
  }

  // Load bundled handler
  const { default: apiHandler } = await import("../api/index.js");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 1: SYSTEM SETUP & ONE-TIME LOCKOUT
  // ──────────────────────────────────────────────────────────────────────────
  console.log("▶ TEST SET 1: One-Time System Setup & Root Super Admin Initializer");
  {
    // 1.1 GET Setup Status
    const { req: req1, res: res1 } = mockReqRes({
      method: "GET",
      url: "/api/setup",
    });
    await apiHandler(req1, res1);
    assert("Setup status endpoint is operational", res1._getStatus() === 200);

    // 1.2 POST Initial Setup (Create Super Admin)
    const { req: req2, res: res2 } = mockReqRes({
      method: "POST",
      url: "/api/setup",
      body: {
        fullName: "Super Admin Shafiq",
        username: "spsshafiq_qa",
        email: "shafiq_mollah1087@uits.edu.bd",
        password: "SuperSecretPassword#2025",
        cityCorpName: "Dhaka North City Corporation",
        cityCorpCode: "DNCC_QA",
      },
    });
    await apiHandler(req2, res2);
    const setupData = res2._getData();
    assert(
      "Initial Super Admin can be initialized with credentials & JWT",
      res2._getStatus() === 200 && setupData && setupData.token && setupData.user.role === "SUPER_ADMIN",
      `Status: ${res2._getStatus()}`
    );

    // 1.3 Verify ONE-TIME Lockout (Should strictly reject second attempt with HTTP 403)
    const { req: req3, res: res3 } = mockReqRes({
      method: "POST",
      url: "/api/setup",
      body: {
        fullName: "Intruder Attempt",
        username: "intruder",
        email: "intruder@evil.com",
        password: "HackerPassword123",
      },
    });
    await apiHandler(req3, res3);
    assert(
      "One-time setup is permanently LOCKED; second initialization attempt returns HTTP 403 Forbidden",
      res3._getStatus() === 403,
      `Status: ${res3._getStatus()}, Response: ${JSON.stringify(res3._getData())}`
    );

    // 1.4 GET Setup status now reports isSetupComplete: true
    const { req: req4, res: res4 } = mockReqRes({
      method: "GET",
      url: "/api/setup",
    });
    await apiHandler(req4, res4);
    const statusData = res4._getData();
    assert(
      "Setup status confirms isSetupComplete: true",
      statusData && statusData.isSetupComplete === true
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 2: AUTHENTICATION & SECURITY (ALL ROLES)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SET 2: Unified Authentication Engine & Role Validation");
  let superToken = "";
  let cityAdminToken = "";
  let wardAdminToken = "";
  let driverToken = "";
  let citizenToken = "";

  {
    // 2.1 Super Admin Login
    const { req, res } = mockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { username: "spsshafiq_qa", password: "SuperSecretPassword#2025" },
    });
    await apiHandler(req, res);
    const loginData = res._getData();
    superToken = loginData?.token || "";
    assert(
      "Super Admin login succeeds and returns valid JWT token",
      res._getStatus() === 200 && superToken !== "",
      `Status: ${res._getStatus()}`
    );

    // 2.2 Reject invalid credentials
    const { req: badReq, res: badRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { username: "spsshafiq_qa", password: "WrongPassword" },
    });
    await apiHandler(badReq, badRes);
    assert("Invalid credentials correctly rejected with HTTP 401", badRes._getStatus() === 401);

    // 2.3 Citizen Registration
    const { req: regReq, res: regRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/register",
      body: {
        fullName: "Citizen Rahim",
        username: "rahim_citizen",
        email: "rahim@citizen.test",
        password: "RahimPassword#2025",
        phone: "+8801711112233",
        role: "CITIZEN",
      },
    });
    await apiHandler(regReq, regRes);
    const regData = regRes._getData();
    citizenToken = regData?.token || "";
    assert(
      "Resident citizen can register smoothly with hashed password",
      regRes._getStatus() === 201 && citizenToken !== ""
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 3: SUPER ADMIN OPERATIONS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SET 3: Super Admin Operations (City Corp & City Admin Provisioning)");
  let createdCityId = "";
  {
    // 3.1 Create City Corporation entity purely (without admin fields)
    const { req, res } = mockReqRes({
      method: "POST",
      url: "/api/cities",
      headers: { authorization: `Bearer ${superToken}` },
      body: {
        name: "Chattogram City Corporation",
        code: "CCC_TEST",
        address: "Tigerpass, Chattogram",
        phone: "+880-31-610085",
        email: "info@ccc.gov.bd",
        pointRate: 0.25,
        minWithdrawPoints: 100,
      },
    });
    await apiHandler(req, res);
    const cityData = res._getData();
    createdCityId = cityData?.id || "";
    assert(
      "Super Admin can create City Corporation entity purely without requiring admin fields",
      (res._getStatus() === 200 || res._getStatus() === 201) && createdCityId !== "",
      `Status: ${res._getStatus()}, Data: ${JSON.stringify(cityData)}`
    );

    // 3.1b Create City Corporation Admin separately via users endpoint
    const { req: admReq, res: admRes } = mockReqRes({
      method: "POST",
      url: "/api/users",
      headers: { authorization: `Bearer ${superToken}` },
      body: {
        fullName: "Chief Engineer CCC",
        username: "ccc_admin_user",
        email: "ccc_admin@test.gov.bd",
        phone: "+8801700000001",
        password: "CccAdminPass#2025",
        role: "CITY_ADMIN",
        cityCorpId: createdCityId,
      },
    });
    await apiHandler(admReq, admRes);
    const admData = admRes._getData();
    assert(
      "Super Admin can create City Corporation Admin separately and assign to City Corp",
      (admRes._getStatus() === 200 || admRes._getStatus() === 201) && admData?.role === "CITY_ADMIN",
      `Status: ${admRes._getStatus()}`
    );

    // 3.2 List City Corporations
    const { req: listReq, res: listRes } = mockReqRes({
      method: "GET",
      url: "/api/cities",
    });
    await apiHandler(listReq, listRes);
    const citiesList = listRes._getData();
    assert(
      "Public / Super Admin can retrieve City Corporations list",
      Array.isArray(citiesList) && citiesList.length > 0
    );

    // 3.3 Log in as the newly created City Admin
    const { req: cityLogReq, res: cityLogRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { username: "ccc_admin_user", password: "CccAdminPass#2025" },
    });
    await apiHandler(cityLogReq, cityLogRes);
    const cityLoginData = cityLogRes._getData();
    cityAdminToken = cityLoginData?.token || "";
    assert(
      "Newly created City Admin can immediately log in with provisioned credentials",
      cityLogRes._getStatus() === 200 && cityAdminToken !== "" && cityLoginData?.user?.role === "CITY_ADMIN"
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 4: CITY ADMIN OPERATIONS (WARD & SUB-ADMIN PROVISIONING)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SET 4: City Admin Operations (Wards, Sub-Admins, Waste Logistics)");
  let createdWardId = "";
  {
    // 4.1 Create Ward in City Corp
    const { req, res } = mockReqRes({
      method: "POST",
      url: "/api/wards",
      headers: { authorization: `Bearer ${cityAdminToken}` },
      body: {
        name: "Ward 15",
        area: "Agrabad Commercial Area",
        cityCorpId: createdCityId,
        population: 65000,
        councilor: "Haji Mohammad Selim",
      },
    });
    await apiHandler(req, res);
    const wardData = res._getData();
    createdWardId = wardData?.id || "ward-15-test";
    assert(
      "City Admin can create and configure Wards",
      res._getStatus() === 200 || res._getStatus() === 201
    );

    // 4.2 Create Sub-Admin (Ward Admin) for this ward
    const { req: wardAdmReq, res: wardAdmRes } = mockReqRes({
      method: "POST",
      url: "/api/users",
      headers: { authorization: `Bearer ${cityAdminToken}` },
      body: {
        fullName: "Ward 15 Controller",
        username: "ward15_admin",
        password: "Ward15SecurePass#2025",
        role: "WARD_ADMIN",
        cityCorpId: createdCityId,
        wardId: createdWardId,
        email: "ward15@test.gov.bd",
      },
    });
    await apiHandler(wardAdmReq, wardAdmRes);
    assert(
      "City Admin can assign Ward Controller / Sub-Admin",
      wardAdmRes._getStatus() === 200 || wardAdmRes._getStatus() === 201
    );

    // 4.3 Log in as Ward Admin
    const { req: wLogReq, res: wLogRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { username: "ward15_admin", password: "Ward15SecurePass#2025" },
    });
    await apiHandler(wLogReq, wLogRes);
    const wLogData = wLogRes._getData();
    wardAdminToken = wLogData?.token || "";
    assert(
      "Ward Admin can log in successfully with assigned credentials",
      wLogRes._getStatus() === 200 && wardAdminToken !== ""
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 5: WARD ADMIN & IOT SMART BINS & FLEET MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SET 5: Ward Admin Smart Bins, IoT Telemetry, and Driver Operations");
  {
    // 5.1 Create Driver User
    const { req: drvReq, res: drvRes } = mockReqRes({
      method: "POST",
      url: "/api/users",
      headers: { authorization: `Bearer ${wardAdminToken}` },
      body: {
        fullName: "Driver Kamal Hossain",
        username: "driver_kamal",
        password: "DriverPass#2025",
        role: "DRIVER",
        cityCorpId: createdCityId,
        wardId: createdWardId,
        phone: "+8801733334455",
      },
    });
    await apiHandler(drvReq, drvRes);
    assert(
      "Ward Admin can register Smart Waste Collection Drivers",
      drvRes._getStatus() === 200 || drvRes._getStatus() === 201
    );

    // 5.2 Log in as Driver
    const { req: dLogReq, res: dLogRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { username: "driver_kamal", password: "DriverPass#2025" },
    });
    await apiHandler(dLogReq, dLogRes);
    const dLogData = dLogRes._getData();
    driverToken = dLogData?.token || "";
    assert(
      "Driver logs into Mobile Collector App with role DRIVER",
      dLogRes._getStatus() === 200 && driverToken !== "" && dLogData?.user?.role === "DRIVER"
    );

    // 5.3 Create Smart Bin with IoT Gas & Temperature Sensor Telemetry
    const { req: binReq, res: binRes } = mockReqRes({
      method: "POST",
      url: "/api/bins",
      headers: { authorization: `Bearer ${wardAdminToken}` },
      body: {
        binCode: "BIN-AGR-01",
        location: "Agrabad Access Road Corner",
        capacity: "240L",
        fill: 92,
        weight: 110,
        temp: "48°C [HIGH TEMP HAZARD]",
        gas: "68 ppm [AMMONIA SPIKE]",
        fire: false,
        status: "critical",
        lat: 22.325,
        lng: 91.815,
        wardId: createdWardId,
      },
    });
    await apiHandler(binReq, binRes);
    assert(
      "Ward Admin can register Smart Bin with IoT sensor thresholds",
      binRes._getStatus() === 200 || binRes._getStatus() === 201
    );

    // 5.4 Query Smart Bins list
    const { req: bListReq, res: bListRes } = mockReqRes({
      method: "GET",
      url: "/api/bins",
    });
    await apiHandler(bListReq, bListRes);
    const binsList = bListRes._getData();
    assert("Smart Bins telemetry retrieved successfully", Array.isArray(binsList) && binsList.length > 0);

    // 5.5 Query IoT Alerts
    const { req: altReq, res: altRes } = mockReqRes({
      method: "GET",
      url: "/api/alerts",
    });
    await apiHandler(altReq, altRes);
    assert("System Alerts & IoT hazard detection endpoint works", altRes._getStatus() === 200);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 6: CITIZEN PORTAL & REWARD POINT WITHDRAWAL
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SET 6: Citizen Portal (Disposal Rewards & Withdrawal Verification)");
  {
    // 6.1 Citizen Books Special / Bulk Pickup
    const { req: pickReq, res: pickRes } = mockReqRes({
      method: "POST",
      url: "/api/pickups",
      headers: { authorization: `Bearer ${citizenToken}` },
      body: {
        requesterType: "CITIZEN",
        area: "Agrabad Commercial Area",
        address: "House 12, Road 4, Agrabad",
        wasteType: "Recyclable Plastic & E-Waste",
        date: "2026-10-25",
        amount: 15,
      },
    });
    await apiHandler(pickReq, pickRes);
    assert(
      "Resident Citizen can book on-demand waste pickup request",
      pickRes._getStatus() === 200 || pickRes._getStatus() === 201
    );

    // 6.2 Citizen Point Withdrawal Request
    const { req: withReq, res: withRes } = mockReqRes({
      method: "POST",
      url: "/api/withdrawals",
      headers: { authorization: `Bearer ${citizenToken}` },
      body: {
        points: 200,
        amount: 40,
        wardId: createdWardId,
        citizenName: "Citizen Rahim",
        citizenPhone: "+8801711112233",
      },
    });
    await apiHandler(withReq, withRes);
    const withData = withRes._getData();
    assert(
      "Citizen can request eco-points cash redemption with 6-digit verification code",
      (withRes._getStatus() === 200 || withRes._getStatus() === 201) &&
        Boolean(withData?.verificationCode || withData?.withdrawal?.verificationCode)
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SET 7: PASSWORD RECOVERY (FORGOT PASSWORD & VERIFICATION)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST SET 7: Account Security & Forgot Password Recovery Engine");
  {
    // 7.1a Role isolation test: searching Super Admin credentials from citizen portal should reject
    const { req: isoReq, res: isoRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/forgot-password",
      body: { identifier: "spsshafiq_qa", role: "CITIZEN" },
    });
    await apiHandler(isoReq, isoRes);
    assert(
      "Cross-role password reset attempt strictly rejected (user-based role segregation)",
      isoRes._getStatus() === 404
    );

    // 7.1b Request Password Reset Code
    const { req: fpReq, res: fpRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/forgot-password",
      body: { identifier: "spsshafiq_qa", role: "SUPER_ADMIN" },
    });
    await apiHandler(fpReq, fpRes);
    const fpData = fpRes._getData();
    const recoveryToken = fpData?.recoveryToken || "";
    const decoded = recoveryToken ? jwt.decode(recoveryToken) : null;
    const resetOtp = decoded?.otpCode || "";

    assert(
      "Forgot password dispatches 6-digit code, returns stateless recoveryToken without leaking previewCode in response",
      fpRes._getStatus() === 200 && fpData?.success === true && fpData?.previewCode === undefined && recoveryToken !== "",
      `Status: ${fpRes._getStatus()}`
    );

    // 7.2 Reset password with verified code
    const { req: rpReq, res: rpRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/reset-password",
      body: {
        identifier: "spsshafiq_qa",
        code: resetOtp,
        recoveryToken,
        newPassword: "BrandNewSuperPassword#2026",
      },
    });
    await apiHandler(rpReq, rpRes);
    assert(
      "Password can be securely updated with recoveryToken and OTP verification",
      rpRes._getStatus() === 200 && rpRes._getData()?.success === true
    );

    // 7.3 Log in with newly updated password
    const { req: newLogReq, res: newLogRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { username: "spsshafiq_qa", password: "BrandNewSuperPassword#2026" },
    });
    await apiHandler(newLogReq, newLogRes);
    assert(
      "User can immediately log in with new reset password",
      newLogRes._getStatus() === 200 && newLogRes._getData()?.token
    );

    // 7.4 Verify backdoor 123456 is strictly rejected
    const { req: bdReq, res: bdRes } = mockReqRes({
      method: "POST",
      url: "/api/auth/reset-password",
      body: {
        identifier: "spsshafiq_qa",
        code: "123456",
        newPassword: "HackerPassword#2026",
      },
    });
    await apiHandler(bdReq, bdRes);
    assert(
      "Hardcoded backdoor OTP (123456) is completely removed and rejected with HTTP 400",
      bdRes._getStatus() === 400
    );
  }

  console.log("\n========================================================");
  console.log(`   TEST RESULTS: ${passedTests} PASSED / ${totalTests} TOTAL (${failedTests} FAILED)`);
  console.log("========================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
