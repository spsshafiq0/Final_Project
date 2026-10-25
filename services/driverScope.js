/**
 * IntelliWaste Driver Bin Scope Helper (Pure JS)
 *
 * Enforces server-side scoping based on authenticated driver's assignment:
 * 1. If ward is NOT chosen (null / 'all' / undefined): scope is ALL bins in that City Corporation.
 * 2. If ward IS chosen: scope is strictly restricted to that single Ward.
 * 3. Never trust IDs from client requests.
 */

export function getDriverBinScope(driver) {
  if (!driver) {
    throw new Error("Unauthorized: Authenticated driver context is required");
  }

  const assignment = driver.assignment || {};
  const cityCorp = assignment.cityCorporation || driver.cityCorpId || driver.cityCorp?.id;
  const rawWard = assignment.ward !== undefined ? assignment.ward : (driver.wardId || driver.ward?.id);
  const ward = (rawWard && rawWard !== "all" && String(rawWard).trim() !== "") ? String(rawWard) : null;

  if (!cityCorp) {
    throw new Error("Driver has no assigned City Corporation. Contact City Admin.");
  }

  const scope = {
    cityCorporation: String(cityCorp),
    cityCorpId: String(cityCorp),
  };

  if (ward) {
    scope.ward = String(ward);
    scope.wardId = String(ward);
  }

  return scope;
}

export default getDriverBinScope;
