import type { TranslationKey } from '@repo/i18n';

// User Role Buttons Data
interface UserRole {
  labelKey: TranslationKey,
  type: 'primary' | 'secondary',
  userType: 'landlord' | 'tenant',
}

export const USER_ROLES: UserRole[] = [
  {
    labelKey: "authMobile.onboarding.landlord",
    type: 'secondary',
    userType: 'landlord'
  },
  {
    labelKey: "authMobile.onboarding.tenant",
    type: 'primary',
    userType: 'tenant'
  },
]
