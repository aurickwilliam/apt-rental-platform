import { View, Text, ImageSourcePropType } from 'react-native'
import { ImageSource } from 'expo-image';
import { IconStar, IconStarHalfFilled, IconStarFilled } from '@tabler/icons-react-native';
import { Avatar, Card, PressableFeedback } from 'heroui-native';
import { DEFAULT_IMAGES } from '../../constants/images'
import { useColors } from '@/hooks/useTheme';

interface SmallRatingCardProps {
  accountName: string;
  profilePictureUrl?: ImageSource;
  rating: number;
  comment: string;
  date: string;
  onPress?: () => void;
}

function StarIcon({ index, rating, size, color }: { index: number; rating: number; size: number; color: string }) {
  const diff = rating - index;

  if (diff >= 1) {
    return <IconStarFilled size={size} color={color} />;
  }
  if (diff >= 0.5) {
    return <IconStarHalfFilled size={size} color={color} />;
  }
  return <IconStar size={size} color={color} />;
}

export default function SmallRatingCard({
  accountName,
  profilePictureUrl = DEFAULT_IMAGES.defaultProfilePicture,
  rating,
  comment,
  date,
  onPress
}: SmallRatingCardProps) {
  const { colors } = useColors();
  return (
    <PressableFeedback onPress={onPress} className='rounded-3xl border border-border'>
      <PressableFeedback.Highlight />
      <Card variant="transparent" className='bg-surface p-3 rounded-3xl h-30'>
        <Card.Header className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <Avatar size="sm" className='border border-border'>
              <Avatar.Image source={profilePictureUrl as ImageSourcePropType} />
              <Avatar.Fallback />
            </Avatar>
            <View>
              <Card.Title
                className='font-interMedium text-sm text-foreground'
                numberOfLines={1}
              >
                {accountName}
              </Card.Title>
              <Text className='font-inter text-xs text-muted'>
                {date}
              </Text>
            </View>
          </View>
          <View className='flex-row items-center gap-1'>
            <View className='flex-row items-center gap-0.5'>
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon
                  key={index}
                  index={index}
                  rating={rating}
                  size={16}
                  color={colors.secondary}
                />
              ))}
            </View>

            <Text className='font-interMedium text-xs text-foreground'>
              {rating.toFixed(1)}
            </Text>
          </View>
        </Card.Header>
        <Card.Body className='mt-3'>
          <Card.Description
            numberOfLines={2}
            className='font-inter text-sm text-text'
          >
            {comment}
          </Card.Description>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}
