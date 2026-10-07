import { createElement, useState } from "react";
import { Linking, Text, View } from "react-native";
import ImageViewing from "react-native-image-viewing";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button, Chip, Spinner } from "heroui-native";

import {
  IconHourglass,
  IconId,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react-native";

import { formatDate } from "@repo/utils";
import { isReviewEligibleDocType } from "@repo/constants";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import ConfirmDialog from "@/components/display/ConfirmDialog";
import ErrorDialog from "@/components/display/ErrorDialog";

import { useColors } from "@/hooks/useTheme";
import { useStatusChipStyles, statusChipSurface } from "@/hooks/useStatusChipStyles";
import { useDocumentUrls } from "@/hooks/applications";
import {
  useDeletePassportDocument,
  usePassportDocuments,
  useRequestPassportDocumentReview,
} from "@/hooks/passport";

import DocumentPreview from "./components/DocumentPreview";
import { isImageUri } from "./utils/fileType";
import { getDocumentTypeIcon } from "./utils/documentTypeIcons";
import { getDocumentTypeDescription } from "./utils/documentTypeDescriptions";
import { isExpiredDate } from "@/service/passport/expiry";

function DetailRow({
  label,
  value,
  isDanger = false,
}: {
  label: string;
  value: string;
  isDanger?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-muted text-sm font-inter">{label}</Text>
      <Text
        className={`text-base font-nunitoSemiBold ${isDanger ? "text-danger" : "text-foreground"}`}
      >
        {value}
      </Text>
    </View>
  );
}

export default function PassportDocumentDetail() {
  const { documentId } = useLocalSearchParams<{
    documentId?: string | string[];
  }>();
  const resolvedId = Array.isArray(documentId) ? documentId[0] : documentId;
  const router = useRouter();
  const { colors } = useColors();
  const { success, warning } = useStatusChipStyles();

  const { documents, loading } = usePassportDocuments();
  const document = documents.find((doc) => doc.id === resolvedId) ?? null;

  const { resolved, loading: urlLoading } = useDocumentUrls(
    document
      ? [
          { label: document.doc_type, path: document.storage_path },
          ...(document.storage_path_back
            ? [
                {
                  label: `${document.doc_type} (back)`,
                  path: document.storage_path_back,
                },
              ]
            : []),
        ]
      : [],
    document?.verification_id ? "user-verification" : "application-documents",
  );
  const signedUrl = resolved[0]?.signedUrl ?? null;
  const backSignedUrl = resolved[1]?.signedUrl ?? null;

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { mutate: remove, isPending: isDeleting } = useDeletePassportDocument();
  const {
    mutate: requestReview,
    isPending: isRequesting,
    error: requestError,
    reset: resetRequestError,
  } = useRequestPassportDocumentReview();

  const isLinkedVerification =
    !!document?.verification_id || !!document?.is_primary;
  const reviewStatus = document?.review_status ?? "unverified";
  const canRequestReview =
    !!document &&
    !isLinkedVerification &&
    isReviewEligibleDocType(document.doc_type) &&
    (reviewStatus === "unverified" || reviewStatus === "rejected");
  const isUnderReview = reviewStatus === "pending";
  const viewerImages = [signedUrl, backSignedUrl].flatMap((uri) =>
    uri && isImageUri(uri) ? [{ uri }] : [],
  );

  const openFile = (uri: string | null, imageIndex: number) => {
    if (!uri) return;
    if (isImageUri(uri)) {
      setViewerIndex(imageIndex);
      setViewerVisible(true);
    } else {
      void Linking.openURL(uri);
    }
  };

  const handleOpenFront = () => openFile(signedUrl, 0);
  const handleOpenBack = () =>
    openFile(backSignedUrl, signedUrl && isImageUri(signedUrl) ? 1 : 0);

  const handleRequestReview = () => {
    if (!document) return;
    resetRequestError();
    requestReview({ id: document.id });
  };

  const handleDelete = () => {
    if (!document) return;
    remove(
      { id: document.id, storagePath: document.storage_path },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          router.replace("/document-id");
        },
        onError: (err) => setDeleteError(err.message),
      },
    );
  };

  if (loading) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Document" />}
        className="p-5 items-center justify-center"
      >
        <Spinner size="lg" color={colors.primary} />
      </ScreenWrapper>
    );
  }

  if (!document) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Document" />}
        className="p-5"
      >
        <View className="flex-1 items-center gap-3 pt-16 px-4">
          <Text className="text-foreground text-xl font-nunitoBold text-center">
            Document not found
          </Text>
          <Text className="text-gray-400 text-base font-inter text-center">
            This document may have been deleted.
          </Text>
          <Button size="lg" onPress={() => router.replace("/document-id")}>
            <Button.Label className="text-white font-nunitoSemiBold">
              Back to Documents
            </Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title={document.doc_type} />}
      className="p-5"
      footer={
        !isLinkedVerification && !isUnderReview ? (
          <View className="gap-3 px-5">
            {requestError ? (
              <Text className="text-danger text-sm font-inter">
                {requestError.message}
              </Text>
            ) : null}
            {canRequestReview ? (
              <Button onPress={handleRequestReview} isDisabled={isRequesting}>
                <IconShieldCheck size={18} color="#fff" />
                <Button.Label className="font-nunitoSemiBold">
                  {isRequesting
                    ? "Requesting…"
                    : reviewStatus === "rejected"
                      ? "Request Review Again"
                      : "Request Verification"}
                </Button.Label>
              </Button>
            ) : null}
            <Button
              variant="danger-soft"
              onPress={() => {
                setDeleteError(null);
                setConfirmOpen(true);
              }}
            >
              <IconTrash size={18} color={colors.danger} />
              <Button.Label className="font-nunitoSemiBold">
                Delete Document
              </Button.Label>
            </Button>
          </View>
        ) : undefined
      }
    >
      <View className="gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <View
            testID="document-type-icon"
            className="size-12 rounded-2xl bg-primary-light items-center justify-center"
          >
            {isLinkedVerification ? (
              <IconId size={24} color={colors.primary} />
            ) : (
              createElement(getDocumentTypeIcon(document.doc_type), {
                size: 24,
                color: colors.primary,
              })
            )}
          </View>
          {document.is_verified ? (
            <Chip variant="soft" color="success" size="md" style={statusChipSurface(success)}>
              <IconShieldCheck size={14} color={success.textColor} />
              <Chip.Label className="font-nunitoSemiBold" style={{ color: success.textColor }}>
                Verified
              </Chip.Label>
            </Chip>
          ) : isUnderReview ? (
            <Chip variant="soft" color="warning" size="md" style={statusChipSurface(warning)}>
              <IconHourglass size={14} color={warning.textColor} />
              <Chip.Label className="font-nunitoSemiBold" style={{ color: warning.textColor }}>
                Under review
              </Chip.Label>
            </Chip>
          ) : null}
        </View>

        <Text className="text-muted text-sm font-inter leading-relaxed">
          {isLinkedVerification
            ? "This ID is linked to your approved account verification and is managed automatically."
            : getDocumentTypeDescription(document.doc_type)}
        </Text>

        {isUnderReview && !document.is_verified ? (
          <View
            className="rounded-2xl p-3"
            style={statusChipSurface(warning)}
          >
            <Text
              className="text-sm font-nunitoSemiBold"
              style={{ color: warning.textColor }}
            >
              Under admin review
            </Text>
            <Text className="text-muted text-sm font-inter mt-0.5">
              We&apos;ll notify you once an admin has checked this document.
            </Text>
          </View>
        ) : null}

        {reviewStatus === "rejected" && document.rejection_reason ? (
          <View className="bg-danger/10 border border-danger/20 rounded-2xl p-3">
            <Text className="text-danger text-sm font-nunitoSemiBold">
              Not verified
            </Text>
            <Text className="text-muted text-sm font-inter mt-0.5">
              {document.rejection_reason}
            </Text>
          </View>
        ) : null}

        {isExpiredDate(document.expires_at) ? (
          <View className="bg-danger/10 border border-danger/20 rounded-2xl p-3">
            <Text className="text-danger text-sm font-nunitoSemiBold">
              Expired document
            </Text>
            <Text className="text-muted text-sm font-inter mt-0.5">
              Upload a current copy before requesting verification.
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          {document.storage_path_back ? (
            <Text className="text-foreground text-base font-nunitoSemiBold">
              Front
            </Text>
          ) : null}
          <DocumentPreview
            docType={document.doc_type}
            storagePath={document.storage_path}
            signedUrl={signedUrl}
            loading={urlLoading}
            onPress={handleOpenFront}
          />
        </View>

        {document.storage_path_back ? (
          <View className="gap-2">
            <Text className="text-foreground text-base font-nunitoSemiBold">
              Back
            </Text>
            <DocumentPreview
              docType={`${document.doc_type} (back)`}
              storagePath={document.storage_path_back}
              signedUrl={backSignedUrl}
              loading={urlLoading}
              onPress={handleOpenBack}
            />
          </View>
        ) : null}

        <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
          <DetailRow
            label="Uploaded"
            value={formatDate(document.created_at, "medium")}
          />
          <DetailRow
            label="Expires"
            value={
              document.expires_at
                ? formatDate(`${document.expires_at}T00:00:00`, "medium")
                : "No expiry"
            }
            isDanger={isExpiredDate(document.expires_at)}
          />
        </View>
      </View>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete document?"
        description="This document will be permanently removed from your passport. Documents attached to an active application cannot be deleted."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        isConfirmDisabled={isDeleting}
        onConfirm={handleDelete}
        errorMessage={deleteError}
      />

      <ErrorDialog
        isOpen={!!deleteError && !confirmOpen}
        onClose={() => setDeleteError(null)}
        message={deleteError}
      />

      <ImageViewing
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        presentationStyle="overFullScreen"
        backgroundColor="rgba(0,0,0,0.8)"
      />
    </ScreenWrapper>
  );
}
