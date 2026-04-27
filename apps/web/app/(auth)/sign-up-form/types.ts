export interface SignUpFormData {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: string;
  mobileNumber: string;
  streetAddress: string;
  barangay: string;
  city: string;
  stateProvince: string;
  postalCode: number | undefined;
  password: string;
  confirmPassword: string;
}