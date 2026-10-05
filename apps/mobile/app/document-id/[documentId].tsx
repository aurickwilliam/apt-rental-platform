import { createElement, useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import ImageViewing from "react-native-image-viewing";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button, Chip, Separator, Spinner } from "heroui-native";

import {
  IconFileText,
  IconHourglass,
  IconId,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react-native";

import { formatDate } from "@repo/utils";
import { isReviewEligibleDocType } from "@repo/constants";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import ConfirmDialog from "@/components/display/ConfirmDialog";
import ErrorDialog from "@/components/display/ErrorDialog";

import { useColors } from "@/hooks/useTheme";
import { useDocumentUrls } from "@/hooks/applications";
import {
  useDeletePassportDocument,
  usePassportDocuments,
  useRequestPassportDocumentReview,
} from "@/hooks/passport";

import { isImageUri } from "./utils/fileType";
import { getDocumentTypeIcon } from "./utils/documentTypeIcons";
import { getDocumentTypeDescription } from "./utils/documentTypeDescriptions";
import { isExpiredDate } from "@/service/passport/expiry";

export default function PassportDocumentDetail() {
  const { documentId } = useLocalSearchParams<{
    documentId?: string | string[];
  }>();
  const resolvedId = Array.isArray(documentId) ? documentId[0] : documentId;
  const router = useRouter();
  const { colors } = useColors();

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
  const showAsImage = signedUrl
    ? isImageUri(signedUrl)
    : isImageUri(document?.storage_path ?? "");

  const handleOpen = () => {
    if (!signedUrl) return;
    if (showAsImage) {
      setViewerVisible(true);
    } else {
      void Linking.openURL(signedUrl);
    }
  };

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
        !isLinkedVerification ? (
          <View className="gap-3 px-5">
            {requestError ? (
              <Text className="text-danger text-sm font-inter">
                {requestError.message}
              </Text>
            ) : null}
            {isUnderReview ? (
              <Text className="text-muted text-sm font-inter leading-relaxed">
                Under admin review. You can delete it once the review resolves.
              </Text>
            ) : (
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
            )}
            {canRequestReview ? (
              <Button
                onPress={handleRequestReview}
                isDisabled={isRequesting}
              >
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
          </View>
        ) : undefined
      }
    >
      <View className="gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-2">
            <View
              testID="document-type-icon"
              className="size-10 rounded-xl bg-primary-light items-center justify-center"
            >
              {isLinkedVerification ? (
                <IconId size={20} color={colors.primary} />
              ) : (
                createElement(getDocumentTypeIcon(document.doc_type), {
                  size: 20,
                  color: colors.primary,
                })
              )}
            </View>
            <Text className="text-accent text-2xl font-nunitoBold shrink">
              {document.doc_type}
            </Text>
          </View>
          {document.is_verified ? (
            <Chip variant="secondary" color="success" size="sm">
              <IconShieldCheck size={14} color={colors.success} />
              <Chip.Label className="text-success font-nunitoSemiBold">
                Verified
              </Chip.Label>
            </Chip>
          ) : isUnderReview ? (
            <Chip variant="secondary" color="warning" size="sm">
              <IconHourglass size={14} color={colors.warning} />
              <Chip.Label className="text-warning font-nunitoSemiBold">
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

        <TouchableOpacity
          className="bg-surface border border-border rounded-3xl shadow-none overflow-hidden"
          activeOpacity={0.7}
          onPress={handleOpen}
          disabled={!signedUrl}
        >
          <View className="w-full bg-gray-100 min-h-56 items-center justify-center">
            {urlLoading || !signedUrl ? (
              <Spinner size="sm" color={colors.primary} />
            ) : showAsImage ? (
              <Image
                source={{ uri: signedUrl }}
                style={{ width: "100%", aspectRatio: 4 / 3 }}
                contentFit="contain"
                cachePolicy="disk"
                transition={150}
              />
            ) : (
              <View className="items-center gap-2 py-10">
                <IconFileText size={48} color={colors.gray400} />
                <Text className="text-muted text-sm font-inter">
                  Tap to open document
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {document.storage_path_back ? (
          <>
            <Text className="text-foreground text-lg font-nunitoSemiBold">
              Back
            </Text>
            <TouchableOpacity
              className="bg-surface border border-border rounded-3xl shadow-none overflow-hidden"
              activeOpacity={0.7}
              onPress={() => {
                if (!backSignedUrl) return;
                if (isImageUri(backSignedUrl)) {
                  setViewerVisible(true);
                } else {
                  void Linking.openURL(backSignedUrl);
                }
              }}
              disabled={!backSignedUrl}
            >
              <View className="w-full bg-gray-100 min-h-56 items-center justify-center">
                {urlLoading || !backSignedUrl ? (
                  <Spinner size="sm" color={colors.primary} />
                ) : isImageUri(backSignedUrl) ? (
                  <Image
                    source={{ uri: backSignedUrl }}
                    style={{ width: "100%", aspectRatio: 4 / 3 }}
                    contentFit="contain"
                    cachePolicy="disk"
                    transition={150}
                  />
                ) : (
                  <View className="items-center gap-2 py-10">
                    <IconFileText size={48} color={colors.gray400} />
                    <Text className="text-muted text-sm font-inter">
                      Tap to open document
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        <Separator className="my-1" />

        <View className="flex-row">
          <DetailField
            label="Uploaded"
            value={formatDate(document.created_at, "medium")}
          />
          <DetailField
            label="Expires"
            value={
              document.expires_at
                ? formatDate(`${document.expires_at}T00:00:00`, "medium")
                : "No expiry"
            }
          />
        </View>

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
        images={[signedUrl, backSignedUrl].flatMap((uri) =>
          uri && isImageUri(uri) ? [{ uri }] : [],
        )}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        presentationStyle="overFullScreen"
        backgroundColor="rgba(0,0,0,0.8)"
      />
    </ScreenWrapper>
  );
}
