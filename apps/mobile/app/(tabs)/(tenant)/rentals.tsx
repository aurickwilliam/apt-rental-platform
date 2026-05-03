import { View, Text, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import PaymentSummaryCard from 'components/cards/PaymentSummaryCard'
import LandlordCard from 'components/cards/LandlordCard';
import ApartmentDescriptionCard from "components/cards/ApartmentDescriptionCard";
import PillButton from 'components/buttons/PillButton';
import Divider from 'components/display/Divider';

import {
  IconMapPinFilled,
  IconUser,
  IconFileDescription,
  IconTool,
  IconHelp,
  IconSettings,
  IconHome2,
  IconCash,
  IconReceipt,
  IconFileText,
  IconBubbleText,
  IconProps,
  IconHomeOff,
} from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';
import QuickActionButton from '@/components/buttons/QuickActionButton';
import { useTenancy } from '@/hooks/useTenancy';

type actionsTypes = {
  id: number;
  label: string;
  icon: React.ComponentType<IconProps>;
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleString('default', { month: 'long' });
}

function formatYear(dateStr: string): string {
  return new Date(dateStr).getFullYear().toString();
}

function formatAddress(apartment: {
  street_address: string;
  barangay: string;
  city: string;
  province: string;
}): string {
  return [apartment.street_address, apartment.barangay, apartment.city, apartment.province]
    .filter(Boolean)
    .join(', ');
}

function mapPaymentStatus(status: string): 'Pending' | 'Paid' {
  return status === 'paid' ? 'Paid' : 'Pending';
}


// Empty State when no active tenancy found
function NoTenancyState() {
  return (
    <View className='flex-1 items-center justify-center gap-4 py-20'>
      <IconHomeOff size={64} color={COLORS.grey} />
      <View className='items-center gap-1'>
        <Text className='text-text text-xl font-poppinsSemiBold text-center'>
          No Active Tenancy
        </Text>
        <Text className='text-grey-500 text-base font-inter text-center px-8'>
          You&apos;re not currently renting any apartment. Browse listings to find your next home.
        </Text>
      </View>
    </View>
  );
}

export default function Rentals() {
  const router = useRouter();

  // Read directly from the store
  const { tenancy, loading } = useTenancy();

  const actions: actionsTypes[] = [
    { id: 1, label: 'Chat Landlord', icon: IconBubbleText },
    { id: 2, label: 'View Lease', icon: IconFileText },
    { id: 3, label: 'View Receipts', icon: IconReceipt },
    { id: 4, label: 'Pay Rent', icon: IconCash },
    { id: 5, label: 'Request Maintenance', icon: IconTool },
    { id: 6, label: 'Property Details', icon: IconHome2 },
    { id: 7, label: 'Settings', icon: IconSettings },
    { id: 8, label: 'FAQ', icon: IconHelp },
  ];

  const handleRequestMaintenance = () => router.push('/tenant/maintenance-issue');
  const handleViewMoreDetails = () => router.push('/tenant/current-apartment');
  const handlePayNow = () => router.push('/tenant/payment');
  const handleViewPaymentHistory = () => router.push('/tenant/payment/history');

  // Loading State
  if (loading) {
    return (
      <ScreenWrapper className='p-5'>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Empty State
  if (!tenancy) {
    return (
      <ScreenWrapper className='p-5'>
        <NoTenancyState />
      </ScreenWrapper>
    );
  }

  // Derived data for rendering
  const { apartment, landlord, currentPayment } = tenancy;
  const monthlyRent = tenancy.monthly_rent ?? apartment.monthly_rent ?? 0;

  const paymentPeriodDate = currentPayment?.period_start ?? new Date().toISOString();
  const paymentStatus = currentPayment ? mapPaymentStatus(currentPayment.status) : 'Pending';
  const balancePaid = currentPayment?.amount ?? 0;
  const balanceLeft = Math.max(0, monthlyRent - balancePaid);

  const landlordFullName = landlord
    ? `${landlord.first_name ?? ''} ${landlord.last_name ?? ''}`.trim()
    : 'Unknown Landlord';

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      bottomPadding={50}
    >
      {/* Apartment Header */}
      <View className='flex-row items-center justify-start gap-2'>
        <IconMapPinFilled size={34} color={COLORS.primary} className='mr-2' />
        <Text className='text-secondary text-3xl font-dmserif leading-[34px]'>
          {apartment.name}
        </Text>
      </View>

      {/* Payment Summary Card */}
      <View className='mt-5'>
        <PaymentSummaryCard
          periodMonth={formatMonth(paymentPeriodDate)}
          periodYear={formatYear(paymentPeriodDate)}
          status={paymentStatus}
          totalRent={monthlyRent}
          balanceLeft={balanceLeft}
          balancePaid={balancePaid}
          onPayNowPress={handlePayNow}
          onViewHistoryPress={handleViewPaymentHistory}
        />
      </View>

      {/* Quick Actions */}
      <View className='flex mt-5'>
        <Text className='text-text text-xl font-poppinsSemiBold'>
          Quick Actions
        </Text>
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

      {/* Landlord Information */}
      <View className='mt-5 flex gap-3'>
        <View className='flex-row items-center justify-start gap-2'>
          <IconUser size={26} color={COLORS.text} />
          <Text className='text-text text-xl font-poppinsMedium'>
            Landlord Information
          </Text>
        </View>
        <LandlordCard
          fullName={landlordFullName}
          email={landlord?.email ?? 'No email provided'}
          phoneNumber={landlord?.mobile_number ?? 'No number provided'}
          profilePictureUrl={landlord?.avatar_url}
        />
      </View>

      {/* Apartment Description */}
      <View className='mt-5 flex gap-3'>
        <View className='flex-row items-center justify-start gap-2'>
          <IconFileDescription size={26} color={COLORS.text} />
          <Text className='text-text text-xl font-poppinsMedium'>
            Apartment Description
          </Text>
        </View>
        <ApartmentDescriptionCard
          apartmentName={apartment.name}
          apartmentAddress={formatAddress(apartment)}
          leaseStartMonth={formatMonth(tenancy.move_in_date)}
          leaseStartYear={formatYear(tenancy.move_in_date)}
          leaseEndMonth={tenancy.move_out_date ? formatMonth(tenancy.move_out_date) : 'Ongoing'}
          leaseEndYear={tenancy.move_out_date ? formatYear(tenancy.move_out_date) : ''}
          monthlyRent={monthlyRent}
          onPressViewMore={handleViewMoreDetails}
        />
      </View>

      <Divider />

      <PillButton
        label={'Request Maintenance Issue'}
        isFullWidth
        leftIconName={IconTool}
        onPress={handleRequestMaintenance}
      />
    </ScreenWrapper>
  );
}