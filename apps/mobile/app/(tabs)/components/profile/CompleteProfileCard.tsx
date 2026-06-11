import { useRouter } from 'expo-router';

import {
  Card,
  Button
} from 'heroui-native';

import { UserRoundPen } from 'lucide-react-native';

import { COLORS } from '@repo/constants';

interface CompleteProfileCardProps {
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export default function CompleteProfileCard({
  email,
  role,
  firstName,
  lastName
}: CompleteProfileCardProps) {
  const router = useRouter();

  const handleCompleteProfile = async () => {
    router.push({
      pathname: '/(auth)/auth-complete-profile',
      params: {
        email: email,
        userSide: role,
        firstName: firstName,
        lastName: lastName
      },
    });
  }

  return (
    <Card className='mx-5 mb-5 shadow-none'>
      <Card.Header className="flex-row gap-3 items-center">
        <UserRoundPen size={24} color={COLORS.text} />
        <Card.Title className='text-text font-interSemiBold'>
          Complete Your Profile
        </Card.Title>
      </Card.Header>

      <Card.Body className='gap-3 mt-3'>
        <Card.Description className='text-text font-inter text-sm'>
          To get the best experience, please complete your profile by adding more details about yourself and your preferences.
        </Card.Description>

        <Button
          size="sm"
          onPress={handleCompleteProfile}
        >
          <Button.Label>
            Complete Profile
          </Button.Label>
        </Button>
      </Card.Body>
    </Card>
  )
}