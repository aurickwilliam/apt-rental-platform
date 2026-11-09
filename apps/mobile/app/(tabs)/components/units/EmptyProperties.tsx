import { IconBuilding, IconCirclePlus } from "@tabler/icons-react-native";

import { Button } from "heroui-native";

import EmptyState from "@/components/display/EmptyState";

type Props = {
  onAdd: () => void;
};

export default function EmptyProperties({ onAdd }: Props) {
  return (
    <EmptyState
      icon={IconBuilding}
      title="No properties yet"
      description="Add your first property to start managing your rentals."
      action={
        <Button size="sm" onPress={onAdd}>
          <IconCirclePlus size={16} color="#FFFFFF" />
          <Button.Label>Add Property</Button.Label>
        </Button>
      }
    />
  );
}
