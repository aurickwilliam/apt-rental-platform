import { View } from 'react-native'
import { Card, SkeletonGroup } from 'heroui-native'

export default function RatingCardSkeleton() {
  return (
    <SkeletonGroup isLoading>
      <Card className='w-full overflow-hidden rounded-3xl border border-border shadow-none p-3'>
        <Card.Body className='gap-2 p-0'>
          <View className='flex-row items-start justify-between'>
            <View className='flex-row items-center gap-2 flex-1 pr-3'>
              <SkeletonGroup.Item className='h-9 w-9 rounded-full' />
              <View className='flex-1 gap-1.5'>
                <SkeletonGroup.Item className='h-3.5 w-32 rounded-md' />
                <SkeletonGroup.Item className='h-3 w-20 rounded-md' />
              </View>
            </View>
            <SkeletonGroup.Item className='h-4 w-14 rounded-md' />
          </View>

          <View className='gap-1.5 mt-1'>
            <SkeletonGroup.Item className='h-3.5 w-full rounded-md' />
            <SkeletonGroup.Item className='h-3.5 w-full rounded-md' />
            <SkeletonGroup.Item className='h-3.5 w-2/3 rounded-md' />
          </View>

          <View className='flex-row gap-2 mt-1'>
            <SkeletonGroup.Item className='h-16 w-16 rounded-xl' />
            <SkeletonGroup.Item className='h-16 w-16 rounded-xl' />
            <SkeletonGroup.Item className='h-16 w-16 rounded-xl' />
          </View>
        </Card.Body>
      </Card>
    </SkeletonGroup>
  )
}
