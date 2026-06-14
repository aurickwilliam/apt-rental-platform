import { Tabs } from 'heroui-native';

type RoleTabProps = {
  userSide: 'tenant' | 'landlord';
  onValueChange: (value: string) => void;
};

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
          {({ isSelected }) => (
            <Tabs.Label
              className={
                isSelected
                  ? 'text-primary dark:text-dark-primary'
                  : 'text-gray-500 dark:text-dark-gray-400'
              }
            >
              Tenant
            </Tabs.Label>
          )}
        </Tabs.Trigger>

        <Tabs.Trigger value="landlord" className="flex-1">
          {({ isSelected }) => (
            <Tabs.Label
              className={
                isSelected
                  ? 'text-secondary dark:text-secondary'
                  : 'text-gray-500 dark:text-dark-gray-400'
              }
            >
              Landlord
            </Tabs.Label>
          )}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
}