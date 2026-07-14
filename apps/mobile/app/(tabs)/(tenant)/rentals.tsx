import { View, Text, ActivityIndicator } from 'react-native'
import { useCallback } from 'react'
import { router, useRouter, useFocusEffect } from 'expo-router'
import type React from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import PaymentSummaryCard from '@/app/(tabs)/components/rentals/PaymentSummaryCard'
import LandlordCard from 'components/cards/LandlordCard';
import ApartmentDescriptionCard from "@/app/(tabs)/components/rentals/ApartmentDescriptionCard";
import QuickActionButton from '@/app/(tabs)/components/QuickActionButton';
import TenancyEmptyState from '../components/rentals/TenancyEmptyState';
import ApplicationsList from '../components/rentals/ApplicationList';
import MaintenanceRequestCard from '../components/rentals/MaintenanceRequestCard';

import {
  IconLink,
  IconUser,
  IconFileText,
  IconHammer,
  IconMapPin,
  IconBell,
  IconReceipt,
  IconSettings,
  IconHelpCircle,
  IconClipboardText,
} from "@tabler/icons-react-native";

import { useTenancy } from '@/hooks/tenancy';
import { useColors } from '@/hooks/useTheme';
import { useMaintenanceRequests } from '@/hooks/maintenance-requests';

import { Button, Separator } from 'heroui-native';

import { formatAddress, formatDate, formatFullName } from '@repo/utils';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar';

function mapPaymentStatus(status: string): 'Pending' | 'Paid' {
  return status === 'paid' ? 'Paid' : 'Pending';
}

type actionsTypes = {
  id: number;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress?: () => void;
}

const actions: actionsTypes[] = [
  {
    id: 1,
    label: "View Receipts",
    icon: IconReceipt,
    onPress: () => router.push("/tenant/payment/history"),
  },
  {
    id: 2,
    label: "View Applications",
    icon: IconClipboardText,
    onPress: () => router.push("/tenant/applications"),
  },
  {
    id: 3,
    label: "Settings",
    icon: IconSettings,
    onPress: () => router.push("/settings"),
  },
  {
    id: 4,
    label: "FAQ",
    icon: IconHelpCircle,
    onPress: () => router.push("/settings/faq"),
  },
];

export default function Rentals() {
  const router = useRouter();
  const { colors } = useColors();

  const { tenancy, loading: tenancyLoading } = useTenancy();
  const {
    latestRequest,
    isFinal,
    refetch: refetchMaintenanceRequest
  } = useMaintenanceRequests({
    apartmentId: tenancy?.apartment.id,
  });

  const loading = tenancyLoading;

  const handleRequestMaintenance = () => {
    router.push({
      pathname: '/tenant/request-maintenance',
      params: {
        apartmentId: tenancy?.apartment.id,
        apartmentName: tenancy?.apartment.name,
        apartmentAddress: formatAddress({
          street_address: tenancy?.apartment.street_address ?? '',
          province: tenancy?.apartment.province ?? '',
          barangay: tenancy?.apartment.barangay ?? '',
          city: tenancy?.apartment.city ?? '',
          zip_code: tenancy?.apartment.zip_code ?? '',
        }),
        landlordName: formatFullName({
          first_name: tenancy?.landlord?.first_name ?? '',
          last_name: tenancy?.landlord?.last_name ?? '',
        }),
      },
    });
  };
  const handleViewHistory = () =>
    router.push({
      pathname: '/tenant/maintenance-history',
      params: { apartmentId: tenancy?.apartment.id },
    });
  const handleViewMoreDetails = () => router.push('/tenant/current-apartment');
  const handlePayNow = () => router.push('/tenant/payment');
  const handleViewPaymentHistory = () => router.push('/tenant/payment/history');

  useFocusEffect(
    useCallback(() => {
      refetchMaintenanceRequest();
    }, [refetchMaintenanceRequest])
  );

  // Loading
  if (loading) {
    return (
      <ScreenWrapper className='p-5'>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Active tenancy
  if (tenancy) {
     const { apartment, landlord, currentPayment } = tenancy;
    const monthlyRent = tenancy.monthly_rent ?? apartment.monthly_rent ?? 0;

    const paymentPeriodDate = currentPayment?.period_start ?? new Date().toISOString();
    const paymentStatus = currentPayment ? mapPaymentStatus(currentPayment.status) : 'Pending';
    const balancePaid = currentPayment?.amount ?? 0;
    const balanceLeft = Math.max(0, monthlyRent - balancePaid);

    const landlordFullName = formatFullName(landlord!);
    const address = formatAddress(apartment);

    return (
      <ScreenWrapper scrollable className="p-5" bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}>
        {/* Apartment Header */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center justify-start gap-2">
            <IconMapPin size={30} color={colors.primary} />
            <Text className="text-secondary text-2xl font-nunitoSemiBold">
              {apartment.name}
            </Text>
          </View>
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => router.push("/tenant-notif")}
          >
            <IconBell size={26} color={colors.gray500} />
          </Button>
        </View>

        {/* Payment Summary Card */}
        <View className="mt-3">
          <PaymentSummaryCard
            periodMonth={formatDate(paymentPeriodDate, "month")}
            periodYear={formatDate(paymentPeriodDate, "year")}
            status={paymentStatus}
            totalRent={monthlyRent}
            balanceLeft={balanceLeft}
            balancePaid={balancePaid}
            onPayNowPress={handlePayNow}
            onViewHistoryPress={handleViewPaymentHistory}
          />
        </View>

        {/* Quick Actions */}
        <View className="flex mt-5">
          <View className="flex-row items-center justify-start gap-2">
            <IconLink size={24} color={colors.textPrimary} />
            <Text className="text-foreground text-lg font-interSemiBold">
              Quick Actions
            </Text>
          </View>
          <View className="mt-5 flex-row flex-wrap">
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
        <View className="mt-5 flex gap-3">
          <View className="flex-row items-center justify-start gap-2">
            <IconUser size={24} color={colors.textPrimary} />
            <Text className="text-foreground text-lg font-interSemiBold">
              Landlord Information
            </Text>
          </View>
          <LandlordCard
            fullName={landlordFullName}
            email={landlord?.email ?? "No email provided"}
            phoneNumber={landlord?.mobile_number ?? "No number provided"}
            profilePictureUrl={landlord?.avatar_url}
          />
        </View>

        {/* Apartment Description */}
        <View className="mt-5 flex gap-3">
          <View className="flex-row items-center justify-start gap-2">
            <IconFileText size={24} color={colors.textPrimary} />
            <Text className="text-foreground text-lg font-interSemiBold">
              Apartment Description
            </Text>
          </View>
          <ApartmentDescriptionCard
            apartmentName={apartment.name}
            apartmentAddress={address}
            leaseStartMonth={formatDate(tenancy.lease_start, "month")}
            leaseStartYear={formatDate(tenancy.lease_start, "year")}
            leaseEndMonth={
              tenancy.lease_end
                ? formatDate(tenancy.lease_end, "month")
                : "Ongoing"
            }
            leaseEndYear={
              tenancy.lease_end
                ? formatDate(tenancy.lease_end, "year")
                : ""
            }
            monthlyRent={monthlyRent}
            onPressViewMore={handleViewMoreDetails}
          />
        </View>

        {latestRequest ? (
          <>
            <Separator className="my-4" />
            <View className="flex gap-3">
              <View className="flex-row items-center justify-start gap-2">
                <IconHammer size={24} color={colors.textPrimary} />
                <Text className="text-foreground text-lg font-interSemiBold">
                  {isFinal ? "Latest Maintenance Request" : "Active Maintenance Request"}
                </Text>
              </View>

              <MaintenanceRequestCard
                request={latestRequest}
                onPress={() => {
                  router.push({
                    pathname: "/tenant/maintenance-details",
                    params: {
                      request: JSON.stringify(latestRequest),
                    },
                  });
                }}
              />

              <View className="flex-row gap-3 mt-1">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onPress={handleViewHistory}
                  size='sm'
                >
                  <Button.Label>View History</Button.Label>
                </Button>

                {isFinal && (
                  <Button
                    className="flex-1"
                    onPress={handleRequestMaintenance}
                    size='sm'
                  >
                    <IconHammer size={18} color={colors.secondaryForeground} />
                    <Button.Label>Request Again</Button.Label>
                  </Button>
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            <Separator className='my-4' />

            <Button onPress={handleRequestMaintenance}>
              <IconHammer size={20} color={colors.secondaryForeground} />
              <Button.Label>Request Maintenance Issue</Button.Label>
            </Button>
          </>
        )}
      </ScreenWrapper>
    );
  }

  // No tenancy, has applications
  if (!tenancy) {
    return (
      <ScreenWrapper className="p-5">
        <ApplicationsList />
      </ScreenWrapper>
    );
  }

  // Brand new user, nothing at all
  return (
    <ScreenWrapper className='p-5'>
      <TenancyEmptyState />
    </ScreenWrapper>
  );
}
