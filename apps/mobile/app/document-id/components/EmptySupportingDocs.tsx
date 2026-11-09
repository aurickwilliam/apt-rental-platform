import { Button } from "heroui-native";

import { IconFileUpload, IconPlus } from "@tabler/icons-react-native";

import EmptyState from "@/components/display/EmptyState";

interface EmptySupportingDocsProps {
  onAddDocument: () => void;
}

/**
 * Section-level empty state for the supporting documents grid: the wallet
 * holds the verified ID but no supporting documents yet. Compact by design —
 * the full-wallet empty state lives in the screen itself.
 */
export default function EmptySupportingDocs({
  onAddDocument,
}: EmptySupportingDocsProps) {
  return (
    <EmptyState
      className="py-10"
      icon={IconFileUpload}
      title="No supporting documents yet"
      description="Add payslips, billing statements, or clearances so they're ready when you apply for an apartment."
      action={
        <Button size="sm" onPress={onAddDocument}>
          <IconPlus size={16} color="#FFFFFF" />
          <Button.Label className="text-white font-nunitoSemiBold">
            Add a Document
          </Button.Label>
        </Button>
      }
    />
  );
}
