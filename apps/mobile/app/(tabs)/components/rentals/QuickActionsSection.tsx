import { Text, View, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import {
  IconClipboardText,
  IconClock,
  IconFileText,
  IconHeart,
  IconHelpCircle,
  IconHome,
  IconMessageCircle,
  IconPencil,
  IconReceipt,
  IconSettings,
  IconTool,
} from "@tabler/icons-react-native";
import type { Icon } from "@tabler/icons-react-native";
import { BottomSheet, Button } from "heroui-native";
import QuickActionSlotsEditor from "./QuickActionSlotsEditor";

import QuickActionButton from "@/app/(tabs)/components/QuickActionButton";
import { useColors } from "@/hooks/useTheme";
import {
  DEFAULT_TENANT_QUICK_ACTION_IDS,
  loadQuickActionSlots,
  saveQuickActionSlots,
  normalizeQuickActionSlots,
  type QuickActionSlot,
  type TenantQuickActionId,
} from "@/service/tenancy/quickActionsPreference";

interface QuickActionDefinition {
  id: TenantQuickActionId;
  label: string;
  description: string;
  icon: Icon;
  requiresVerifiedAccount?: boolean;
  requiresLandlord?: boolean;
}

const MAX_SHEET_HEIGHT_RATIO = 0.85;

const TENANT_QUICK_ACTIONS: QuickActionDefinition[] = [
  { id: "receipts", label: "Receipts", description: "View payment receipts", icon: IconReceipt },
  { id: "applications", label: "Applications", description: "Track rental applications", icon: IconClipboardText },
  { id: "repairs", label: "Repairs", description: "Request maintenance", icon: IconTool },
  { id: "repair-history", label: "Repair history", description: "View past maintenance requests", icon: IconClock },
  { id: "my-rental", label: "My rental", description: "View your apartment details", icon: IconHome },
  {
    id: "message-landlord",
    label: "Message landlord",
    description: "Start a conversation with your landlord",
    icon: IconMessageCircle,
    requiresLandlord: true,
  },
  {
    id: "passport",
    label: "APT Passport",
    description: "Manage your verified documents",
    icon: IconFileText,
    requiresVerifiedAccount: true,
  },
  { id: "favorites", label: "Favorites", description: "View saved apartments", icon: IconHeart },
  { id: "settings", label: "Settings", description: "Manage your account", icon: IconSettings },
  { id: "faq", label: "FAQ", description: "Find answers and support", icon: IconHelpCircle },
];

interface QuickActionsSectionProps {
  authUserId?: string;
  isVerifiedAccount: boolean;
  hasLandlord: boolean;
  onActionPress: (actionId: TenantQuickActionId) => void;
}

function actionIsAvailable(
  action: QuickActionDefinition,
  isVerifiedAccount: boolean,
  hasLandlord: boolean,
): boolean {
  if (action.requiresVerifiedAccount && !isVerifiedAccount) return false;
  if (action.requiresLandlord && !hasLandlord) return false;
  return true;
}

function unavailableDescription(action: QuickActionDefinition): string | undefined {
  if (action.requiresVerifiedAccount) return "Verify your account to add this action";
  if (action.requiresLandlord) return "Available once landlord details load";
  return undefined;
}

export default function QuickActionsSection({
  authUserId,
  isVerifiedAccount,
  hasLandlord,
  onActionPress,
}: QuickActionsSectionProps) {
  const { colors } = useColors();
  const { height: windowHeight } = useWindowDimensions();
  const [selectedIds, setSelectedIds] = useState<QuickActionSlot[]>([
    ...DEFAULT_TENANT_QUICK_ACTION_IDS,
  ]);
  const [loadedForAuthUserId, setLoadedForAuthUserId] = useState<string | undefined>();
  const [draftIds, setDraftIds] = useState<QuickActionSlot[]>([
    ...DEFAULT_TENANT_QUICK_ACTION_IDS,
  ]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const actionIds = authUserId
      ? loadQuickActionSlots(authUserId)
      : Promise.resolve([...DEFAULT_TENANT_QUICK_ACTION_IDS]);

    void actionIds
      .then((actionIds) => {
        if (!active) return;
        setSelectedIds(actionIds);
        setLoadedForAuthUserId(authUserId);
        setStorageError(null);
      })
      .catch((error) => {
        console.error("Failed to load saved quick actions", error);
        if (!active) return;
        setSelectedIds([...DEFAULT_TENANT_QUICK_ACTION_IDS]);
        setLoadedForAuthUserId(authUserId);
        setStorageError("Your saved quick actions could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, [authUserId]);

  // Never show one account's saved shortcuts while another account's preference
  // is still loading. The default row is safe until the account-specific value arrives.
  const currentSelectedIds =
    loadedForAuthUserId === authUserId
      ? selectedIds
      : DEFAULT_TENANT_QUICK_ACTION_IDS;

  const displayedActions = currentSelectedIds
    .map((id) => TENANT_QUICK_ACTIONS.find((action) => action.id === id))
    .filter(
      (action): action is QuickActionDefinition =>
        !!action && actionIsAvailable(action, isVerifiedAccount, hasLandlord),
    );

  const openEditor = () => {
    setDraftIds(normalizeQuickActionSlots(currentSelectedIds));
    setStorageError(null);
    setIsEditorOpen(true);
  };

  const handleEditorOpenChange = (open: boolean) => {
    if (!open) setDraftIds(currentSelectedIds);
    setIsEditorOpen(open);
  };

  const saveActions = async () => {
    if (!authUserId) return;

    try {
      await saveQuickActionSlots(authUserId, draftIds);
      setSelectedIds(draftIds);
      setLoadedForAuthUserId(authUserId);
      setStorageError(null);
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Failed to save quick actions", error);
      setStorageError("Your changes could not be saved. Please try again.");
    }
  };

  const resetActions = () => setDraftIds([...DEFAULT_TENANT_QUICK_ACTION_IDS]);

  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-lg font-nunitoSemiBold">Quick Actions</Text>
        <Button
          variant="ghost"
          size="md"
          isIconOnly
          accessibilityLabel="Customize quick actions"
          onPress={openEditor}
        >
          <IconPencil size={20} color={colors.textPrimary} />
        </Button>
      </View>

      <View className="mt-3 flex-row flex-wrap">
        {displayedActions.map((action) => (
          <QuickActionButton
            key={action.id}
            label={action.label}
            icon={action.icon}
            columns={5}
            onPress={() => onActionPress(action.id)}
          />
        ))}
      </View>

      <BottomSheet isOpen={isEditorOpen} onOpenChange={handleEditorOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            enableOverDrag={false}
            enableContentPanningGesture={false}
            enableDynamicSizing
            maxDynamicContentSize={windowHeight * MAX_SHEET_HEIGHT_RATIO}
            handleIndicatorClassName="bg-[#D0D0D0] w-10"
            backgroundClassName="bg-surface rounded-t-[20px]"
          >
            <View className="border-b border-border pb-3">
              <Text className="text-lg text-foreground font-nunitoSemiBold">
                Customize quick actions
              </Text>
              <Text className="mt-1 text-sm text-muted font-inter">
                Fill five slots with your preferred shortcuts.
              </Text>
            </View>

            {isEditorOpen && <QuickActionSlotsEditor
              slots={draftIds}
              onChange={setDraftIds}
              actions={TENANT_QUICK_ACTIONS.map((action) => ({
                ...action,
                available: actionIsAvailable(action, isVerifiedAccount, hasLandlord),
                description: actionIsAvailable(action, isVerifiedAccount, hasLandlord)
                  ? action.description
                  : unavailableDescription(action) ?? action.description,
              }))}
            />}
            {storageError && <Text className="text-sm text-danger font-inter">{storageError}</Text>}

            <View className="flex-row gap-3 border-t border-border pt-3">
              <Button variant="tertiary" className="flex-1" onPress={resetActions}>
                <Button.Label>Reset</Button.Label>
              </Button>
              <Button className="flex-1" onPress={() => void saveActions()}>
                <Button.Label>Save changes</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}
