import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  financeMonthFromParam,
  financeMonthLabel,
  manilaToday,
} from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import {
  FinanceCard,
  FinanceError,
} from "@/components/finance/FinanceControls";
import { PropertyPerformanceSkeleton } from "@/components/finance/FinanceSkeleton";
import PropertyPerformanceList, {
  PropertyPerformanceTabs,
  type PropertyPerformanceMetric,
} from "@/components/finance/PropertyPerformanceList";
import { useLandlordFinances } from "@/hooks/finance/useLandlordFinances";
import { useCurrentUser } from "@/hooks/auth";
import { financeErrorMessage } from "@/service/finance/financeService";

function PropertyPerformance() {
  const params = useLocalSearchParams<{ month?: string }>();
  const router = useRouter();
  const month = financeMonthFromParam(params.month, manilaToday().slice(0, 7));
  const finance = useLandlordFinances({ month, apartmentId: null });
  const data = finance.report.data;
  const [metric, setMetric] = useState<PropertyPerformanceMetric>("collected");
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  if (finance.userLoading || finance.report.isLoading)
    return (
      <ScreenWrapper
        header={
          <StandardHeader title="Property performance" onBackPress={close} />
        }
        scrollable
        className="p-5"
      >
        <PropertyPerformanceSkeleton />
      </ScreenWrapper>
    );
  if (
    finance.userError ||
    !finance.enabled ||
    finance.report.error ||
    !data ||
    !data.properties.length
  )
    return (
      <ScreenWrapper
        header={
          <StandardHeader title="Property performance" onBackPress={close} />
        }
        className="p-5"
      >
        <FinanceError
          message={
            !finance.enabled
              ? "Switch to your landlord portal to compare property performance."
              : data && !data.properties.length
                ? "Add a property before comparing performance."
                : financeErrorMessage(finance.report.error ?? finance.userError)
          }
          onRetry={() => {
            void finance.retry();
          }}
        />
      </ScreenWrapper>
    );
  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Property performance" onBackPress={close} />
      }
      scrollable
      className="p-5 gap-5"
    >
      <View>
        <Text className="font-nunitoBold text-xl text-foreground">
          All properties
        </Text>
        <Text
          accessibilityLabel={`Report month: ${financeMonthLabel(month)}`}
          className="font-inter text-sm text-muted"
        >
          {financeMonthLabel(month)}
        </Text>
      </View>
      <PropertyPerformanceTabs value={metric} onChange={setMetric} />
      <FinanceCard>
        <PropertyPerformanceList
          properties={data.performance}
          metric={metric}
          onSelect={(apartmentId) =>
            router.dismissTo({
              pathname: "/landlord/analytics",
              params: { month, apartmentId },
            })
          }
        />
      </FinanceCard>
    </ScreenWrapper>
  );
}

export default function PropertyPerformanceScreen() {
  const user = useCurrentUser();
  // Account switches discard financial filters, open forms and sensitive drafts.
  return <PropertyPerformance key={user.data?.id ?? "signed-out"} />;
}
