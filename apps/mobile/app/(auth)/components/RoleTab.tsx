import { View } from 'react-native';
import { Tabs } from 'heroui-native';
import { IconKey, IconBuilding } from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';

import { useTranslation } from '@/hooks/i18n';

type RoleTabProps = {
  userSide: 'tenant' | 'landlord';
  onValueChange: (value: string) => void;
};

// Label font and selected/unselected colors come from the global
// `.tabs__label` rules in app/global.css. The icons sit beside each label
// (mirroring the web sign-up tabs) and set their colors explicitly, since
// RN icons cannot inherit the label's CSS color.
export default function RoleTab({ userSide, onValueChange }: RoleTabProps) {
  const { colors } = useColors();
  const { t } = useTranslation();

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
          <View className="flex-row items-center justify-center gap-1.5">
            <IconKey
              size={15}
              color={userSide === 'tenant' ? colors.primary : colors.textSecondary}
            />
            <Tabs.Label>{t("auth.role.tenant")}</Tabs.Label>
          </View>
        </Tabs.Trigger>

        <Tabs.Trigger value="landlord" className="flex-1">
          <View className="flex-row items-center justify-center gap-1.5">
            <IconBuilding
              size={15}
              color={userSide === 'landlord' ? colors.primary : colors.textSecondary}
            />
            <Tabs.Label>{t("auth.role.landlord")}</Tabs.Label>
          </View>
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
}
