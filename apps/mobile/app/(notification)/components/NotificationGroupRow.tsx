import { View, Text, TouchableOpacity } from 'react-native'
import { IconChevronDown } from '@tabler/icons-react-native';
import {
  composeNotificationGroupLabel,
  formatMessageGroupCount,
  getRelativeTime,
} from '@repo/utils'
import type { MessageGroupUnit } from '@repo/utils'

import NotificationIconTile from '@/app/(notification)/components/NotificationIconTile';
import NotificationRow from '@/app/(notification)/components/NotificationRow';
import type { NotificationItem } from '@/hooks/notifications';
import { useColors } from '@/hooks/useTheme';

interface NotificationGroupRowProps {
  unit: MessageGroupUnit<NotificationItem>;
  expanded: boolean;
  onToggle: () => void;
  onOpenGroup: () => void;
  onOpenMember: (notification: NotificationItem) => void;
}

/**
 * One collapsed burst of chat messages: a summary row that opens the
 * conversation, plus a separate chevron that expands the underlying
 * notifications in place. The chevron never navigates or acknowledges
 * anything; member rows keep the single-row read behavior.
 */
export default function NotificationGroupRow({
  unit,
  expanded,
  onToggle,
  onOpenGroup,
  onOpenMember,
}: NotificationGroupRowProps) {
  const { colors } = useColors();
  const timestamp = getRelativeTime(new Date(unit.latest.created_at));
  const accessibleLabel = composeNotificationGroupLabel({
    senderName: unit.latest.title,
    count: unit.count,
    // Expanded members already show the content, so the summary drops it.
    latest: expanded ? null : unit.latest.message,
    isUnread: unit.hasUnread,
  });

  return (
    <View>
      <View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenGroup}
          accessibilityRole="button"
          accessibilityLabel={`${accessibleLabel}, ${timestamp}`}
          className="flex-row items-start gap-3 px-3 py-3"
        >
          <NotificationIconTile type="message" title={unit.latest.title} />

          <View className="flex-1 pr-8">
            <Text className="text-foreground text-base leading-6 font-nunito" numberOfLines={2}>
              <Text className="font-nunitoBold">{unit.latest.title}</Text>
              {` ${formatMessageGroupCount(unit.count).toLowerCase()}`}
            </Text>

            {!expanded && unit.latest.message ? (
              <Text className="text-muted text-sm leading-5 font-inter" numberOfLines={1}>
                {`Latest: “${unit.latest.message}”`}
              </Text>
            ) : null}

            <Text className="text-muted text-xs mt-0.5 font-inter">{timestamp}</Text>
          </View>

          <View
            className={`absolute right-3 top-4 h-2 w-2 rounded-full ${unit.hasUnread ? 'bg-primary' : 'bg-transparent'}`}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} messages from ${unit.latest.title}`}
          accessibilityState={{ expanded }}
          className="absolute bottom-1 right-1 h-10 w-10 items-center justify-center"
        >
          <IconChevronDown
            size={20}
            color={colors.gray500}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View className="ml-[72px]" accessibilityLabel={`Messages from ${unit.latest.title}`}>
          {unit.members.map((member) => (
            <NotificationRow
              key={member.id}
              notification={member}
              compact
              onPress={() => onOpenMember(member)}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
