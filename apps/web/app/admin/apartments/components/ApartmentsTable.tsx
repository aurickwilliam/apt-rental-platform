import { Table } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import { statusToneFor } from "@/lib/status-tone";
import {
  IconEye,
  IconEyeOff,
  IconShieldCheckFilled,
  IconShieldX,
} from "@tabler/icons-react";
import { sortDescriptorFor, sortForColumn } from "@/lib/admin-filters";
import ApartmentThumbnail from "./ApartmentThumbnail";
import {
  joinedFormatter,
  rentFormatter,
  verificationChipColor,
  visibilityChipColor,
  type AdminApartment,
} from "../lib/apartment-display";
import {
  APARTMENT_SORT_OPTIONS,
  type ApartmentSort,
} from "../lib/apartment-filters";

const MIN_ROWS = 10;

interface ApartmentsTableProps {
  apartments: AdminApartment[];
  sort: ApartmentSort;
  onSortChange: (sort: ApartmentSort) => void;
  onSelectApartment: (id: string) => void;
}

export default function ApartmentsTable({
  apartments,
  sort,
  onSortChange,
  onSelectApartment,
}: ApartmentsTableProps) {
  const placeholderCount = Math.max(0, MIN_ROWS - apartments.length);
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Apartments"
            sortDescriptor={sortDescriptorFor(APARTMENT_SORT_OPTIONS, sort)}
            onSortChange={({ column, direction }) => {
              const next = sortForColumn(
                APARTMENT_SORT_OPTIONS,
                String(column),
                direction,
              );
              if (next) onSortChange(next);
            }}
            onRowAction={(key) => {
              const selected = apartments.find(
                (apartment) => apartment.id === String(key),
              );
              if (selected) {
                onSelectApartment(selected.id);
              }
            }}
          >
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column id="apartment" isRowHeader allowsSorting>
                {({ sortDirection }) => (
                  <Table.SortableColumnHeader sortDirection={sortDirection}>
                    Apartment
                  </Table.SortableColumnHeader>
                )}
              </Table.Column>
              <Table.Column id="rent" allowsSorting>
                {({ sortDirection }) => (
                  <Table.SortableColumnHeader sortDirection={sortDirection}>
                    Rent
                  </Table.SortableColumnHeader>
                )}
              </Table.Column>
              <Table.Column id="status">Status</Table.Column>
              <Table.Column id="verification">Verification</Table.Column>
              <Table.Column id="visibility">Visibility</Table.Column>
              <Table.Column id="joined" allowsSorting>
                {({ sortDirection }) => (
                  <Table.SortableColumnHeader sortDirection={sortDirection}>
                    Joined
                  </Table.SortableColumnHeader>
                )}
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {apartments.map((apartment) => {
                return (
                  <Table.Row
                    key={apartment.id}
                    id={apartment.id}
                    onClick={() => onSelectApartment(apartment.id)}
                    className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                  >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <ApartmentThumbnail url={apartment.thumbnail_url} />
                      <div className="min-w-0">
                        <p className="font-nunito text-sm font-bold">
                          {apartment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apartment.city}
                        </p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm tabular-nums">
                    {rentFormatter.format(apartment.monthly_rent)}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusChip
                      size="sm"
                      tone={statusToneFor(apartment.status)}
                      className="capitalize"
                    >
                      {apartment.status.replaceAll("_", " ")}
                    </StatusChip>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusChip
                      size="sm"
                      tone={verificationChipColor(apartment.is_verified)}
                    >
                      {apartment.is_verified ? (
                        <IconShieldCheckFilled size={14} aria-hidden="true" />
                      ) : (
                        <IconShieldX size={14} aria-hidden="true" />
                      )}
                      {apartment.is_verified ? "Verified" : "Unverified"}
                    </StatusChip>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusChip
                      size="sm"
                      tone={visibilityChipColor(apartment.is_hidden_by_admin)}
                    >
                      {apartment.is_hidden_by_admin ? (
                        <IconEyeOff size={14} aria-hidden="true" />
                      ) : (
                        <IconEye size={14} aria-hidden="true" />
                      )}
                      {apartment.is_hidden_by_admin ? "Hidden" : "Visible"}
                    </StatusChip>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                    {joinedFormatter.format(new Date(apartment.created_at))}
                  </Table.Cell>
                </Table.Row>
                );
              })}
              {Array.from({ length: placeholderCount }, (_, index) => (
                <Table.Row
                  key={`placeholder-${index}`}
                  id={`placeholder-${index}`}
                  aria-hidden="true"
                  className="h-14"
                >
                  <Table.Cell>&nbsp;</Table.Cell>
                  <Table.Cell>&nbsp;</Table.Cell>
                  <Table.Cell>&nbsp;</Table.Cell>
                  <Table.Cell>&nbsp;</Table.Cell>
                  <Table.Cell>&nbsp;</Table.Cell>
                  <Table.Cell>&nbsp;</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
