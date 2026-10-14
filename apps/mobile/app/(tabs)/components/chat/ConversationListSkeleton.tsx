import { View } from 'react-native'

import { SkeletonGroup } from 'heroui-native'

// Varied widths so the placeholder rows don't look like a stamped pattern.
const ROWS = [
  { name: 'w-32', apartment: 'w-40', message: 'w-48' },
  { name: 'w-28', apartment: 'w-36', message: 'w-56' },
  { name: 'w-36', apartment: 'w-32', message: 'w-44' },
  { name: 'w-24', apartment: 'w-40', message: 'w-52' },
  { name: 'w-32', apartment: 'w-28', message: 'w-40' },
  { name: 'w-28', apartment: 'w-36', message: 'w-48' },
];

/**
 * Messages list placeholder, shaped like `MessageCard`: 64px avatar, then
 * name + time, apartment, and last-message lines.
 */
export default function ConversationListSkeleton() {
  return (
    <View accessible accessibilityRole='progressbar' accessibilityLabel='Loading messages'>
      <SkeletonGroup isLoading>
        {ROWS.map((row, index) => (
          <View key={index} className='flex-row items-center gap-3 py-3'>
            <SkeletonGroup.Item className='size-16 rounded-full' />

            <View className='flex-1 gap-2'>
              <View className='flex-row items-center justify-between'>
                <SkeletonGroup.Item className={`h-3.5 ${row.name} rounded-full`} />
                <SkeletonGroup.Item className='h-3 w-10 rounded-full' />
              </View>
              <SkeletonGroup.Item className={`h-3 ${row.apartment} rounded-full`} />
              <SkeletonGroup.Item className={`h-3 ${row.message} rounded-full`} />
            </View>
          </View>
        ))}
      </SkeletonGroup>
    </View>
  );
}
