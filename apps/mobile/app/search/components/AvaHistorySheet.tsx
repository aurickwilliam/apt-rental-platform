import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconHistory, IconTrash } from "@tabler/icons-react-native";
import { BottomSheet, Button, PressableFeedback } from "heroui-native";

import {
  groupAvaChatsByAge,
  type AvaHistoryGroupLabel,
  type AvaSavedChat,
} from "@repo/utils";

import EmptyState from "@/components/display/EmptyState";
import { useColors } from "@/hooks/useTheme";

const GROUP_LABELS: Record<AvaHistoryGroupLabel, string> = {
  today: "Today",
  week: "Previous 7 days",
  older: "Older",
};

interface AvaHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chats: AvaSavedChat[];
  activeChatId: string | null;
  onOpen: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

// Saved conversations, newest first, grouped by age. The sheet stays mounted
// and is driven by `isOpen` (HeroUI only snaps a sheet open on a closed -> open
// change) and opens at an explicit snap point.
export default function AvaHistorySheet({
  isOpen,
  onOpenChange,
  chats,
  activeChatId,
  onOpen,
  onDelete,
}: AvaHistorySheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useColors();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["70%"]} enableDynamicSizing={false} contentContainerClassName="h-full">
          <View className="flex-1 gap-3" style={{ paddingBottom: insets.bottom + 8 }}>
            <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
              Chat history
            </BottomSheet.Title>

            {chats.length === 0 ? (
              <EmptyState
                icon={IconHistory}
                title="No conversations yet"
                description="Your conversations with Ava will show up here."
                className="pt-6"
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-2">
                {groupAvaChatsByAge(chats).map((group) => (
                  <View key={group.label} className="gap-1">
                    <Text className="px-1 pb-1 font-inter text-xs uppercase text-muted">
                      {GROUP_LABELS[group.label]}
                    </Text>
                    {group.chats.map((chat) => (
                      <View
                        key={chat.id}
                        className={`flex-row items-center rounded-2xl ${
                          chat.id === activeChatId ? "bg-surface-tertiary" : ""
                        }`}
                      >
                        <PressableFeedback
                          onPress={() => onOpen(chat.id)}
                          className="flex-1 px-3 py-3"
                          accessibilityRole="button"
                          accessibilityLabel={`Open conversation: ${chat.title}`}
                        >
                          <Text className="font-inter text-base text-foreground" numberOfLines={1}>
                            {chat.title}
                          </Text>
                        </PressableFeedback>
                        <Button
                          variant="ghost"
                          isIconOnly
                          onPress={() => onDelete(chat.id)}
                          className="size-10 rounded-full"
                          accessibilityLabel={`Delete conversation: ${chat.title}`}
                        >
                          <IconTrash size={18} color={colors.gray500} />
                        </Button>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
