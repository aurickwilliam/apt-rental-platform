"use client";

import { Fragment } from "react";
import { IconBuilding, IconFileText, IconUsers } from "@tabler/icons-react";
import { Badge, Separator, Tabs } from "@heroui/react";
import {
  parseVerificationQueue,
  type VerificationQueue,
} from "../lib/verification-display";

interface VerificationTabsProps {
  selected: VerificationQueue;
  onSelect: (queue: VerificationQueue) => void;
  userCount: number;
  apartmentCount: number;
  documentCount: number;
}

export default function VerificationTabs({
  selected,
  onSelect,
  userCount,
  apartmentCount,
  documentCount,
}: VerificationTabsProps) {
  return (
    <Tabs
      selectedKey={selected}
      onSelectionChange={(key) => onSelect(parseVerificationQueue(String(key)))}
      className="w-fit"
    >
      <Tabs.ListContainer className="w-fit">
        <Tabs.List
          aria-label="Verification queues"
          className="w-fit *:text-muted-foreground"
        >
          {(
            [
              ["users", "Users", userCount, IconUsers],
              ["apartments", "Apartments", apartmentCount, IconBuilding],
              ["documents", "Documents", documentCount, IconFileText],
            ] as const
          ).map(([value, label, count, Icon], index) => (
            <Fragment key={value}>
              {index > 0 ? (
                <Separator
                  orientation="vertical"
                  className="mx-2 self-stretch"
                />
              ) : null}
              <Tabs.Tab
                key={value}
                id={value}
                className="relative cursor-pointer font-nunito font-semibold whitespace-nowrap text-sm data-[selected=true]:text-primary"
              >
                <span className="flex items-center gap-1.5 px-2">
                <Icon size={14} aria-hidden="true" />
                {label}
              </span>
                {count > 0 ? (
                  <Badge color="danger" size="sm" placement="top-right">
                    {count}
                  </Badge>
                ) : null}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Fragment>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
