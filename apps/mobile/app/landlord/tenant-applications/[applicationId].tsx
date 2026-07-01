import { useMemo, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';

import { Avatar, Button, Card, Chip, Separator } from 'heroui-native';
import { Mail, MapPin } from 'lucide-react-native';

import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import DetailField from '@/components/display/DetailField';
import EmptyApplicationData from './components/EmptyApplicationData';
import DocumentRow from '@/components/display/DocumentRow';
import TenantApplicationDetailsSkeleton from './components/TenantApplicationDetailsSkeleton';

import { formatCurrency, formatDate, getInitials } from '@repo/utils';

import { useColors } from '@/hooks/useTheme';
import { useLandlordApplications, type DisplayStatus } from '@/hooks/useLandlordApplications';
import { useDocumentUrls } from '@/hooks/useDocumentUrls';
import { useApplicationActions } from '@/hooks/useApplicationActions';
import ErrorDialog from '@/components/display/ErrorDialog';
import RejectDialog from '../../../components/display/RejectDialog';

function getStatusStyle(
  status: DisplayStatus,
  colors: ReturnType<typeof useColors>['colors'],
): { backgroundColor: string; textColor: string } {
  switch (status) {
    case 'Applied':
      return { backgroundColor: colors.warningLight, textColor: colors.warning };
    case 'Approved':
      return { backgroundColor: colors.successLight, textColor: colors.success };
    case 'Rejected':
      return { backgroundColor: colors.dangerLight, textColor: colors.danger };
    case 'Cancelled':
      return { backgroundColor: colors.gray100, textColor: colors.gray500 };
  }
}

export default function TenantApplicationDetails() {
  const { colors } = useColors();

  const { applicationId } = useLocalSearchParams<{ applicationId?: string | string[] }>();
  const resolvedId = useMemo(
    () => (Array.isArray(applicationId) ? applicationId[0] : applicationId),
    [applicationId]
  );

  const { applications, loading } = useLandlordApplications();

  const application = useMemo(() => {
    if (!resolvedId) return undefined;
    return applications.find((a) => a.id === resolvedId);
  }, [resolvedId, applications]);

  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const docEntries = application ? [
    { label: 'Government ID',    path: application.gov_id_url },
    { label: 'Proof of Income',  path: application.proof_of_income_url },
    { label: 'Proof of Billing', path: application.proof_of_billing_url },
    { label: 'NBI Clearance',    path: application.nbi_clearance_url },
  ] : [];

  const { resolved: resolvedDocs, loading: docsLoading } = useDocumentUrls(docEntries);
  const {
    localStatus,
    actionLoading,
    isRejectDialogOpen,
    errorMessage,
    approve,
    reject,
    openRejectDialog,
    closeRejectDialog,
    clearError
  } = useApplicationActions(resolvedId);

  // Loading State
  if (loading) {
    return <TenantApplicationDetailsSkeleton />;
  }

  // Empty State
  if (!application) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Application Details" />}
        backgroundColor={colors.surface}
        scrollable
        className="p-5"
      >
        <EmptyApplicationData />
      </ScreenWrapper>
    );
  }

  const displayStatus = localStatus ?? application?.status;
  const statusStyle = getStatusStyle(displayStatus!, colors);
  const isPending = displayStatus === 'Applied';

  return (
    <>
      <ScreenWrapper
        header={<StandardHeader title="Application Details" />}
        scrollable
        className="p-5"
        noBottomPadding
      >
        <View className="gap-4">
          <View>
            <Text className="text-foreground text-sm font-interMedium">
              Tenant Application For
            </Text>
            <Text className='text-secondary font-interSemiBold text-lg'>
              {application.apartment_name}
            </Text>
            <Text className="text-muted font-inter text-sm">
              {application.apartment_address}
            </Text>
          </View>

          {/* Tenant + Property summary card */}
          <Card className="shadow-none border border-border">
            <Card.Body className="flex-row items-center gap-3">
              <Avatar size="lg" className="border border-border">
                <Avatar.Image source={{ uri: application.tenant_avatar_url ?? '' }} />
                <Avatar.Fallback delayMs={200}>
                  {getInitials(application.tenant_name)}
                </Avatar.Fallback>
              </Avatar>

              <View className="flex-1 min-w-0">
                <Text
                  className="text-foreground text-base font-interSemiBold"
                  numberOfLines={1}
                >
                  {application.tenant_name}
                </Text>

                <View className="flex-row items-center gap-1 mt-0.5">
                  <Mail size={13} color={colors.gray500} />
                  <Text
                    className="text-gray-500 text-xs font-inter"
                    numberOfLines={1}
                  >
                    {application.tenant_email}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1 mt-0.5">
                  <MapPin size={13} color={colors.gray500} />
                  <Text className="text-gray-500 text-xs font-inter">
                    {application.tenant_city}
                  </Text>
                </View>
              </View>

              <Chip
                size="sm"
                variant="soft"
                style={{ backgroundColor: statusStyle.backgroundColor }}
              >
                <Chip.Label
                  className="font-interMedium"
                  style={{ color: statusStyle.textColor }}
                >
                  {displayStatus}
                </Chip.Label>
              </Chip>
            </Card.Body>
          </Card>

          {application.rejected_reason ? (
            <DetailField
              label="Rejection Reason"
              value={application.rejected_reason}
            />
          ) : null}

          {/* Application details */}
          <View className="gap-3">
            <Text className="text-foreground text-lg font-interSemiBold">
              Application Details
            </Text>

            <View className="flex-row">
              <DetailField
                label="Date Submitted"
                value={formatDate(application.created_at, 'medium')}
              />
              <DetailField
                label="Move-in Date"
                value={formatDate(application.move_in_date, 'medium')}
              />
            </View>

            <View className='flex-row'>
              <DetailField
                label="Monthly Rent"
                value={`${formatCurrency(application.monthly_rent)}`}
              />
              <DetailField
                label="No. of Occupants"
                value={`${application.no_occupants}`}
              />
            </View>
          </View>

          <Separator className='my-3' />

          {/* Employment */}
          <View className="gap-3">
            <Text className="text-foreground text-lg font-interSemiBold">
              Employment
            </Text>

            <View className='flex-row'>
              <DetailField label="Occupation" value={application.occupation} />
              <DetailField label="Employer" value={application.employer_name} />
            </View>

            <View className='flex-row'>
              <DetailField label="Employment Type" value={application.employment_type} />
              <DetailField
                label="Monthly Income"
                value={`${formatCurrency(application.monthly_income)}`}
              />
            </View>
          </View>

          <Separator className='my-3' />

          {/* Preferences */}
          <View className='gap-3'>
            <Text className="text-foreground text-lg font-interSemiBold">
              Preferences
            </Text>

            <View className='flex-row'>
              <DetailField label="Has Pets" value={application.has_pets ? 'Yes' : 'No'} />
              <DetailField label="Has Smoker" value={application.has_smoker ? 'Yes' : 'No'} />
            </View>
            <DetailField
              label="Needs Parking"
              value={application.need_parking ? 'Yes' : 'No'}
            />
          </View>

          <Separator className='my-3' />

          {/* Previous Landlord */}
          <View className="gap-3">
            <Text className="text-foreground text-lg font-interSemiBold">
              Previous Landlord
            </Text>

            <View className='flex-row'>
              <DetailField
                label="Name"
                value={application.prev_landlord_name || 'Not provided'}
              />
              <DetailField
                label="Contact"
                value={application.prev_landlord_contact || 'Not provided'}
              />
            </View>
          </View>

          <Separator className='my-3' />

          {/* Documents */}
          <View className="gap-3">
            <Text className="text-foreground text-lg font-interSemiBold">
              Documents
            </Text>

            {docsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              resolvedDocs.map((doc) => (
                <DocumentRow
                  key={doc.path}
                  label={doc.label}
                  path={doc.path}
                  signedUrl={doc.signedUrl}
                  onPressImage={setViewerUri}
                />
              ))
            )}
          </View>

          <Separator className='my-3' />

          {/* Message */}
          <View>
            <Text className="text-foreground text-lg font-interSemiBold">
              Message from Tenant
            </Text>
            <Text className="text-muted text-base font-inter">
              {application.message || 'No message provided.'}
            </Text>
          </View>

          {isPending && (
            <View className="flex-row gap-3 mt-2">
              <Button
                variant="danger-soft"
                className="flex-1"
                isDisabled={actionLoading}
                onPress={openRejectDialog}
              >
                <Button.Label className="font-interSemiBold">Reject</Button.Label>
              </Button>
              <Button
                className="flex-1"
                isDisabled={actionLoading}
                onPress={approve}
              >
                <Button.Label className="font-interSemiBold">Approve</Button.Label>
              </Button>
            </View>
          )}
        </View>
      </ScreenWrapper>

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={closeRejectDialog}
        onConfirm={reject}
        isLoading={actionLoading}
      />

      <ErrorDialog
        isOpen={!!errorMessage}
        onClose={clearError}
        message={errorMessage}
      />

      <ImageViewing
        images={viewerUri ? [{ uri: viewerUri }] : []}
        imageIndex={0}
        visible={!!viewerUri}
        onRequestClose={() => setViewerUri(null)}
        presentationStyle="overFullScreen"
        backgroundColor="rgba(0,0,0,0.9)"
      />
    </>
  );
}
