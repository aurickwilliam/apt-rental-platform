"use client";

import { Avatar, Card, Chip } from "@heroui/react";
import { Calendar, Clock } from "lucide-react";
import { formatDate, formatFullName, formatTime, getInitials } from "@repo/utils";

import type { LandlordVisitRequest } from "@/service/landlordVisitRequestsService";
import { getVisitStatusChipColor, getVisitStatusLabel } from "../lib/visit-status-styles";

type Props = {
  request: LandlordVisitRequest;
  onPress?: () => void;
  useResolvedSchedule?: boolean;
};

export default function VisitRequestCard({ request, onPress, useResolvedSchedule }: Props) {
  const tenantName =
    formatFullName({ first_name: request.tenant.first_name, last_name: request.tenant.last_name }) ||
    "Unknown tenant";
  const scheduleDate = useResolvedSchedule ? request.resolved_visit_date : request.visit_date;
  const scheduleTime = useResolvedSchedule ? request.resolved_visit_time : request.time;

  return (
    <button type="button" onClick={onPress} className="block w-full text-left">
      <Card className="border border-border bg-card text-card-foreground shadow-none rounded-2xl hover:border-primary/30 transition-colors">
        <Card.Content className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="md" className="shrink-0">
              {request.tenant.avatar_url ? (
                <img src={request.tenant.avatar_url} alt={tenantName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{getInitials(tenantName)}</span>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground truncate">{tenantName}</p>
              <p className="text-xs text-muted-foreground truncate">{request.apartment.name}</p>
            </div>
            <Chip size="sm" variant="soft" color={getVisitStatusChipColor(request.status)} className="capitalize shrink-0">
              {getVisitStatusLabel(request.status)}
            </Chip>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formatDate(scheduleDate, "medium")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatTime(scheduleTime)}
            </span>
          </div>
        </Card.Content>
      </Card>
    </button>
  );
}
