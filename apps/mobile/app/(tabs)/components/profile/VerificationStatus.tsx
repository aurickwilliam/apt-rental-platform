import { View, Text } from 'react-native'
import { useRouter } from 'expo-router';

import {
  IconId,
  IconCircleCheckFilled,
  IconExclamationCircleFilled,
  IconXboxXFilled,
  IconProps,
  IconCamera,
} from '@tabler/icons-react-native';

import { Button, Card } from 'heroui-native';

import { useColors } from 'hooks/useTheme';

type AccountStatus = 'verified' | 'pending' | 'rejected' | 'unverified';

type StatusConfig = {
  [key in AccountStatus]: {
    text: string;
    style: string;
    icon: React.ComponentType<IconProps>;
    iconColor: string;
  };
};

type VerificationStatusProps = {
  accountStatus?: AccountStatus;
  rejectedReason?: string;
  dateVerified?: string;
};

export function VerificationStatus({
  accountStatus = 'unverified',
  rejectedReason,
  dateVerified,
}: VerificationStatusProps) {
  const router = useRouter();
  const { colors } = useColors();

  const STATUS_CONFIG: StatusConfig = {
    verified: {
      text: 'Verified Tenant',
      style: 'text-success',
      icon: IconCircleCheckFilled,
      iconColor: colors.success,
    },
    pending: {
      text: 'Pending Verification',
      style: 'text-warning',
      icon: IconExclamationCircleFilled,
      iconColor: colors.warning,
    },
    rejected: {
      text: 'Rejected',
      style: 'text-danger',
      icon: IconXboxXFilled,
      iconColor: colors.danger,
    },
    unverified: {
      text: 'Not Verified',
      style: 'text-gray-400',
      icon: IconExclamationCircleFilled,
      iconColor: colors.gray500,
    },
  };

  const config = STATUS_CONFIG[accountStatus];
  const Icon = config.icon;

  return (
    <Card className='mx-5 shadow-none'>
      <Card.Header className='flex-row gap-3 items-center pb-0'>
        <IconId size={24} color={colors.textPrimary} />
        <Card.Title className='text-foreground font-interSemiBold'>
          Verification Status
        </Card.Title>
      </Card.Header>

      <Card.Body className='gap-3 mt-3'>
        <View className='flex-row items-center gap-2'>
          <Icon size={26} color={config.iconColor} />
          <Text className={`text-lg ${config.style} font-interMedium`}>
            {config.text}
          </Text>
        </View>

        {accountStatus === 'rejected' && (
          <>
            <Card.Description className='text-danger font-inter text-sm'>
              Reason: {rejectedReason}
            </Card.Description>
            <Button
              variant='primary'
              size='sm'
              onPress={() => router.push('/(auth)/verify-account')}
              className='w-full'
            >
              <IconCamera size={16} color='white' />
              <Button.Label>Re-Apply for Verification</Button.Label>
            </Button>
          </>
        )}

        {accountStatus === 'pending' && (
          <Card.Description className='text-gray-400 font-inter text-sm'>
            Your documents are currently under review. We will notify you once
            the verification process is complete.
          </Card.Description>
        )}

        {accountStatus === 'verified' && (
          <>
            <Card.Description className='text-gray-400 font-inter text-sm'>
              You have successfully been verified as a tenant. You can now apply
              for rental properties on our platform.
            </Card.Description>
            {dateVerified && (
              <Card.Description className='text-gray-400 font-inter text-sm'>
                Last Verified: {dateVerified}
              </Card.Description>
            )}
          </>
        )}

        {accountStatus === 'unverified' && (
          <>
            <Card.Description className='text-gray-400 font-inter text-sm'>
              Your account has not been verified yet. Please submit your
              documents to get verified.
            </Card.Description>
            <Button
              variant='primary'
              size='sm'
              onPress={() => router.push('/(auth)/verify-account')}
              className='w-full'
            >
              <IconCamera size={16} color='white' />
              <Button.Label>Apply for Verification</Button.Label>
            </Button>
          </>
        )}
      </Card.Body>
    </Card>
  );
}