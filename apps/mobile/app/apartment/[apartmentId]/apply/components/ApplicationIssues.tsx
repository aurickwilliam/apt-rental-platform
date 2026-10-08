import { Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { Button } from "heroui-native";

import { IconAlertTriangle } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import type { ApplicationIssue } from "@/service/applications/applicationReadiness";

function actionFor(issue: ApplicationIssue): { label: string; href: Href } | null {
  switch (issue.code) {
    case "unverified":
      return { label: "Verify account", href: "/(auth)/verify-account" as Href };
    case "passport-missing":
      return { label: "Add to APT Passport", href: "/document-id/select-document" as Href };
    case "passport-expired":
      return { label: "Open APT Passport", href: "/document-id" as Href };
    default:
      return null;
  }
}

/** Blocking problems that stop the tenant from applying, each with a fix action. */
export default function ApplicationIssues({ issues }: { issues: ApplicationIssue[] }) {
  const router = useRouter();
  const { colors } = useColors();

  if (issues.length === 0) return null;

  return (
    <View className="gap-3">
      {issues.map((issue) => {
        const action = actionFor(issue);
        return (
          <View
            key={issue.code}
            className="bg-danger/10 border border-danger/20 rounded-2xl p-3 gap-2"
          >
            <View className="flex-row gap-2">
              <IconAlertTriangle size={18} color={colors.danger} />
              <Text className="flex-1 text-foreground text-sm font-inter leading-snug">
                {issue.message}
              </Text>
            </View>
            {action ? (
              <Button
                size="sm"
                variant="danger-soft"
                onPress={() => router.push(action.href)}
                accessibilityLabel={action.label}
              >
                <Button.Label className="font-nunitoSemiBold">{action.label}</Button.Label>
              </Button>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
