import { View } from 'react-native'
import { useState } from 'react';

import ScreenWrapper from '../../components/layout/ScreenWrapper'
import StandardHeader from '../../components/layout/StandardHeader'
import NotificationCard from '../../components/display/NotificationCard';
import DropdownButton from '../../components/buttons/DropdownButton';

import { COLORS } from "../../constants/colors";

export default function TenantNotification() {

  type FilterType = 'All' | 'Payment' | 'Message' | 'Maintenance' | 'Apartment' | 'System';
  const [filterType, setFilterType] = useState<FilterType>('All');

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      header={
        <StandardHeader 
          title='Notification'
        />
      }
      headerBackgroundColor={COLORS.primary}
    >
      {/* Filter Type Button */}
      <DropdownButton 
        value={filterType}
        bottomSheetLabel={'Filter Notifications'} 
        options={[
          'All',
          'Payment',
          'Message',
          'Maintenance',
          'Apartment',
          'System'
        ]} 
        onSelect={(value) => setFilterType(value)}      
      />

      {/* // TODO: Change to Mapping when DB is implemented */}
      <View className='flex gap-3 mt-4'>
        <NotificationCard 
          title={'Payment Received'} 
          type={'payment'} 
          message='Your rent for October was successfully processed.'
          date='1/1/2026'
        />

        <NotificationCard 
          title={'Message from Rental Owner'} 
          type={'message'} 
          message='“Hi, just confirming your maintenance schedule.”'
          date='1/1/2026'
        />

        <NotificationCard 
          title={'Maintenance Update'} 
          type={'maintenance'} 
          message='Your rent for October was successfully processed.'
          date='1/1/2026'
        />

        <NotificationCard 
          title={'Apartment Process'} 
          type={'apartment'} 
          date='1/1/2026'
        />

        <NotificationCard 
          title={'System Update'} 
          type={'system'} 
          date='1/1/2026'
        />
      </View>
    </ScreenWrapper>
  )
}