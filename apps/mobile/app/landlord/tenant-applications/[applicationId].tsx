import { useMemo, useState } from 'react';
import { useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { getLandlordApplicationStatusStyle } from "@/hooks/applications/useApplicationStatusStyles";
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';

import { Spinner } from 'heroui-native';
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconFiles,
  IconFileDescription,
  IconListDetails,
  IconMessage,
} from '@tabler/icons-react-native';

import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import DetailField from '@/components/display/DetailField';
import EmptyApplicationData from './components/EmptyApplicationData';
import DocumentRow from '@/components/display/DocumentRow';
import DetailSection from './components/DetailSection';
import TenantSummaryCard from './components/TenantSummaryCard';
import ApplicationDecisionBar from './components/ApplicationDecisionBar';
import TenantApplicationDetailsSkeleton from './components/TenantApplicationDetailsSkeleton';
import ErrorDialog from '@/components/display/ErrorDialog';
import RejectDialog from '../../../components/display/RejectDialog';

import { formatPesoDisplay, formatDate } from '@repo/utils';

import { useColors } from '@/hooks/useTheme';
import {
  useLandlordApplications,
  useDocumentUrls,
  useApplicationActions
} from '@/hooks/applications';
import { usePassportVerifiedPaths } from '@/hooks/passport';


const orDash = (value: string | null | undefined) =>
  value?.trim() ? value : '-';

export default function TenantApplicationDetails() {
  const { colors } = useColors();
  const palette = useStatusChipStyles();

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
    ...(application.gov_id_back_url
      ? [{ label: 'Government ID (Back)', path: application.gov_id_back_url }]
      : []),
    { label: 'Proof of Income',  path: application.proof_of_income_url },
    { label: 'Proof of Billing', path: application.proof_of_billing_url },
    { label: 'NBI Clearance',    path: application.nbi_clearance_url },
  ] : [];

  const { resolved: resolvedDocs, loading: docsLoading } = useDocumentUrls(docEntries);
  const { data: verifiedPaths } = usePassportVerifiedPaths(
    application?.tenant_id ?? null,
    docEntries.map((entry) => entry.path).filter((path): path is string => !!path)
  );
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
  } = useApplicationActions(resolvedId, application?.apartment_id);

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
  const statusStyle = getLandlordApplicationStatusStyle(displayStatus!, palette);
  const isPending = displayStatus === 'Applied';
  const isUnitOccupied = application.apartment_status === 'occupied';

  return (
    <>
      <ScreenWrapper
        header={<StandardHeader title="Application Details" />}
        scrollable
        className="p-5"
      >
        <View className="gap-4 pb-4">
          <View>
            <Text className="text-foreground text-sm font-nunitoSemiBold">
              Tenant Application For
            </Text>
            <Text className="text-accent font-nunitoSemiBold text-lg">
              {application.apartment_name}
            </Text>
            <Text className="text-muted font-inter text-sm">
              {application.apartment_address}
            </Text>
          </View>

          <TenantSummaryCard
            name={application.tenant_name}
            email={application.tenant_email}
            city={application.tenant_city}
            avatarUrl={application.tenant_avatar_url}
            status={displayStatus ?? ''}
            statusStyle={statusStyle}
          />

          {application.rejected_reason ? (
            <View className="bg-danger/10 border border-danger/20 rounded-3xl p-4">
              <DetailField
                label="Rejection Reason"
                value={application.rejected_reason}
              />
            </View>
          ) : null}

          <DetailSection title="Application" icon={IconFileDescription}>
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
            <View className="flex-row">
              <DetailField
                label="Monthly Rent"
                value={formatPesoDisplay(application.monthly_rent)}
              />
              <DetailField
                label="No. of Occupants"
                value={`${application.no_occupants}`}
              />
            </View>
          </DetailSection>

          <DetailSection title="Employment" icon={IconBriefcase}>
            <View className="flex-row">
              <DetailField label="Occupation" value={orDash(application.occupation)} />
              <DetailField label="Employer" value={orDash(application.employer_name)} />
            </View>
            <View className="flex-row">
              <DetailField label="Employment Type" value={application.employment_type} />
              <DetailField
                label="Monthly Income"
                value={formatPesoDisplay(application.monthly_income)}
              />
            </View>
          </DetailSection>

          <DetailSection title="Preferences" icon={IconListDetails}>
            <View className="flex-row">
              <DetailField label="Has Pets" value={application.has_pets ? 'Yes' : 'No'} />
              <DetailField label="Has Smoker" value={application.has_smoker ? 'Yes' : 'No'} />
            </View>
            <DetailField
              label="Needs Parking"
              value={application.need_parking ? 'Yes' : 'No'}
            />
          </DetailSection>

          <DetailSection title="Previous Landlord" icon={IconBuildingCommunity}>
            <View className="flex-row">
              <DetailField label="Name" value={orDash(application.prev_landlord_name)} />
              <DetailField label="Contact" value={orDash(application.prev_landlord_contact)} />
            </View>
          </DetailSection>

          <DetailSection title="Documents" icon={IconFiles}>
            {docsLoading ? (
              <Spinner size="sm" color={colors.primary} />
            ) : (
              <View className="gap-1">
                {resolvedDocs.map((doc) => (
                  <DocumentRow
                    key={doc.label}
                    label={doc.label}
                    path={doc.path}
                    signedUrl={doc.signedUrl}
                    onPressImage={setViewerUri}
                    verified={verifiedPaths?.has(doc.path) ?? false}
                  />
                ))}
              </View>
            )}
          </DetailSection>

          <DetailSection title="Message from Tenant" icon={IconMessage}>
            <Text className="text-muted text-base font-inter">
              {application.message || 'No message provided.'}
            </Text>
          </DetailSection>

          {isPending ? (
            <ApplicationDecisionBar
              isUnitOccupied={isUnitOccupied}
              isLoading={actionLoading}
              onReject={openRejectDialog}
              onApprove={approve}
            />
          ) : null}
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
