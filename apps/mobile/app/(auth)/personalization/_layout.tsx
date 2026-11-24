import { Stack } from 'expo-router';

import { useTranslation } from '@/hooks/i18n';

export default function PersonalizationLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="step-one"
        options={{
          title: t("authMobile.personalization.title")
        }}
      />
      <Stack.Screen
        name="step-two"
        options={{
          title: t("authMobile.personalization.title")
        }}
      />
      <Stack.Screen
        name="step-three"
        options={{
          title: t("authMobile.personalization.title")
        }}
      />
      <Stack.Screen
        name="step-four"
        options={{
          title: t("authMobile.personalization.title")
        }}
      />
      <Stack.Screen
        name="step-five"
        options={{
          title: t("authMobile.personalization.title")
        }}
      />
    </Stack>
  );
}
