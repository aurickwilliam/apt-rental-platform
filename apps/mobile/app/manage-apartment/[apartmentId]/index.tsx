import { View, Text, Image, TouchableOpacity, FlatList, Pressable, Modal } from 'react-native'
import ImageViewing from 'react-native-image-viewing'
import { useRouter, useLocalSearchParams} from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'
import TenantCard from '@/components/display/TenantCard'
import PaymentHistoryCard from '@/components/display/PaymentHistoryCard'
import MaintenanceRequestCard from '@/components/display/MaintenanceRequestCard'

import {
  IconBath,
  IconBed,
  IconHome,
  IconMaximize,
  IconUser,  
  IconCircleCheckFilled,
  IconLogout2,
  IconCircleX,
  IconDotsVertical,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import { DEFAULT_IMAGES, IMAGES } from '@/constants/images'

// Data for Rent Payment History
type paymentHistoryTypes = {
  id: number;
  month: string;
  year: string;
  amount: number;
  paidDate: string;
  status: 'paid' | 'partial'
}

export default function Index() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();

  const [imageIndex, setImageIndex] = useState<number>(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState<boolean>(false);

  const [open, setOpen] = useState(false);

  // For Testing
  const isOccupied = true;
  const hasMaintenanceRequest = true;

  // Dummy data for payment history
  const paymentHistory: paymentHistoryTypes[] = [
    {id: 1, month: 'January', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'paid'},
    {id: 2, month: 'February', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'partial'},
    {id: 3, month: 'March', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'paid'},
    {id: 4, month: 'April', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'partial'},
  ]

  // Dummy data for apartment Images
  const apartmentImages = [
    {
      id: 1,
      url: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri
    },
    {
      id: 2,
      url: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail2).uri
    },
    {
      id: 3,
      url: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail3).uri
    },
    {
      id: 4,
      url: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail4).uri
    }
  ]

  // Handle Image Viewing
  const handleImagePress = (index: number) => {
    setImageIndex(index);
    setIsImageViewVisible(true);
  }

  // Handle Vacate Action
  const handleVacateUnit = () => {
    setOpen(false);
    // TODO: Implement vacate logic here (e.g., API call to update unit status)
    console.log('Vacate unit logic goes here');
  }

  // Handle Remove Unit Action
  const handleRemoveUnit = () => {
    // TODO: Implement remove unit logic here (e.g., API call to delete the unit)
    console.log('Remove unit logic goes here');
    setOpen(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper
        className='p-5'
        header={
          <StandardHeader title='Property' />
        }
        scrollable
        bottomPadding={50}
      >
        {/* Image Carousel */}
        <View>
          <FlatList
            data={apartmentImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerClassName="gap-3 mb-3"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="rounded-2xl overflow-hidden w-48 h-60"
                activeOpacity={0.7}
                onPress={() => handleImagePress(apartmentImages.indexOf(item))}
              >
                <Image
                  source={{ uri: item.url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Property Details */}
        <View className='flex gap-5'>
          <View className='flex gap-1'>
            <Text className='text-primary text-3xl font-dmserif'>
              Property Name
            </Text>
            <Text className="text-text font-inter text-base">
              Full Address
            </Text>
          </View>

          {/* Monthly Rent */}
          <Text className='text-text text-lg font-interMedium'>
            ₱ 20,000<Text className="text-grey-500 font-inter text-base">/month</Text>
          </Text>

          {/* Apartment Type */}
          <View className='flex-row gap-1 items-center'>
            <IconHome size={24} color={COLORS.text} />
            <Text className='text-text text-base font-interMedium'>
              Apartment Type
            </Text>
          </View>

          {/* Specs */}
          <View className='flex-row flex-wrap'>
            {/* Bedroom */}
            <View className='flex-row w-2/6 gap-1 items-center justify-start'>
              <IconBed
                size={24}
                color={COLORS.text}
              />

              <Text className='text-grey-500 text-base'>
                1 Bedroom
              </Text>
            </View>

            {/* Bathroom */}
            <View className='flex-row w-2/6 gap-1 items-center justify-start'>
              <IconBath
                size={24}
                color={COLORS.text}
              />

              <Text className='text-grey-500 text-base'>
                1 Bathroom
              </Text>
            </View>

            {/* Square Meters */}
            <View className='flex-row w-2/6 gap-1 items-center justify-start'>
              <IconMaximize
                size={24}
                color={COLORS.text}
              />

              <Text className='text-grey-500 text-base'>
                50 Sqm
              </Text>
            </View>
          </View>

          <View className='mt-5 p-2 border-t border-b border-grey-300 flex-row items-center justify-between'>
            {/* No. of Properties */}
            <View className='flex items-center gap-1 w-1/3'>
              <Text className='text-base text-grey-500 font-inter'>
                No. of
              </Text>
              <Text className='text-3xl text-text font-interMedium'>
                5
              </Text>
              <Text className='text-base text-grey-500 font-interMedium'>
                Views
              </Text>
            </View>

            <View
              className='w-[1px] h-full bg-grey-300'
            />

            <View className='flex items-center gap-1 w-1/3'>
              <Text className='text-base text-grey-500 font-inter'>
                Ratings
              </Text>
              <Text className='text-3xl text-secondary font-interMedium'>
                4.5/5
              </Text>
              <Text className='text-base text-grey-500 font-interMedium'>
                Average
              </Text>
            </View>

            <View
              className='w-[1px] h-full bg-grey-300'
            />

            <View className='flex items-center gap-1 w-1/3'>
              <Text className='text-base text-grey-500 font-inter'>
                Status
              </Text>
              <IconCircleCheckFilled
                size={32}
                color={COLORS.greenHulk}
              />

              <Text className='text-base text-grey-500 font-interMedium'>
                Occupied
              </Text>
            </View>
          </View>
        </View>

        {/* Description Button */}
        <View className='mt-5'>
          <PillButton
            label='View Full Description'
            size='sm'
            onPress={() => {
              router.push(`/manage-apartment/${apartmentId}/description`)
            }}
          />
        </View>

        {
          isOccupied ? (
            <>
              {/* Tenant Information */}
              <View className='mt-5 flex gap-3'>
                <View className='flex-row gap-2 items-center'>
                  <IconUser size={26} color={COLORS.text} />
                  <Text className='text-text text-lg font-poppinsMedium'>
                    Tenant Information
                  </Text>
                </View>

                <TenantCard
                  fullName='John Doe'
                  email='john.doe@example.com'
                  phoneNumber='09123456789'
                  profilePictureUrl={Image.resolveAssetSource(DEFAULT_IMAGES.defaultProfilePicture).uri}
                  onPress={() => console.log('Tenant card pressed')}
                  leaseStartMonthYear={'Jan 2023'}
                  leaseEndMonthYear={'Jan 2024'}
                />
              </View>

              {/* If it has Maintenance Requests */}
              {
                hasMaintenanceRequest && (
                  <View className='mt-5'>
                    <MaintenanceRequestCard
                      issueName='Leaking Faucet'
                      reportedDate='Aug 15, 2024'
                      onUpdatePress={() => console.log('Update Maintenance Pressed')}
                    />
                  </View>
                )
              }

              {/* Rent Payment History */}
              <View className='mt-5'>
                <View className='flex-row items-center justify-between'>
                  <Text className='text-text text-xl font-poppinsSemiBold'>
                    Rent Payment History
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                  >
                    <Text className='text-primary text-base font-inter'>
                      See All
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* List of Payments */}
                <View className='mt-5 flex gap-2'>
                  {
                    paymentHistory.map((payment) => (
                      <PaymentHistoryCard
                        key={payment.id}
                        month={payment.month}
                        year={payment.year}
                        amount={payment.amount}
                        paidDate={payment.paidDate}
                        status={payment.status}
                      />
                    ))
                  }
                </View>
              </View>
            </>
          ) : (
            <View className='bg-white border border-grey-200 flex gap-5 items-center p-4 rounded-2xl mt-5'>
              <View className='flex items-center gap-1'>
                <Image
                  source={IMAGES.userError}
                  className='size-20'
                  resizeMode='contain'
                />
                <Text className='text-redHead-200 text-lg font-interMedium'>
                  This property is currently vacant.
                </Text>
              </View>

              <PillButton
                label='View Applications'
                size='sm'
                type='outline'
                isFullWidth
              />
            </View>
          )
        }

        <ImageViewing
          images={apartmentImages.map(image => ({ uri: image.url }))}
          imageIndex={imageIndex}
          visible={isImageViewVisible}
          onRequestClose={() => setIsImageViewVisible(false)}
          presentationStyle='overFullScreen'
          backgroundColor='rgb(0, 0, 0, 0.8)'
          FooterComponent={({ imageIndex }) => (
          <View className='p-10 items-center'>
            <Text className='text-white font-interMedium'>
              {imageIndex + 1} / {apartmentImages.length}
            </Text>
          </View>
        )}
        />
      </ScreenWrapper>

      {/* FAB */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full bg-primary
                   items-center justify-center shadow-lg active:opacity-80"
      >
        <IconDotsVertical size={26} color={COLORS.white} />
      </Pressable>

      {/* Bottom-left action menu */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop – tap outside to close */}
        <Pressable
          className="flex-1"
          onPress={() => setOpen(false)}
        >
          {/* Prevent touches on the menu itself from closing the modal */}
          <Pressable
            className="absolute bottom-8 right-6 bg-white rounded-2xl border border-grey-300 overflow-hidden min-w-[180px]"
            onPress={() => {}}
          >
            {/* Vacate Button */}
            <Pressable
              onPress={handleVacateUnit}
              className="px-5 py-4 active:bg-grey-100 border-b border-gray-100 last:border-0 flex-row items-center gap-3"
            >
              <IconLogout2
                size={20} 
                color={COLORS.text} 
              />

              <Text className="text-text text-base font-interMedium">
                Vacate
              </Text>
            </Pressable>

            {/* Remove/Delete Unit */}
            <Pressable
              onPress={handleRemoveUnit}
              className="px-5 py-4 active:bg-grey-100 border-b border-gray-100 last:border-0 flex-row items-center gap-3"
            >
              <IconCircleX
                size={20} 
                color={COLORS.redHead} 
              />

              <Text className="text-redHead-200 text-base font-interMedium">
                Remove Unit
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}