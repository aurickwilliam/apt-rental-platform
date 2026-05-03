// User Role Buttons Data
interface UserRole {
  label: string,
  type: 'primary' | 'secondary',
  userType: 'landlord' | 'tenant',
}

export const USER_ROLES: UserRole[] = [
  {
    label: "I'm a Landlord",
    type: 'secondary',
    userType: 'landlord'
  },
  {
    label: "I'm a Tenant",
    type: 'primary',
    userType: 'tenant'
  },
]