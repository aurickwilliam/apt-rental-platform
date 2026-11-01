import { View, Text } from "react-native";
import { createElement, useRef } from "react";
import { useRouter } from "expo-router";

import { ListGroup, Separator } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { getDocumentTypeIcon } from "@/utils/documents/documentTypeIcons";

import { getDocumentTypesForPortal } from "@repo/constants";
import { getAddedSupportingDocTypes } from "@repo/passport";

import { useColors } from "@/hooks/useTheme";
import { usePassportDocuments } from "@/hooks/passport";
import { usePortalStore } from "@/stores/usePortalStore";

export default function SelectDocument() {
  const documentType = useRef("");
  const { colors } = useColors();
  const portal = usePortalStore((state) => state.portal);
  const isLandlord = portal === "landlord";
  const { documents } = usePassportDocuments();
  const addedDocTypes = getAddedSupportingDocTypes(documents);

  const router = useRouter();

  const handleDocumentTypeSelect = (docType: string) => {
    documentType.current = docType;

    router.push(`/document-id/upload?docType=${documentType.current}`);
  };

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Select Document Type" />}
      className="p-5"
    >
      <Text className="text-foreground text-sm font-nunitoSemiBold leading-relaxed">
        {isLandlord
          ? "Choose the document that proves you own or are authorized to rent out your properties. Your files are kept securely and reviewed by our team."
          : "Choose the type of document you want to add. Your files will be kept securely and ready for your rental applications."}
      </Text>

      <ListGroup className="shadow-none border border-border mt-5 rounded-3xl">
        {getDocumentTypesForPortal(isLandlord ? "landlord" : "tenant").map((docType, index) => (
          <View key={docType}>
            {index > 0 && <Separator className="mx-4" />}

            <ListGroup.Item
              disabled={addedDocTypes.includes(docType)}
              onPress={() => handleDocumentTypeSelect(docType)}
            >
              <ListGroup.ItemPrefix>
                <View className="size-10 rounded-xl bg-primary-light items-center justify-center">
                  {createElement(getDocumentTypeIcon(docType), {
                    size: 18,
                    color: colors.primary,
                  })}
                </View>
              </ListGroup.ItemPrefix>

              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className="font-nunitoSemiBold text-base">
                  {docType}
                </ListGroup.ItemTitle>
                {addedDocTypes.includes(docType) ? (
                  <ListGroup.ItemDescription className="text-xs font-inter">
                    Already added. Open it to replace the file.
                  </ListGroup.ItemDescription>
                ) : null}
              </ListGroup.ItemContent>

              <ListGroup.ItemSuffix
                iconProps={{
                  size: 18,
                  color: colors.textPrimary,
                }}
              />
            </ListGroup.Item>
          </View>
        ))}
      </ListGroup>

      <View className="mt-3">
        <Text className="text-gray-500 text-sm font-inter text-center">
          Make sure your document is clear and not expired.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
