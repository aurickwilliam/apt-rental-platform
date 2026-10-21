import { Text, View } from "react-native";
import {
  Button,
  Checkbox,
  ControlField,
  Dialog,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  useThemeColor,
} from "heroui-native";
import { formatPesoDisplay } from "@repo/utils";
import { useResolveMaintenanceForm } from "@/hooks/maintenance-requests/useResolveMaintenanceForm";

type ResolveRequestDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string, feeAmount?: number) => Promise<boolean> | boolean;
  tenantName: string;
  errorMessage?: string | null;
};

export default function ResolveRequestDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  tenantName,
  errorMessage,
}: ResolveRequestDialogProps) {
  const form = useResolveMaintenanceForm({ isOpen, onOpenChange, onConfirm });
  const { isSubmitting } = form;
  const accentForeground = useThemeColor("accent-foreground");

  return (
    <Dialog isOpen={isOpen} onOpenChange={form.close}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <View className="mb-5 gap-1.5">
            <View className="flex-row justify-between items-center">
              <Dialog.Title>{form.step === "confirm" ? "Confirm Maintenance Fee" : "Resolve Maintenance Request"}</Dialog.Title>
              <Dialog.Close variant="ghost" isDisabled={isSubmitting} />
            </View>
            <Dialog.Description className="text-sm">
              {form.step === "confirm" ? `This fee will be added to ${tenantName}'s next rent payment.` : "Add a note on how this issue was fixed before marking it resolved."}
            </Dialog.Description>
          </View>

          <View className="pb-5">
            {form.step === "confirm" ? (
              <View className="gap-3">
                <Text className="text-accent text-3xl font-nunitoBold text-center">{formatPesoDisplay(form.feeAmount)}</Text>
                <View className="bg-surface rounded-3xl p-3 gap-2">
                  <Text className="text-foreground text-sm font-inter">Charged to: {tenantName}</Text>
                  <Text className="text-foreground text-sm font-inter">Applied to: Next rent payment</Text>
                  <Text className="text-muted text-sm font-inter">Resolution note: {form.notes.trim()}</Text>
                </View>
              </View>
            ) : (
              <>
                <TextField isRequired isInvalid={!!form.notesError} className="mb-5">
                  <Label>Resolution Notes:</Label>
                  <Input
                    placeholder="e.g. Replaced the faulty valve and tested for leaks."
                    multiline
                    numberOfLines={4}
                    accessibilityLabel="Resolution notes"
                    value={form.notes}
                    onChangeText={form.setNotes}
                    className="min-h-24 p-3"
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />
                  {form.notesError && <FieldError>{form.notesError}</FieldError>}
                </TextField>

                <ControlField
                  isSelected={form.chargeFee}
                  onSelectedChange={form.setChargeFee}
                  isDisabled={isSubmitting}
                  accessibilityLabel="Charge a maintenance fee"
                >
                  <ControlField.Indicator><Checkbox className="size-5 border border-border shadow-none" /></ControlField.Indicator>
                  <Label><Label.Text>Charge a maintenance fee to {tenantName}?</Label.Text></Label>
                </ControlField>

                {form.chargeFee && (
                  <TextField isRequired isInvalid={!!form.feeError} className="mt-4">
                    <Label>Maintenance Fee</Label>
                    <Input
                      accessibilityLabel="Maintenance fee amount"
                      placeholder="₱0.00"
                      keyboardType="decimal-pad"
                      value={form.amount}
                      onChangeText={form.setAmount}
                      editable={!isSubmitting}
                    />
                    {form.feeError && <FieldError>{form.feeError}</FieldError>}
                    <Text className="text-muted text-sm font-inter mt-1">Charged on top of rent, not deducted from it.</Text>
                  </TextField>
                )}
              </>
            )}
            {(errorMessage || form.submitError) && (
              <Text accessibilityRole="alert" className="text-danger text-sm font-inter mt-3">{errorMessage || form.submitError}</Text>
            )}
          </View>

          <View className="flex-row justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => form.step === "confirm" ? form.setStep("form") : form.close(false)}
              isDisabled={isSubmitting}
            >
              <Button.Label>{form.step === "confirm" ? "Back" : "Cancel"}</Button.Label>
            </Button>
            <Button
              size="sm"
              onPress={() => { void form.submit(); }}
              isDisabled={isSubmitting}
              isIconOnly={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner color={accentForeground} />
              ) : (
                <Button.Label>{form.step === "confirm" ? "Confirm Resolve" : "Mark as Resolved"}</Button.Label>
              )}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
