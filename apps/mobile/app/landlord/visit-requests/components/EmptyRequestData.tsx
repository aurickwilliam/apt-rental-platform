import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

import { IconFileX } from "@tabler/icons-react-native";

import EmptyState from "@/components/display/EmptyState";

export default function EmptyRequestData() {
  return (
    <ScreenWrapper header={<StandardHeader title="Visit Request" />}>
      <EmptyState
        className="flex-1"
        icon={IconFileX}
        title="Visit request not found"
        description="Please return to the visit request list."
      />
    </ScreenWrapper>
  );
}
