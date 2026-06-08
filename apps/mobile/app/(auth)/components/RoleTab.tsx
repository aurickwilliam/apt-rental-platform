import { Tabs } from 'heroui-native';

import { COLORS } from "@repo/constants";

type RoleTabProps = {
  userSide: "tenant" | "landlord";
  onValueChange: (value: string) => void;
}

export default function RoleTab({
  userSide,
  onValueChange,
}: RoleTabProps) {
  return (
    <Tabs
      value={userSide}
      onValueChange={onValueChange}
      variant="primary"
      className="mt-5"
    >
      <Tabs.List className="w-full">
        <Tabs.Indicator />

        <Tabs.Trigger value="tenant" className="flex-1">
          {({ isSelected }) => (
            <Tabs.Label
              style={{ color: isSelected ? COLORS.primary : COLORS.grey }}
            >
              Tenant
            </Tabs.Label>
          )}
        </Tabs.Trigger>

        <Tabs.Trigger value="landlord" className="flex-1">
          {({ isSelected }) => (
            <Tabs.Label
              style={{ color: isSelected ? COLORS.secondary : COLORS.grey }}
            >
              Landlord
            </Tabs.Label>
          )}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  )
}