import { Table } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import { sortDescriptorFor, sortForColumn } from "@/lib/admin-filters";
import UserAvatar from "./UserAvatar";
import {
  formatRoles,
  getUserName,
  joinedFormatter,
  verificationChipColor,
  type AdminUser,
} from "../lib/user-display";
import { USER_SORT_OPTIONS, type UserSort } from "../lib/user-filters";

const MIN_ROWS = 10;

interface UsersTableProps {
  users: AdminUser[];
  sort: UserSort;
  onSortChange: (sort: UserSort) => void;
  onSelectUser: (id: string) => void;
}

export default function UsersTable({
  users,
  sort,
  onSortChange,
  onSelectUser,
}: UsersTableProps) {
  const placeholderCount = Math.max(0, MIN_ROWS - users.length);
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Users"
            sortDescriptor={sortDescriptorFor(USER_SORT_OPTIONS, sort)}
            onSortChange={({ column, direction }) => {
              const next = sortForColumn(
                USER_SORT_OPTIONS,
                String(column),
                direction,
              );
              if (next) onSortChange(next);
            }}
            onRowAction={(key) => {
              const selected = users.find((user) => user.id === String(key));
              if (selected) {
                onSelectUser(selected.id);
              }
            }}
          >
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column id="user" isRowHeader allowsSorting>
                {({ sortDirection }) => (
                  <Table.SortableColumnHeader sortDirection={sortDirection}>
                    User
                  </Table.SortableColumnHeader>
                )}
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="verification">Verification</Table.Column>
              <Table.Column id="joined" allowsSorting>
                {({ sortDirection }) => (
                  <Table.SortableColumnHeader sortDirection={sortDirection}>
                    Joined
                  </Table.SortableColumnHeader>
                )}
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {users.map((user) => {
                const name = getUserName(user);
                return (
                  <Table.Row
                    key={user.id}
                    id={user.id}
                    onClick={() => onSelectUser(user.id)}
                    className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                  >
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} name={name} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-nunito text-sm font-bold">
                            {name}
                            {user.is_suspended ? (
                              <StatusChip
                                size="sm"
                                tone="danger"
                                className="text-[11px]"
                              >
                                Suspended
                              </StatusChip>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-sm">
                      {formatRoles(user.roles)}
                    </Table.Cell>
                    <Table.Cell>
                      <StatusChip
                        size="sm"
                        tone={verificationChipColor(user.account_status)}
                        className="capitalize"
                      >
                        {user.account_status}
                      </StatusChip>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                      {joinedFormatter.format(new Date(user.created_at))}
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
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
