import { View, Text, TouchableOpacity } from 'react-native'

import type { TranslationKey } from '@repo/i18n';

import { useTranslation } from '@/hooks/i18n';

import type { NotificationFilter } from '@/app/(notification)/components/NotificationList';

const FILTERS: { value: NotificationFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'unread', labelKey: 'notifications.filter.unread' },
];

interface NotificationFilterTabsProps {
  value: NotificationFilter;
  onChange: (value: NotificationFilter) => void;
}

/** All / Unread pills, mirroring the web drawer's filter. */
export default function NotificationFilterTabs({ value, onChange }: NotificationFilterTabsProps) {
  const { t } = useTranslation();

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
              {t(filter.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  )
}
