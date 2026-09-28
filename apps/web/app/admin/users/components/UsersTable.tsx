import { Chip, Table } from "@heroui/react";
import UserAvatar from "./UserAvatar";
import {
  formatRoles,
  getUserName,
  joinedFormatter,
  verificationChipColor,
  type AdminUser,
} from "../lib/user-display";

const MIN_ROWS = 10;

interface UsersTableProps {
  users: AdminUser[];
  onSelectUser: (id: string) => void;
}

export default function UsersTable({ users, onSelectUser }: UsersTableProps) {
  const placeholderCount = Math.max(0, MIN_ROWS - users.length);
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Users"
            onRowAction={(key) => {
              const selected = users.find((user) => user.id === String(key));
              if (selected) {
                onSelectUser(selected.id);
              }
            }}
          >
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column isRowHeader>User</Table.Column>
              <Table.Column>Role</Table.Column>
              <Table.Column>Verification</Table.Column>
              <Table.Column>Joined</Table.Column>
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
                          <p className="max-w-48 truncate font-nunito text-sm font-bold">
                            {name}
                          </p>
                          <p className="max-w-48 truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-sm">
                      {formatRoles(user.roles)}
                    </Table.Cell>
                    <Table.Cell>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={verificationChipColor(user.account_status)}
                        className="capitalize"
                      >
                        {user.account_status}
                      </Chip>
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
