export const OWN_ELECTRICITY_METER_CONFIRMATION =
  "I confirm this unit has its own dedicated electricity meter.";
export const OWN_ELECTRICITY_METER_DESCRIPTION =
  "Shared meters and submeters are not accepted.";
export const OWN_ELECTRICITY_METER_DETAIL = "Electricity: Own meter";
export const OWN_ELECTRICITY_METER_ERROR =
  "Confirm this unit has its own dedicated electricity meter. Shared meters and submeters are not accepted.";

export function getOwnElectricityMeterError(confirmed: unknown): string | undefined {
  return confirmed === true ? undefined : OWN_ELECTRICITY_METER_ERROR;
}
