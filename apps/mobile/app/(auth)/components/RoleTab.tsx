import { Tabs } from 'heroui-native';

type RoleTabProps = {
  userSide: 'tenant' | 'landlord';
  onValueChange: (value: string) => void;
};

// Label font and selected/unselected colors come from the global
// `.tabs__label` rules in app/global.css.
export default function RoleTab({ userSide, onValueChange }: RoleTabProps) {
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
          <Tabs.Label>Tenant</Tabs.Label>
        </Tabs.Trigger>

        <Tabs.Trigger value="landlord" className="flex-1">
          <Tabs.Label>Landlord</Tabs.Label>
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
}
