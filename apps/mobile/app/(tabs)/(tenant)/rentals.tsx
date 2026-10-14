import { View, Text, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import PaymentSummaryCard from '@/app/(tabs)/components/rentals/PaymentSummaryCard'
import NotificationBellButton from '@/app/(tabs)/components/NotificationBellButton'
import LandlordCard from 'components/cards/LandlordCard';
import QuickActionButton from '@/app/(tabs)/components/QuickActionButton';
import ApplicationsList from '../components/rentals/ApplicationList';
import RentalsSkeleton from '../components/rentals/RentalsSkeleton';
import MaintenanceSection from '../components/rentals/MaintenanceSection';
import RentalHero, { useRentalHeroHeight } from '../components/rentals/RentalHero';
import PendingApplicationsCard from '../components/rentals/PendingApplicationsCard';
import {
  getRentalsLayoutToRemember,
  getRentalsSkeleton,
  getRentalsView,
} from '../components/rentals/rentalsView';
import EmptyState from 'components/display/EmptyState';

import {
  IconAlertCircle,
  IconLink,
  IconUser,
  IconReceipt,
  IconSettings,
  IconHelpCircle,
  IconClipboardText,
} from "@tabler/icons-react-native";

import { useRentalsLayoutHint, useTenancy } from '@/hooks/tenancy';
import { useProfile } from '@/hooks/auth';
import { useColors } from '@/hooks/useTheme';
import { useLightStatusBar } from '@/hooks/useLightStatusBar';
import { useMaintenanceRequestHistory, type MaintenanceRequest } from '@/hooks/maintenance-requests';
import { useTenantApplications } from '@/hooks/applications';
import { usePayments } from '@/hooks/payments';
import { getCurrentRentStatus } from '@/service/payments/paymentService';
import { buildConversationKey } from '@/service/chat/chatService';

import { Button } from 'heroui-native';

import { formatAddress, formatDate, formatFullName } from '@repo/utils';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar';

interface QuickAction {
  label: string;
  icon: ComponentProps<typeof QuickActionButton>['icon'];
  href: Href;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "View Receipts", icon: IconReceipt, href: "/tenant/payment/history" },
  { label: "View Applications", icon: IconClipboardText, href: "/tenant/applications" },
  { label: "Settings", icon: IconSettings, href: "/settings" },
  { label: "FAQ", icon: IconHelpCircle, href: "/settings/faq" },
];

interface TabScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => Promise<void>;
  // Content starts at the very top (under the status bar), for the photo hero.
  edgeToEdge?: boolean;
  // Edge to edge only: paint the page background behind the status bar so
  // scrolled content doesn't run under the clock.
  showStatusBarBackdrop?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// The scrollable tab-page shell every Rentals state shares, clearing the
// floating tab bar.
function TabScreen({
  children,
  refreshing,
  onRefresh,
  edgeToEdge = false,
  showStatusBarBackdrop = false,
  onScroll,
}: TabScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <ScreenWrapper
      scrollable
      className={edgeToEdge ? "px-5 pb-5" : "p-5"}
      noTopPadding={edgeToEdge}
      bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onScroll={onScroll}
    >
      {children}
    </ScreenWrapper>
      {edgeToEdge && showStatusBarBackdrop && (
        <View
          pointerEvents="none"
          className="absolute top-0 left-0 right-0 bg-background"
          style={{ height: insets.top }}
        />
      )}
    </View>
  );
}

export default function Rentals() {
  const router = useRouter();
  const { colors } = useColors();

  const {
    tenancy,
    loading: tenancyLoading,
    error: tenancyError,
    refetch: refetchTenancy,
  } = useTenancy();
  const { profile } = useProfile();
  const {
    requests: maintenanceRequests,
    loading: maintenanceLoading,
    refetch: refetchMaintenance,
  } = useMaintenanceRequestHistory({
    apartmentId: tenancy?.apartment.id,
  });
  const {
    applications,
    loading: applicationsLoading,
    error: applicationsError,
    refetch: refetchApplications,
  } = useTenantApplications();
  const paymentsQuery = usePayments(tenancy?.id ?? null);

  const view = getRentalsView({
    hasTenancy: tenancy !== null,
    tenancyLoading,
    tenancyError,
    applicationsLoading,
    applicationsError,
    tenancyDetailsLoading: maintenanceLoading || paymentsQuery.isLoading,
  });

  // Picks the skeleton before the server answers, then remembers the answer
  // for next launch. The hint never decides what data is shown.
  const { hint, isReady: isHintReady, remember: rememberLayout } = useRentalsLayoutHint();
  const skeleton = getRentalsSkeleton(hint, isHintReady);
  const layoutToRemember = getRentalsLayoutToRemember(view);
  useEffect(() => {
    if (layoutToRemember) rememberLayout(layoutToRemember);
  }, [layoutToRemember, rememberLayout]);

  // Pull-to-refresh only: background refetches (realtime, focus) stay silent,
  // and the spinner waits for every section, not just the tenancy.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTenancy(), refetchMaintenance(), refetchApplications(), paymentsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };
  // A failed query keeps its error status while refetching, so track the
  // retry locally to give the button feedback.
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await Promise.all([refetchTenancy(), refetchApplications()]);
    } finally {
      setRetrying(false);
    }
  };

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
  const handleOpenMaintenanceRequest = (request: MaintenanceRequest) =>
    router.push({
      pathname: '/tenant/maintenance-details',
      params: { requestId: request.id, apartmentId: request.apartment_id },
    });
  const handleViewDescription = () => router.push('/tenant/current-apartment');
  const handlePayNow = () => router.push('/tenant/payment');
  const handleViewPaymentHistory = () => router.push('/tenant/payment/history');
  const handleViewApplications = () => router.push('/tenant/applications');

  // White status-bar icons only while the photo is behind them: not once it
  // has scrolled away, and not while a pull-to-refresh drags it below the
  // status bar (the light page shows above it then).
  const insets = useSafeAreaInsets();
  const heroHeight = useRentalHeroHeight();
  const [isPastHero, setIsPastHero] = useState(false);
  const [isHeroPulledDown, setIsHeroPulledDown] = useState(false);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const isPast = offsetY > heroHeight - insets.top;
    const isPulledDown = offsetY < -insets.top / 2;
    if (isPast !== isPastHero) setIsPastHero(isPast);
    if (isPulledDown !== isHeroPulledDown) setIsHeroPulledDown(isPulledDown);
  };
  useLightStatusBar(view === 'tenancy' && !isPastHero && !isHeroPulledDown);

  // Loading a rental (the applications skeleton is drawn by the shell below)
  if (view === 'loading' && skeleton !== 'applications') {
    return (
      <TabScreen edgeToEdge={skeleton === 'tenancy'}>
        {skeleton === 'tenancy' && <RentalsSkeleton />}
      </TabScreen>
    );
  }

  // Active tenancy
  if (view === 'tenancy' && tenancy) {
    const { apartment, landlord } = tenancy;
    const rent = getCurrentRentStatus(tenancy, paymentsQuery.data ?? []);
    const pendingApplicationCount = applications.filter(
      (application) => application.status === 'pending',
    ).length;

    // The landlord join can come back null (e.g. a profile RLS hides), so the
    // landlord section is skipped rather than crashing the whole tab.
    const landlordFullName = landlord ? formatFullName(landlord) : '';

    const handleMessageLandlord = () => {
      if (!landlord || !profile || !apartment?.id) return;

      // The chat screen finds the thread from the two users and the apartment;
      // the route id is the same conversation key the chat list uses.
      router.push({
        pathname: '/chat/[conversationId]',
        params: {
          conversationId: buildConversationKey(profile.id, landlord.id, apartment.id),
          otherUserId: landlord.id,
          otherUserName: landlordFullName,
          otherUserAvatar: landlord.avatar_url ?? '',
          otherUserPhoneNumber: landlord.mobile_number ?? '',
          apartmentId: apartment.id,
          apartmentTitle: apartment.name,
        },
      });
    };

    const handleViewLandlordProfile = () => {
      if (!landlord?.id) return;
      router.push(`/profile/landlord/${landlord.id}`);
    };

    return (
      <TabScreen
        refreshing={refreshing}
        onRefresh={onRefresh}
        edgeToEdge
        showStatusBarBackdrop={isPastHero}
        onScroll={handleScroll}
      >
        {/* Apartment photo, name and address */}
        <RentalHero
          name={apartment.name}
          address={formatAddress(apartment)}
          imageUrl={apartment.cover_url}
          onViewDescription={handleViewDescription}
          topRight={<NotificationBellButton route="/tenant-notif" tone="onImage" />}
        />

        {/* Payment Summary Card */}
        <View className="mt-5">
          <PaymentSummaryCard
            periodMonth={formatDate(rent.periodStart, "month")}
            periodYear={formatDate(rent.periodStart, "year")}
            status={rent.status}
            totalRent={rent.monthlyRent}
            dueDate={formatDate(rent.dueDate, "short")}
            onPayNowPress={handlePayNow}
            onViewHistoryPress={handleViewPaymentHistory}
          />
        </View>

        {/* Applications waiting on a landlord */}
        {pendingApplicationCount > 0 && (
          <View className="mt-3">
            <PendingApplicationsCard
              count={pendingApplicationCount}
              onPress={handleViewApplications}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View className="flex mt-5">
          <View className="flex-row items-center justify-start gap-2">
            <IconLink size={24} color={colors.textPrimary} />
            <Text className="text-foreground text-lg font-nunitoSemiBold">
              Quick Actions
            </Text>
          </View>
          <View className="mt-5 flex-row flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton
                key={action.label}
                label={action.label}
                icon={action.icon}
                onPress={() => router.push(action.href)}
              />
            ))}
          </View>
        </View>

        {/* Landlord Information */}
        {landlord && (
          <View className="mt-5 flex gap-3">
            <View className="flex-row items-center justify-start gap-2">
              <IconUser size={24} color={colors.textPrimary} />
              <Text className="text-foreground text-lg font-nunitoSemiBold">
                Landlord Information
              </Text>
            </View>
            <LandlordCard
              fullName={landlordFullName}
              email={landlord.email ?? "No email provided"}
              phoneNumber={landlord.mobile_number ?? "No number provided"}
              profilePictureUrl={landlord.avatar_url}
              onPress={handleViewLandlordProfile}
              onMessagePress={handleMessageLandlord}
            />
          </View>
        )}

        {/* Maintenance */}
        <View className="mt-5">
          <MaintenanceSection
            requests={maintenanceRequests}
            onOpenRequest={handleOpenMaintenanceRequest}
            onViewAll={handleViewHistory}
            onRequestMaintenance={handleRequestMaintenance}
          />
        </View>
      </TabScreen>
    );
  }

  // No tenancy: the applications list (it has its own empty state), its
  // skeleton while loading, or an error when we couldn't tell whether the
  // tenant has a rental at all.
  return (
    <TabScreen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="flex-row items-center justify-between mb-5">
        {/* The error state can't say which page this is, so it keeps the tab name. */}
        <Text className="text-accent text-2xl font-nunitoBold">
          {view === 'error' ? 'Rentals' : 'Applications'}
        </Text>
        <NotificationBellButton route="/tenant-notif" />
      </View>

      {view === 'error' ? (
        <EmptyState
          variant="tenant"
          icon={<IconAlertCircle size={64} color={colors.primary} />}
          title="Couldn't load your rentals"
          description="Check your connection and try again."
          action={
            <Button onPress={handleRetry} isDisabled={retrying}>
              <Button.Label>{retrying ? 'Trying again…' : 'Try Again'}</Button.Label>
            </Button>
          }
        />
      ) : (
        <ApplicationsList isLoading={view === 'loading'} />
      )}
    </TabScreen>
  );
}
