import { View, Text } from "react-native";
import ImageViewing from "react-native-image-viewing";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { Button, ListGroup, Separator } from "heroui-native";

import {
  IconFileUpload,
  IconLayoutGrid,
  IconLayoutRows,
  IconPlus,
} from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DocumentCard from "./components/DocumentCard";
import DocumentRow from "@/components/display/DocumentRow";
import EmptySupportingDocs from "./components/EmptySupportingDocs";
import PassportSkeleton from "./components/PassportSkeleton";
import ValidIdCard from "./components/ValidIdCard";

import { useColors } from "@/hooks/useTheme";
import { useDocumentUrls } from "@/hooks/applications";
import { usePassportDocuments } from "@/hooks/passport";
import { isExpiredDate } from "@/service/passport/expiry";

export default function Index() {
  const router = useRouter();
  const { colors } = useColors();

  // The wallet query links the approved verification ID as its primary row
  // before resolving, so a single `loading` signal covers both — the empty
  // state can never render before the linked ID arrives.
  const { documents, loading, refreshing, error, refetch } =
    usePassportDocuments();

  const [isIdVisible, setIsIdVisible] = useState<boolean>(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isGridView, setIsGridView] = useState(true);

  const verifiedDoc = useMemo(
    () =>
      documents.find((doc) => doc.is_primary) ??
      documents.find((doc) => !!doc.verification_id && doc.is_verified) ??
      null,
    [documents],
  );
  const supportingDocs = useMemo(
    () => documents.filter((doc) => doc.id !== verifiedDoc?.id),
    [documents, verifiedDoc],
  );

  const passportEntries = useMemo(
    () =>
      supportingDocs.map((doc) => ({
        label: doc.doc_type,
        path: doc.storage_path,
      })),
    [supportingDocs],
  );
  const { resolved: resolvedDocs, loading: docsLoading } =
    useDocumentUrls(passportEntries);

  const { resolved: resolvedVerified, loading: verifiedLoading } =
    useDocumentUrls(
      verifiedDoc
        ? [
            { label: verifiedDoc.doc_type, path: verifiedDoc.storage_path },
            ...(verifiedDoc.storage_path_back
              ? [
                  {
                    label: `${verifiedDoc.doc_type} (back)`,
                    path: verifiedDoc.storage_path_back,
                  },
                ]
              : []),
          ]
        : [],
      verifiedDoc?.verification_id
        ? "user-verification"
        : "application-documents",
    );
  const verifiedSignedUrl = resolvedVerified[0]?.signedUrl ?? null;
  const verifiedBackSignedUrl = resolvedVerified[1]?.signedUrl ?? null;
  const verifiedViewerImages = useMemo(
    () =>
      resolvedVerified
        .map((doc) => ({ uri: doc.signedUrl }))
        .filter((img): img is { uri: string } => !!img.uri),
    [resolvedVerified],
  );

  const signedByPath = useMemo(
    () => new Map(resolvedDocs.map((doc) => [doc.path, doc.signedUrl])),
    [resolvedDocs],
  );

  const listRows = useMemo(
    () =>
      resolvedDocs.map((doc) => {
        const row = supportingDocs.find((d) => d.storage_path === doc.path);
        return {
          key: row?.id ?? doc.path,
          label: doc.label,
          path: doc.path,
          signedUrl: doc.signedUrl,
          verified: row?.is_verified ?? false,
          expired: isExpiredDate(row?.expires_at ?? null),
          mimeType: row?.mime_type ?? null,
          id: row?.id ?? null,
        };
      }),
    [resolvedDocs, supportingDocs],
  );

  const handleOpenViewer = (index: number) => {
    setViewerIndex(
      Math.min(index, Math.max(verifiedViewerImages.length - 1, 0)),
    );
    setIsIdVisible(true);
  };

  const hasDocuments = documents.length > 0;

  // Signed URLs resolve after the rows arrive, so the skeleton covers both
  // phases. Only the initial load shows it — pull-to-refresh keeps the
  // settled content on screen.
  const showSkeleton = !error && (loading || docsLoading);

  return (
    <ScreenWrapper
      header={
        <StandardHeader
          title="APT Passport"
          onBackPress={() => router.replace("/(tabs)/(tenant)/profile")}
          rightComponent={
            <Button
              variant="ghost"
              isIconOnly
              onPress={() => router.push("/document-id/select-document")}
              accessibilityLabel="Add a document"
              accessibilityRole="button"
            >
              <IconPlus size={24} color="#FFFFFF" />
            </Button>
          }
        />
      }
      className="p-5"
      scrollable
      noBottomPadding
      refreshing={refreshing}
      onRefresh={() => void refetch()}
    >
      {/* Verified ID linked from account verification */}
      {verifiedDoc && !showSkeleton ? (
        <>
          <ValidIdCard
            key={verifiedDoc.id}
            idType={verifiedDoc.id_type ?? verifiedDoc.doc_type}
            frontUrl={verifiedSignedUrl}
            backUrl={verifiedBackSignedUrl}
            loading={verifiedLoading}
            onOpenViewer={handleOpenViewer}
          />

          <Separator className="my-3" />
        </>
      ) : null}

      {error ? (
        <View className="flex-1 items-center gap-4 pt-16 px-4">
          <Text className="text-foreground text-xl font-nunitoBold text-center">
            Couldn&apos;t load your documents
          </Text>
          <Text className="text-gray-400 text-base font-inter text-center px-8 leading-relaxed">
            {error}
          </Text>
          <Button size="lg" onPress={() => void refetch()}>
            <Button.Label className="text-white font-nunitoSemiBold">
              Try Again
            </Button.Label>
          </Button>
        </View>
      ) : showSkeleton ? (
        <PassportSkeleton />
      ) : !hasDocuments ? (
        <View className="flex-1 items-center gap-4 pt-16 px-4">
          <IconFileUpload size={64} color={colors.primary} />
          <Text className="text-foreground text-xl font-nunitoBold text-center">
            No documents yet
          </Text>
          <Text className="text-gray-400 text-base font-inter text-center px-8 leading-relaxed">
            Add your IDs and supporting documents so they&apos;re ready when you
            apply for an apartment.
          </Text>

          <Button
            size="lg"
            onPress={() => router.push("/document-id/select-document")}
          >
            <IconPlus size={20} color="#FFFFFF" />
            <Button.Label className="text-white font-nunitoSemiBold">
              Add a Document
            </Button.Label>
          </Button>

          {/* Info card */}
          <View className="mt-8 w-full bg-surface border border-border rounded-3xl p-4 gap-3">
            <View className="flex-row gap-3">
              <View className="size-11 rounded-2xl bg-primary-light items-center justify-center">
                <IconFileUpload size={22} color={colors.primary} />
              </View>

              <View className="flex-1 gap-1">
                <Text className="text-foreground text-base font-nunitoSemiBold leading-snug">
                  Uploading your documents early allows for faster and easier
                  submission when applying for rentals.
                </Text>
                <Text className="text-muted text-sm font-inter leading-snug">
                  Note: Uploaded documents will be securely stored and only
                  shared with landlords during the application process.
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground text-lg font-nunitoSemiBold">
              Uploaded Documents
            </Text>

            {supportingDocs.length > 0 ? (
              <Button
                variant="ghost"
                isIconOnly
                accessibilityLabel="Toggle view"
                accessibilityRole="button"
                onPress={() => setIsGridView((prev) => !prev)}
              >
                {isGridView ? (
                  <IconLayoutGrid size={22} color={colors.gray500} />
                ) : (
                  <IconLayoutRows size={22} color={colors.gray500} />
                )}
              </Button>
            ) : null}
          </View>

          {supportingDocs.length === 0 ? (
            <EmptySupportingDocs
              onAddDocument={() => router.push("/document-id/select-document")}
            />
          ) : isGridView ? (
            <View className="flex-row flex-wrap gap-x-4 gap-y-5">
              {supportingDocs.map((doc) => {
                const signedUrl = signedByPath.get(doc.storage_path) ?? null;
                return (
                  <DocumentCard
                    key={doc.id}
                    filePath={signedUrl}
                    storagePath={doc.storage_path}
                    label={doc.doc_type}
                    verified={doc.is_verified}
                    expired={isExpiredDate(doc.expires_at)}
                    pending={doc.review_status === "pending"}
                    mimeType={doc.mime_type}
                    onPress={() => router.push(`/document-id/${doc.id}`)}
                  />
                );
              })}
            </View>
          ) : (
            <ListGroup className="shadow-none border border-border rounded-3xl">
              {listRows.map((doc, index) => (
                <View key={doc.key} className="px-4">
                  {index > 0 && <Separator />}
                  <DocumentRow
                    label={doc.label}
                    path={doc.path}
                    signedUrl={doc.signedUrl}
                    verified={doc.verified}
                    expired={doc.expired}
                    mimeType={doc.mimeType}
                    onPress={() => {
                      if (doc.id) router.push(`/document-id/${doc.id}`);
                    }}
                  />
                </View>
              ))}
            </ListGroup>
          )}
        </>
      )}

      <ImageViewing
        images={verifiedViewerImages}
        imageIndex={viewerIndex}
        visible={isIdVisible}
        onRequestClose={() => setIsIdVisible(false)}
        presentationStyle="overFullScreen"
        backgroundColor="rgb(0, 0, 0, 0.8)"
      />
    </ScreenWrapper>
  );
}
