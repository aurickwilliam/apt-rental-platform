import { useRouter } from "expo-router";

import { IconClipboardOff } from "@tabler/icons-react-native";

import { Button } from "heroui-native";

import EmptyState from "@/components/display/EmptyState";

export default function ApplicationsEmptyState() {
  const router = useRouter();

  return (
    <EmptyState
      className="flex-1 bg-background"
      icon={IconClipboardOff}
      title="No Applications Yet"
      description="You haven't applied to any apartment yet. Browse listings and submit an application to get started."
      action={
        <Button size="sm" onPress={() => router.push("/(tabs)/(tenant)/search")}>
          <Button.Label>Browse Listings</Button.Label>
        </Button>
      }
    />
  );
}
