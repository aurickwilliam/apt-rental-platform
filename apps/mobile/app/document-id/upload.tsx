import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createElement, useState } from "react";

import {
  Button,
  Checkbox,
  ControlField,
  Label,
  LinkButton,
  Spinner,
} from "heroui-native";

import { IconAlertTriangle, IconFileInfo } from "@tabler/icons-react-native";

import { DOCUMENT_TYPES, PASSPORT_GOV_ID_DOC_TYPES } from "@repo/constants";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import UploadDocumentField, {
  type UploadedDocument,
} from "@/components/inputs/UploadDocumentField";
import DateField from "@/components/inputs/DateField";
import ErrorDialog from "@/components/display/ErrorDialog";
import AppDialog from "@/components/display/AppDialog";
import { getDocumentTypeIcon } from "./utils/documentTypeIcons";
import { getDocumentTypeDescription } from "./utils/documentTypeDescriptions";

import { useColors } from "@/hooks/useTheme";
import { useUploadPassportDocument } from "@/hooks/passport";
import {
  toExpiryDateString,
  validateExpiryDate,
} from "@/service/passport/expiry";

export default function Upload() {
  const { docType } = useLocalSearchParams<{ docType?: string | string[] }>();
  const resolvedDocType = Array.isArray(docType)
    ? (docType[0] ?? "Document")
    : (docType ?? "Document");
  const { colors } = useColors();
  const router = useRouter();

  const [isVerified, setIsVerified] = useState(false);
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const expiryError = validateExpiryDate(expiryDate);

  const { mutate: upload, isPending, error } = useUploadPassportDocument();
  const [showError, setShowError] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const isUploadableDocType = DOCUMENT_TYPES.includes(resolvedDocType);
  const isIdentityDoc = PASSPORT_GOV_ID_DOC_TYPES.includes(resolvedDocType);

  const handleAddDocument = () => {
    if (
      !isUploadableDocType ||
      !document ||
      !isVerified ||
      validateExpiryDate(expiryDate)
    ) return;

    const asset =
      document.kind === "image"
        ? {
            uri: document.asset.uri,
            fileName: document.asset.fileName ?? "document.jpg",
            mimeType: document.asset.mimeType ?? "image/jpeg",
          }
        : {
            uri: document.asset.uri,
            fileName: document.asset.name,
            mimeType: document.asset.mimeType ?? "application/octet-stream",
          };

    upload(
      {
        docType: resolvedDocType,
        asset,
        expiresAt: expiryDate ? toExpiryDateString(expiryDate) : null,
      },
      {
        onSuccess: () => router.replace("/document-id"),
        onError: () => setShowError(true),
      },
    );
  };

  if (!isUploadableDocType) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Upload Document" />}
        className="p-5"
      >
        <View className="flex-1 justify-center gap-4">
          <Text className="text-foreground text-xl font-nunitoBold">
            {isIdentityDoc ? "Verify your ID" : "Choose a document type"}
          </Text>
          <Text className="text-muted text-base font-inter leading-relaxed">
            {isIdentityDoc
              ? "Identity documents use live ID capture and a selfie in Verify Account. Once approved, your ID is added to your APT Passport automatically."
              : "This document type is not available for Passport uploads. Choose a type from the list instead."}
          </Text>
          <Button
            onPress={() =>
              router.replace(
                isIdentityDoc
                  ? "/(auth)/verify-account"
                  : "/document-id/select-document",
              )
            }
          >
            <Button.Label>
              {isIdentityDoc ? "Go to ID verification" : "Choose document type"}
            </Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Upload Document" />}
      className="p-5"
    >
      <View className="flex gap-1.5">
        {/* Name of Document */}
        <View className="flex-row items-center gap-2">
          <View
            testID="document-type-icon"
            className="size-10 rounded-xl bg-primary-light items-center justify-center"
          >
            {createElement(getDocumentTypeIcon(resolvedDocType), {
              size: 20,
              color: colors.primary,
            })}
          </View>
          <Text className="text-accent text-2xl font-nunitoBold shrink">
            {resolvedDocType}
          </Text>
        </View>

        <Text className="text-muted text-sm font-inter leading-relaxed">
          {getDocumentTypeDescription(resolvedDocType)}
        </Text>

        <View className="flex-row items-center gap-1.5">
          <IconFileInfo size={16} color={colors.gray400} />
          <Text className="text-gray-500 text-sm font-inter">
            Accepted formats: JPG, PNG, or PDF (max 5MB each)
          </Text>
        </View>
      </View>

      {/* Upload field */}
      <View className="mt-6">
        <UploadDocumentField
          label="Document"
          required
          value={document}
          onChange={setDocument}
        />
      </View>

      <View className="mt-6">
        <DateField
          label="Expiry date (optional)"
          placeholder="No expiry"
          value={expiryDate}
          onChange={setExpiryDate}
          onClear={() => setExpiryDate(null)}
          error={expiryError ?? undefined}
        />
      </View>

      {/* Verification */}
      <View className="mt-8 flex gap-4">
        <ControlField
          isSelected={isVerified}
          onSelectedChange={() => setIsVerified(!isVerified)}
        >
          <ControlField.Indicator>
            <Checkbox className="size-5 border border-border shadow-none" />
          </ControlField.Indicator>

          <Label>
            <Label.Text className="text-sm text-foreground font-nunitoSemiBold leading-snug">
              I confirm that the information provided is true and the ID belongs
              to me.
            </Label.Text>
          </Label>
        </ControlField>

        <View className="flex">
          <Text className="text-sm text-gray-500 font-inter leading-relaxed">
            <Text className="text-danger">*</Text> By uploading, you confirm
            this document is valid and belongs to you. Fraudulent documents may
            lead to account suspension.
          </Text>

          <LinkButton
            className="self-start"
            onPress={() => setIsLegalOpen(true)}
          >
            <LinkButton.Label className="text-sm font-interMedium text-accent underline">
              Legal notice
            </LinkButton.Label>
          </LinkButton>
        </View>
      </View>

      <View className="flex-1" />

      <Button
        className="mt-8"
        isDisabled={!isVerified || !document || !!expiryError || isPending}
        onPress={handleAddDocument}
      >
        {isPending ? (
          <Spinner size="sm" color="#FFFFFF" />
        ) : (
          <Button.Label className="text-white font-nunitoSemiBold">
            Add Document
          </Button.Label>
        )}
      </Button>

      <ErrorDialog
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={
          error?.message ?? "Could not save your document. Please try again."
        }
      />
      <AppDialog
        isOpen={isLegalOpen}
        onOpenChange={setIsLegalOpen}
        title="Legal notice"
        titleIcon={<IconAlertTriangle size={20} color={colors.warning} />}
      >
        <Text className="text-muted text-sm font-inter leading-relaxed">
          By uploading your documents, you certify that all information is true
          and valid. Any fraudulent or falsified documents may result in account
          suspension and legal action in accordance with applicable Philippine
          laws on fraud and identity theft, including the Cybercrime Prevention
          Act (Republic Act No. 10175).
        </Text>
      </AppDialog>
    </ScreenWrapper>
  );
}
