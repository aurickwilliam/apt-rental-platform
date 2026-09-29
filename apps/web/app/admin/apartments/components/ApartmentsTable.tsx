import { Chip, Table } from "@heroui/react";
import {
  IconEye,
  IconEyeOff,
  IconShieldCheckFilled,
  IconShieldX,
} from "@tabler/icons-react";
import ApartmentThumbnail from "./ApartmentThumbnail";
import {
  joinedFormatter,
  statusChipStyle,
  verificationChipColor,
  visibilityChipColor,
  type AdminApartment,
} from "../lib/apartment-display";

const MIN_ROWS = 10;

interface ApartmentsTableProps {
  apartments: AdminApartment[];
  onSelectApartment: (id: string) => void;
}

export default function ApartmentsTable({
  apartments,
  onSelectApartment,
}: ApartmentsTableProps) {
  const placeholderCount = Math.max(0, MIN_ROWS - apartments.length);
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Apartments"
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
              <Table.Column isRowHeader>Apartment</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>Verification</Table.Column>
              <Table.Column>Visibility</Table.Column>
              <Table.Column>Joined</Table.Column>
            </Table.Header>
            <Table.Body>
              {apartments.map((apartment) => {
                const statusStyle = statusChipStyle(apartment.status);
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
                  <Table.Cell>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={statusStyle.color}
                      className={`capitalize ${statusStyle.className ?? ""}`}
                    >
                      {apartment.status.replaceAll("_", " ")}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={verificationChipColor(apartment.is_verified)}
                    >
                      {apartment.is_verified ? (
                        <IconShieldCheckFilled size={14} aria-hidden="true" />
                      ) : (
                        <IconShieldX size={14} aria-hidden="true" />
                      )}
                      {apartment.is_verified ? "Verified" : "Unverified"}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={visibilityChipColor(apartment.is_hidden_by_admin)}
                    >
                      {apartment.is_hidden_by_admin ? (
                        <IconEyeOff size={14} aria-hidden="true" />
                      ) : (
                        <IconEye size={14} aria-hidden="true" />
                      )}
                      {apartment.is_hidden_by_admin ? "Hidden" : "Visible"}
                    </Chip>
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
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
