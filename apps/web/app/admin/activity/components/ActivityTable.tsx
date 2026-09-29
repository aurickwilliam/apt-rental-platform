import Link from "next/link";
import { Table } from "@heroui/react";
import {
  activityDateFormatter,
  getAdminName,
  targetHref,
  type AdminActivityEvent,
} from "../lib/activity-display";

const MIN_ROWS = 10;

interface ActivityTableProps {
  events: AdminActivityEvent[];
}

export default function ActivityTable({ events }: ActivityTableProps) {
  const placeholderCount = Math.max(0, MIN_ROWS - events.length);
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Admin activity">
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column isRowHeader>Action</Table.Column>
              <Table.Column>Reviewed by</Table.Column>
              <Table.Column>Target</Table.Column>
              <Table.Column>Reason</Table.Column>
              <Table.Column>When</Table.Column>
            </Table.Header>
            <Table.Body>
              {events.map((event) => {
                const href = targetHref(event.target_type, event.target_id);
                return (
                  <Table.Row key={event.id} id={event.id}>
                    <Table.Cell>
                      <p className="font-nunito text-sm font-bold">
                        {event.action.replaceAll("_", " ")}
                      </p>
                    </Table.Cell>
                    <Table.Cell className="text-sm">
                      {getAdminName(event.admin)}
                    </Table.Cell>
                    <Table.Cell className="text-sm capitalize">
                      {href ? (
                        <Link
                          href={href}
                          className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {event.target_type}
                        </Link>
                      ) : (
                        event.target_type.replaceAll("_", " ")
                      )}
                    </Table.Cell>
                    <Table.Cell className="max-w-72 wrap-break-word text-sm text-muted-foreground">
                      {event.reason ?? "—"}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                      {activityDateFormatter.format(new Date(event.created_at))}
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
