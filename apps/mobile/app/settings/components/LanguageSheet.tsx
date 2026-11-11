import { View, Text, Pressable } from "react-native";
import { BottomSheet } from "heroui-native";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";

import { APP_LANGUAGES, type LanguageCode } from "@repo/i18n";

import { useTranslation } from "@/hooks/i18n/useTranslation";

type LanguageOption = (typeof APP_LANGUAGES)[number];

interface LanguageSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  language: LanguageCode;
  onSelect: (code: LanguageCode) => void;
}

export default function LanguageSheet({
  isOpen,
  onOpenChange,
  language,
  onSelect,
}: LanguageSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["50%", "75%"]}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full"
        >
          <BottomSheetFlatList
            data={[...APP_LANGUAGES] as LanguageOption[]}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                className={`p-4 rounded-2xl mb-2 ${item.code === language ? "bg-accent/10" : "bg-surface"}`}
                onPress={() => {
                  onSelect(item.code);
                  onOpenChange(false);
                }}
              >
                <Text className="text-base text-foreground text-left font-inter">
                  {item.label}
                </Text>
              </Pressable>
            )}
            ListHeaderComponent={
              <View>
                <Text className="text-lg text-center text-foreground font-nunitoSemiBold border-b border-border pb-3 mb-4">
                  {t("settings.mobile.selectLanguage")}
                </Text>
              </View>
            }
            contentContainerStyle={{
              paddingBottom: 80,
            }}
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
