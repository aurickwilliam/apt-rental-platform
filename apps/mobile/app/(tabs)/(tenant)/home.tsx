import { View, Text, Image } from 'react-native'

import ScreenWrapper from '../../../components/ScreenWrapper'
import PaymentSummaryCard from '../../../components/PaymentSummaryCard'
import QuickActionButton from '../../../components/QuickActionButton'

import { IMAGES } from '../../../constants/images'
import { COLORS } from '../../../constants/colors'

// Icons
import {
  IconBell,
  IconHeart,
  IconBubbleText,
  IconFileText,
  IconReceipt,
  IconCash,
  IconTool,
  IconHome2,
  IconSettings,
  IconHelp,
  IconProps,
} from "@tabler/icons-react-native"

export default function Home() {

  type actionsTypes = {
    id: number;
    label: string;
    icon: React.ComponentType<IconProps>;
  }

  const actions: actionsTypes[] = [
    { id: 1, label: 'Chat Landlord', icon: IconBubbleText },
    { id: 2, label: 'View Lease', icon: IconFileText },
    { id: 3, label: 'View Receipts', icon: IconReceipt },
    { id: 4, label: 'Pay Rent', icon: IconCash },
    { id: 5, label: 'Request Maintenance', icon: IconTool },
    { id: 6, label: 'Property Details', icon: IconHome2 },
    { id: 7, label: 'Settings', icon: IconSettings },
    { id: 8, label: 'FAQ', icon: IconHelp },
  ]

  return (
    <ScreenWrapper scrollable className='p-5'>

      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-4'>
          {/* Logo Image */}
          <View className='h-9 w-9'>
            <Image
              source={IMAGES.logo}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          {/* Greeting Text */}
          <Text className='text-secondary text-2xl font-dmserif'>
            Hi, John Doe!
          </Text>
        </View>

        <View className='flex-row items-center gap-4'>
          {/* Notification Icon */}
          <IconBell
            size={26}
            color={COLORS.grey}
            onPress={() => console.log('Notification pressed')}
          />

          {/* Favorites Icon */}
          <IconHeart
            size={26}
            color={COLORS.grey}
            onPress={() => console.log('Favorites pressed')}
          />
        </View>
      </View>

      {/* Payment Summary Card */}
      <PaymentSummaryCard
        monthDue={'January'}
        amountDue={1_200.00}
        address='123 Main St, Apt 4B'
        daysRemaining={10}
      />

      {/* Quick Actions List */}
      <View className='flex mt-5'>
        <Text className='text-text text-xl font-poppinsSemiBold'>
          Quick Actions
        </Text>

        {/* Actions List */}
        <View className='mt-5 flex-row flex-wrap'>
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              label={action.label}
              icon={action.icon}
            />
          ))}
        </View>
      </View>

    </ScreenWrapper>
  )
}
