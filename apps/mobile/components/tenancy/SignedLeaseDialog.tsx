import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Button, Dialog, Spinner } from "heroui-native";
import { IconFileUpload } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";
import type { useSignedLease } from "@/hooks/tenancy/useSignedLease";

interface SignedLeaseDialogProps {
  form: ReturnType<typeof useSignedLease>;
  isReplacing: boolean;
  currentDescription: string;
}

export default function SignedLeaseDialog({ form, isReplacing, currentDescription }: SignedLeaseDialogProps) {
  const { colors } = useColors();
  const { height } = useWindowDimensions();
  return (
    <Dialog isOpen={form.isOpen} onOpenChange={(open) => { if (!open) form.close(); }}>
      <Dialog.Portal unstable_accessibilityContainerViewIsModal>
        <Dialog.Overlay isCloseOnPress={!form.busy} />
        <Dialog.Content isSwipeable={false} className="gap-4 p-5" style={{ maxHeight: height * 0.85 }} accessibilityViewIsModal>
          <Dialog.Title>{isReplacing ? "Replace Signed Lease" : "Upload Signed Lease"}</Dialog.Title>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 16 }}>
            {isReplacing && <View className="bg-surface-secondary rounded-2xl p-3 gap-1">
              <Text className="text-foreground font-nunitoSemiBold">Current signed lease</Text>
              <Text className="text-muted font-inter text-xs">{currentDescription}</Text>
            </View>}
            <Text className="text-muted font-inter text-sm">
              {isReplacing
                ? "Uploading a replacement deletes the current file and asks the tenant to confirm the new one."
                : "Upload the contract both parties signed. The tenant can open and confirm it from My Rental on the web."}
            </Text>
            {!form.saved && <View className="gap-2">
              <Text className="text-foreground font-nunitoSemiBold">{isReplacing ? "Replacement file" : "Lease file"}<Text className="text-danger"> *</Text></Text>
              <Button variant="outline" isDisabled={form.busy} onPress={() => void form.pick()}
                accessibilityLabel="Choose a signed lease file">
                <IconFileUpload size={20} color={colors.primary} />
                <Button.Label>{form.asset ? "Choose another file" : "Choose a file"}</Button.Label>
              </Button>
              {form.asset && <View className="gap-1">
                <Text selectable numberOfLines={2} className="text-foreground font-nunitoSemiBold text-sm">{form.asset.name}</Text>
                {form.asset.size !== undefined && <Text className="text-muted font-inter text-xs">{(form.asset.size / 1024).toFixed(1)} KB</Text>}
                <Button variant="ghost" size="sm" isDisabled={form.busy} onPress={form.clear} accessibilityLabel="Remove selected lease file">
                  <Button.Label>Remove</Button.Label>
                </Button>
              </View>}
              <Text className="text-muted font-inter text-xs">PDF, JPG, PNG, or WebP, up to 10 MB.</Text>
            </View>}
            {form.error && <Text selectable accessibilityRole="alert" className="text-danger font-inter text-sm">{form.error}</Text>}
          </ScrollView>
          <View className="flex-row gap-3">
            <Button variant="tertiary" className="flex-1" isDisabled={form.busy} onPress={form.close}><Button.Label>Cancel</Button.Label></Button>
            <Button className="flex-1" isDisabled={form.busy || (!form.asset && !form.saved)} onPress={() => void form.save()}>
              {form.busy && <Spinner size="sm" color="white" />}
              <Button.Label>{form.saved ? "Retry refresh" : isReplacing ? "Replace file" : "Upload file"}</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
