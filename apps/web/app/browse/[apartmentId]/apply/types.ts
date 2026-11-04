import type { ApplyApartmentContext } from "./lib/get-apply-context";

export type { ApplyApartmentContext };

/** Every field of the apply form, owned by `ApplyClient`. */
export interface ApplicationForm {
  fullName: string;
  email: string;
  dateOfBirth: string;
  contactNumber: string;
  currentAddress: string;
  employmentType: string;
  occupation: string;
  companyName: string;
  monthlyIncomeText: string;
  monthlyIncome: number | null;
  prevLandlordName: string;
  prevLandlordContact: string;
  moveInDate: string;
  noOccupants: string;
  hasPets: string | null;
  isSmoker: string | null;
  needParking: string | null;
  /** Follow-ups to "Do you have pets?"; only read while it is "yes". */
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
  /** Follow-ups to "Do you need parking?"; only read while it is "yes". */
  noOfParkingSpots: number;
  listOfVehicles: string[];
  /** Whether anyone in the household has a disability ("yes" / "no"). */
  hasDisability: string | null;
  additionalNotes: string;
}

export type ApplicationErrors = Record<string, string>;

/** Props shared by the editable form steps. */
export interface ApplicationStepProps {
  form: ApplicationForm;
  errors: ApplicationErrors;
  onChange: (patch: Partial<ApplicationForm>) => void;
  clearError: (key: string) => void;
}

export const EMPTY_APPLICATION_FORM: ApplicationForm = {
  fullName: "",
  email: "",
  dateOfBirth: "",
  contactNumber: "",
  currentAddress: "",
  employmentType: "",
  occupation: "",
  companyName: "",
  monthlyIncomeText: "",
  monthlyIncome: null,
  prevLandlordName: "",
  prevLandlordContact: "",
  moveInDate: "",
  noOccupants: "",
  hasPets: null,
  isSmoker: null,
  needParking: null,
  kindOfPets: [],
  noOfPets: 1,
  nameOfPets: null,
  noOfParkingSpots: 1,
  listOfVehicles: [],
  hasDisability: null,
  additionalNotes: "",
};
