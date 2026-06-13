import { Image, View } from 'react-native'
import { Avatar, Chip, Text } from 'heroui-native';

import { Home, Building2, LucideIcon } from 'lucide-react-native';

import { useColors } from 'hooks/useTheme';

type ProfileHeaderProps = {
  backgroundPhotoUri?: string | null
  avatarUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarInitials?: string
  loading?: boolean
  role?: string | null
}

export function ProfileHeader({
  backgroundPhotoUri,
  avatarUrl,
  firstName,
  lastName,
  email,
  avatarInitials,
  loading = false,
  role,
}: ProfileHeaderProps) {
  const { colors } = useColors();
  
  const fullName = loading ? '...' : `${firstName} ${lastName}`;
  const displayEmail = loading ? '...' : email;

  type RoleConfig = {
    [key: string]: {
      icon: LucideIcon;
      iconColor: string;
      className: string;
      label: string;
      labelColor: string;
    }
  };

  const roleConfig: RoleConfig = {
    tenant: {
      icon: Home,
      iconColor: colors.primary,
      className: "bg-blue-200",
      label: "Tenant",
      labelColor: "text-primary"
    },
    landlord: {
      icon: Building2,
      iconColor: colors.secondary,
      className: "bg-amber-200",
      label: "Landlord",
      labelColor: "text-secondary"
    },
  };

  return (
    <View className='relative h-80'>
      {/* Background Photo */}
      <View 
        className={`w-full h-45 rounded-b-3xl overflow-hidden ${
          backgroundPhotoUri ? 'bg-transparent' : 'bg-surface-tertiary'
        }`}
      >
        {backgroundPhotoUri && (
          <Image
            source={{ uri: backgroundPhotoUri }}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </View>

      {/* Profile Picture */}
      <View className='absolute top-18 left-0 right-0 items-center'>
        <Avatar
          size="lg"
          color="accent"
          className="size-36 border-4 border-background mb-1"
          alt={fullName}
        >
          <Avatar.Image source={{ uri: avatarUrl ?? '' }} />
          <Avatar.Fallback delayMs={200}>
            {avatarInitials ?? ''}
          </Avatar.Fallback>
        </Avatar>

        {/* Name and Email */}
        <View className='flex items-center justify-center'>
          <Text className='text-foreground text-xl font-interSemiBold'>
            {fullName}
          </Text>

          <Text className='text-gray-500 text-base font-inter'>
            {displayEmail}
          </Text>

          {role && (() => {
            const {
              icon: Icon,
              iconColor,
              className,
              label,
              labelColor,
            } = roleConfig[role];

            return (
              <View className='items-center mt-2'>
                <Chip className={className} variant='soft'>
                  <Icon size={18} color={iconColor} strokeWidth={2.5} />
                  <Chip.Label className={`font-interMedium ${labelColor}`}>
                    {label}
                  </Chip.Label>
                </Chip>
              </View>
            );
          })()}
        </View>
      </View>
    </View>
  )
}