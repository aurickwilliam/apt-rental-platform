import { View, Text, ImageSourcePropType } from 'react-native'
import { ImageSource } from 'expo-image';

import { Avatar, Card, PressableFeedback } from 'heroui-native';

import StarRating from '../display/StarRating';

import { getInitials } from '@repo/utils';

interface SmallRatingCardProps {
  accountName: string;
  profilePictureUrl?: ImageSource;
  rating: number;
  comment: string;
  date: string;
  onPress?: () => void;
}

export default function SmallRatingCard({
  accountName,
  profilePictureUrl,
  rating,
  comment,
  date,
  onPress
}: SmallRatingCardProps) {

  return (
    <PressableFeedback onPress={onPress} className='rounded-3xl border border-border'>
      <PressableFeedback.Highlight />
      <Card variant="transparent" className='bg-surface p-3 rounded-3xl h-30'>
        <Card.Header className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <Avatar size="sm" className='border border-border'>
              <Avatar.Image source={profilePictureUrl as ImageSourcePropType} />
              <Avatar.Fallback>
                <Text className='text-accent text-sm font-interMedium'>
                  {getInitials(accountName)}
                </Text>
              </Avatar.Fallback>
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
            <StarRating
              rating={rating}
              size={16}
            />

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
