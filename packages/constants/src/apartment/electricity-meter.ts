// The stored flag is still `apartments.has_own_electricity_meter` (kept so older
// clients and rows keep working); it now means the unit has its own dedicated
// electricity AND water meters. All wording lives here so web and mobile agree.
export const OWN_ELECTRICITY_METER_CONFIRMATION =
  "I confirm this unit has its own dedicated electricity and water meters.";
export const OWN_ELECTRICITY_METER_DESCRIPTION =
  "Shared meters and submeters are not accepted for either utility.";
export const OWN_ELECTRICITY_METER_DETAIL = "Own meter (electricity and water)";
export const OWN_ELECTRICITY_METER_FIELD_LABEL = "Utility meters";
export const OWN_ELECTRICITY_METER_ERROR =
  "Confirm this unit has its own dedicated electricity and water meters. Shared meters and submeters are not accepted.";

export function getOwnElectricityMeterError(confirmed: unknown): string | undefined {
  return confirmed === true ? undefined : OWN_ELECTRICITY_METER_ERROR;
}

/** Display text for a listing's meter setup; null unless the landlord confirmed it. */
export function getOwnElectricityMeterDetail(confirmed: unknown): string | null {
  return confirmed === true ? OWN_ELECTRICITY_METER_DETAIL : null;
}
