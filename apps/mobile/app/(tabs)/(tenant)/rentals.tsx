import { View, Text, ActivityIndicator } from 'react-native'
import { router, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import PaymentSummaryCard from '@/app/(tabs)/components/rentals/PaymentSummaryCard'
import LandlordCard from 'components/cards/LandlordCard';
import ApartmentDescriptionCard from "@/app/(tabs)/components/rentals/ApartmentDescriptionCard";
import Divider from 'components/display/Divider';
import QuickActionButton from '@/app/(tabs)/components/QuickActionButton';
import TenancyEmptyState from '../components/rentals/TenancyEmptyState';

import {
  Link,
  User,
  FileText,
  Hammer,
  MapPin,
  Bell,
  MessageCircleMore,
  ReceiptText,
  Banknote,
  House,
  Settings,
  CircleQuestionMark,
  LucideIcon
} from "lucide-react-native";

import { useTenancy } from '@/hooks/useTenancy';
import { useColors } from '@/hooks/useTheme';

import { Button } from 'heroui-native';

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

type actionsTypes = {
  id: number;
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
}

const actions: actionsTypes[] = [
  { 
    id: 1, 
    label: "Chat Landlord", 
    icon: MessageCircleMore 
},
  {
    id: 2,
    label: "View Lease",
    icon: FileText,
    onPress: () => router.push("/tenant/current-lease"),
  },
  { 
    id: 3, 
    label: "View Receipts", 
    icon: ReceiptText,  
    onPress: () => router.push("/tenant/payment/history"),
  },
  { 
    id: 4, 
    label: "Pay Rent", 
    icon: Banknote,
    onPress: () => router.push("/tenant/payment"),
  },
  { 
    id: 5, 
    label: "Request Maintenance", 
    icon: Hammer,
    onPress: () => router.push("/tenant/maintenance-issue"),
  },
  {
    id: 6,
    label: "Property Details",
    icon: House,
    onPress: () => router.push("/tenant/current-apartment"),
  },
  {
    id: 7,
    label: "Settings",
    icon: Settings,
    onPress: () => router.push("/settings"),
  },
  { 
    id: 8, 
    label: "FAQ", 
    icon: CircleQuestionMark,
    onPress: () => router.push("/settings/faq"),
  },
];

export default function Rentals() {
  const router = useRouter();

  const { colors } = useColors();

  // Read directly from the store
  const { tenancy, loading } = useTenancy();

  const handleRequestMaintenance = () => router.push('/tenant/maintenance-issue');
  const handleViewMoreDetails = () => router.push('/tenant/current-apartment');
  const handlePayNow = () => router.push('/tenant/payment');
  const handleViewPaymentHistory = () => router.push('/tenant/payment/history');

  // Loading State
  if (loading) {
    return (
      <ScreenWrapper className='p-5'>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Empty State
  if (!tenancy) {
    return (
      <ScreenWrapper className='p-5'>
        <TenancyEmptyState />
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
      <View className='flex-row items-center justify-between gap-2'>
        <View className='flex-row items-center justify-start gap-2'>
          <MapPin size={30} color={colors.primary} />

          <Text className='text-secondary text-2xl font-nunitoSemiBold'>
            {apartment.name}
          </Text>
        </View>

        <Button 
          isIconOnly
          variant='ghost' 
          onPress={() => router.push('/tenant-notif')}
        >
          <Bell size={26} color={colors.gray500} />
        </Button>
      </View>

      {/* Payment Summary Card */}
      <View className='mt-3'>
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
        <View className='flex-row items-center justify-start gap-2'>
          <Link size={24} color={colors.textPrimary} />
          <Text className='text-foreground text-lg font-interSemiBold'>
            Quick Actions
          </Text>
        </View>
        <View className='mt-5 flex-row flex-wrap'>
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              label={action.label}
              icon={action.icon}
              onPress={action.onPress}
            />
          ))}
        </View>
      </View>

      {/* Landlord Information */}
      <View className='mt-5 flex gap-3'>
        <View className='flex-row items-center justify-start gap-2'>
          <User size={24} color={colors.textPrimary} />
          <Text className='text-foreground text-lg font-interSemiBold'>
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
          <FileText size={24} color={colors.textPrimary} />
          <Text className='text-foreground text-lg font-interSemiBold'>
            Apartment Description
          </Text>
        </View>

        <ApartmentDescriptionCard
          apartmentName={apartment.name}
          apartmentAddress={formatAddress(apartment)}
          leaseStartMonth={formatMonth(tenancy.lease_start)}
          leaseStartYear={formatYear(tenancy.lease_start)}
          leaseEndMonth={tenancy.lease_end ? formatMonth(tenancy.lease_end) : 'Ongoing'}
          leaseEndYear={tenancy.lease_end ? formatYear(tenancy.lease_end) : ''}
          monthlyRent={monthlyRent}
          onPressViewMore={handleViewMoreDetails}
        />
      </View>

      <Divider />

      <Button onPress={handleRequestMaintenance}>
        <Hammer size={20} color={colors.secondaryForeground} />
        <Button.Label>
          Request Maintenance Issue
        </Button.Label>
      </Button>
    </ScreenWrapper>
  );
}
