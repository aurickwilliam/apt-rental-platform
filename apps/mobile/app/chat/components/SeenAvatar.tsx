import { Text, View } from 'react-native';
import { Avatar } from 'heroui-native';
import { getInitials } from '@repo/utils';

interface SeenAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  /** Clears a reaction badge, which hangs below the bubble's bottom edge. */
  belowReactions?: boolean;
}

/** The other person's 16px avatar under your newest message they've read (web's "Seen" receipt). */
export default function SeenAvatar({ name, avatarUrl, belowReactions = false }: SeenAvatarProps) {
  const label = name ? `Seen by ${name}` : 'Seen by recipient';

  return (
    <View
      className={`self-end mr-1 ${belowReactions ? 'mt-4' : 'mt-1'}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Avatar size="sm" color="accent" className="size-4 rounded-full overflow-hidden" alt={label}>
        {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
        <Avatar.Fallback delayMs={200} className="justify-center items-center rounded-full">
          <Text className="text-accent text-[7px] font-nunitoSemiBold leading-none">
            {name ? getInitials(name) : '?'}
          </Text>
        </Avatar.Fallback>
      </Avatar>
    </View>
  );
}
