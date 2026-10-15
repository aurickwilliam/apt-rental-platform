import type { UserProfile } from "@/service/auth/currentUserService";

export const profileFixture: UserProfile = {
  id: "profile-1", user_id: "auth-1", first_name: "Juan", middle_name: "Santos",
  last_name: "Dela Cruz", suffix: "Jr.", email: "juan@example.com", mobile_number: "09171234567",
  gender: "Male", birth_date: "1995-06-12", street_address: "123 Street",
  province: "Metro Manila", city: "Caloocan", barangay: "Barangay 1", postal_code: 1400,
  avatar_url: "https://cdn.example/avatar.jpg", background_url: "https://cdn.example/background.jpg",
  roles: ["tenant"], account_status: "verified", preferences: null,
};
