import { Text, View } from "react-native";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { BottomSheet, Button, Spinner } from "heroui-native";
import { useRouter } from "expo-router";
import {
  financeMonthLabel,
  formatPesoDisplay,
  rentAgeBucket,
} from "@repo/utils";
import { useFinanceCollections } from "@/hooks/finance/useLandlordFinances";
import FinanceError from "./FinanceError";
import FinanceTabs from "./FinanceTabs";
import type {
  CollectionStatus,
  FinanceScope,
  RentLedgerRow,
} from "@/service/finance/financeService";

export default function CollectionLedgerSheet({
  ownerId,
  isOpen,
  scope,
  status,
  onChangeStatus,
  onClose,
}: {
  ownerId: string;
  /** HeroUI snaps a sheet open on a closed → open transition, so the caller keeps the sheet mounted. */
  isOpen: boolean;
  scope: FinanceScope;
  status: CollectionStatus | null;
  onChangeStatus: (status: CollectionStatus) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const activeStatus: CollectionStatus = status ?? "overdue";
  const query = useFinanceCollections(
    ownerId,
    scope,
    activeStatus,
    isOpen && status !== null,
  );
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];
  return (
    <BottomSheet
      isOpen={isOpen && status !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["80%"]} enableDynamicSizing={false}>
          <View className="pb-4 gap-3">
            <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
              Rent collections
            </BottomSheet.Title>
            <BottomSheet.Description className="font-inter text-sm text-muted">
              {financeMonthLabel(scope.month)} rent · status today
            </BottomSheet.Description>
            <FinanceTabs
              value={activeStatus}
              onChange={(value) => onChangeStatus(value as CollectionStatus)}
              options={[
                { value: "collected", label: "Collected" },
                { value: "pending", label: "Not due" },
                { value: "overdue", label: "Overdue" },
              ]}
            />
          </View>
          <BottomSheetFlatList<RentLedgerRow>
            data={rows}
            keyExtractor={(row) => row.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <View className="border border-border rounded-2xl p-3 gap-2 bg-surface">
                <Text className="font-nunitoBold text-base text-foreground">
                  {item.apartment_name}
                </Text>
                <Text className="font-inter text-sm text-foreground">
                  {item.tenant_name}
                </Text>
                <Text
                  selectable
                  className="font-nunitoBold text-lg text-accent"
                >
                  {formatPesoDisplay(
                    activeStatus === "collected"
                      ? item.collected
                      : item.outstanding,
                  )}
                </Text>
                <Text className="font-inter text-xs text-muted">
                  Due {item.due_date}
                  {activeStatus === "overdue"
                    ? ` · ${rentAgeBucket(item.days_late)} late`
                    : ""}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: "/landlord/manage-apartment/[apartmentId]",
                      params: { apartmentId: item.apartment_id },
                    });
                  }}
                >
                  <Button.Label>Open property & tenancy</Button.Label>
                </Button>
              </View>
            )}
            ListEmptyComponent={
              query.isLoading ? (
                <Spinner accessibilityLabel="Loading rent collections" />
              ) : query.error ? null : (
                <Text className="font-inter text-sm text-muted">
                  No rent in this category.
                </Text>
              )
            }
            ListFooterComponent={
              <View className="gap-3">
                {query.error && (
                  <FinanceError
                    onRetry={() => {
                      void query.refetch();
                    }}
                  />
                )}
                {query.hasNextPage && (
                  <Button
                    variant="secondary"
                    isDisabled={query.isFetchingNextPage}
                    onPress={() => {
                      void query.fetchNextPage();
                    }}
                  >
                    <Button.Label>
                      {query.isFetchingNextPage ? "Loading…" : "Load more"}
                    </Button.Label>
                  </Button>
                )}
                <Button variant="tertiary" onPress={onClose}>
                  <Button.Label>Close</Button.Label>
                </Button>
              </View>
            }
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
