import { Pressable, Text } from 'react-native';
import { Avatar } from 'heroui-native';
import { getInitials } from '@repo/utils';

interface SenderAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  onPress?: () => void;
}

/** The other person's small avatar beside their last bubble in a run. */
export default function SenderAvatar({ name, avatarUrl, onPress }: SenderAvatarProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={name ? `View ${name}'s profile` : 'View profile'}
      hitSlop={6}
    >
      <Avatar size="sm" color="accent" className="size-8 rounded-full overflow-hidden" alt={name}>
        {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
        <Avatar.Fallback delayMs={200} className="justify-center items-center rounded-full">
          <Text className="text-accent text-xs font-nunitoSemiBold leading-none">
            {name ? getInitials(name) : '?'}
          </Text>
        </Avatar.Fallback>
      </Avatar>
    </Pressable>
  );
}
