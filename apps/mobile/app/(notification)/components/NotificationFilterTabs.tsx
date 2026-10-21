import { View, Text, TouchableOpacity } from 'react-native'

import type { NotificationFilter } from '@/app/(notification)/components/NotificationList';

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

interface NotificationFilterTabsProps {
  value: NotificationFilter;
  onChange: (value: NotificationFilter) => void;
}

/** All / Unread pills, mirroring the web drawer's filter. */
export default function NotificationFilterTabs({ value, onChange }: NotificationFilterTabsProps) {
  return (
    <View className="flex-row items-center gap-1" accessibilityRole="tablist">
      {FILTERS.map((filter) => {
        const selected = value === filter.value;

        return (
          <TouchableOpacity
            key={filter.value}
            activeOpacity={0.7}
            onPress={() => onChange(filter.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`rounded-full px-3 py-1.5 ${selected ? 'bg-primary-light' : ''}`}
          >
            <Text
              className={`text-base font-nunitoSemiBold ${selected ? 'text-primary-light-foreground' : 'text-muted'}`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  )
}
