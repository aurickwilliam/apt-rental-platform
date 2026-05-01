"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

import {
  FileText,
  Download,
  CreditCard,
  Wrench,
  MessageCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

import {
  APP_STEPS,
  MAINTENANCE_ITEMS,
  MESSAGES,
  PAYMENT_HISTORY,
  PENDING_PAYMENT,
} from "./constants";

import type { MaintenanceStatus, PaymentStatus } from "./types";
import { formatCurrency } from "@repo/utils";

import DashboardCard from "./components/DashboardCard";
import StatusChip from "./components/StatusChip";
import PaymentModal from "./components/PaymentModal";
import MiniCalendar from "./components/MiniCalendar";

function statusBadge(status: PaymentStatus) {
  if (status === "paid") return <StatusChip variant="success">Paid</StatusChip>;
  if (status === "late") return <StatusChip variant="danger">Late</StatusChip>;
  return <StatusChip variant="warning">Pending</StatusChip>;
}

function maintenanceBadge(status: MaintenanceStatus) {
  if (status === "in_progress") return <StatusChip variant="warning">In progress</StatusChip>;
  if (status === "resolved") return <StatusChip variant="success">Done</StatusChip>;
  return <StatusChip variant="neutral">Pending</StatusChip>;
}

export default function MyRental() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Thursday, April 24</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Good morning, Juan</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Unit 3B · Caloocan Heights, Caloocan City</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <DashboardCard>
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-1">Next payment</p>
          <p className="text-xl font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(8500)}</p>
          <div className="mt-1.5"><StatusChip variant="warning">Due in 7 days</StatusChip></div>
        </DashboardCard>
        <DashboardCard>
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-1">Lease ends</p>
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">Dec 31, 2025</p>
          <p className="text-xs text-zinc-500 mt-1">8 months remaining</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-1">Open requests</p>
          <p className="text-xl font-medium text-zinc-900 dark:text-zinc-100">2</p>
          <p className="text-xs text-zinc-500 mt-1">1 in progress</p>
        </DashboardCard>
      </div>

      {/* Payment + Calendar */}
      <div className="grid grid-cols-3 gap-2.5">
        <DashboardCard className="col-span-2">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-1">Pending payment</p>
          <p className="text-3xl font-medium text-primary dark:text-zinc-100 mt-1">₱{formatCurrency(PENDING_PAYMENT.total)}<span className="text-sm font-normal text-zinc-400">.00</span></p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <StatusChip variant="neutral">Monthly rent</StatusChip>
            <StatusChip variant="neutral">{PENDING_PAYMENT.month}</StatusChip>
            <StatusChip variant="warning">Due {PENDING_PAYMENT.dueDate}</StatusChip>
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {PENDING_PAYMENT.breakdown.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-zinc-400">{item.label}</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">₱{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
          <Button
            color="primary"
            className="mt-5 w-fit"
            startContent={<CreditCard size={14} />}
            onPress={() => setShowPaymentModal(true)}
          >
            Pay now
          </Button>
        </DashboardCard>
        <MiniCalendar />
      </div>

      {/* Maintenance + Messages */}
      <div className="grid grid-cols-2 gap-2.5">
        <DashboardCard>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Maintenance updates
          </h2>
          <div className="space-y-0">
            {MAINTENANCE_ITEMS.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  item.status === "in_progress" ? "bg-blue-50 dark:bg-blue-950" :
                  item.status === "resolved" ? "bg-green-50 dark:bg-green-950" :
                  "bg-zinc-100 dark:bg-zinc-800"
                }`}>
                  {item.status === "resolved" ? <CheckCircle2 size={12} className="text-green-600" /> :
                   item.status === "in_progress" ? <Wrench size={12} className="text-blue-600" /> :
                   <Clock size={12} className="text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</p>
                </div>
                {maintenanceBadge(item.status)}
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Messages{" "}
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-1 align-middle" />
          </h2>
          <div className="space-y-0">
            {MESSAGES.map((msg) => (
              <div key={msg.id} className="flex items-center gap-2.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  msg.unread ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                }`}>
                  {msg.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1 leading-tight">
                    {msg.sender}
                    {msg.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{msg.preview}</p>
                </div>
                <span className="text-[11px] text-zinc-400 shrink-0">{msg.time}</span>
              </div>
            ))}
          </div>
          <Button
            variant="light"
            className="mt-3 w-full justify-between text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            endContent={<ChevronRight size={13} />}
          >
            <span className="flex items-center gap-1.5"><MessageCircle size={13} />View all messages</span>
          </Button>
        </DashboardCard>
      </div>

      {/* Application status + Lease */}
      <div className="grid grid-cols-2 gap-2.5">
        <DashboardCard>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Application status
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <StatusChip variant="warning">Under review</StatusChip>
            <span className="text-xs text-zinc-400">Unit 5A · Submitted Apr 20</span>
          </div>
          <div>
            {APP_STEPS.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                    step.status === "done" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                    step.status === "active" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                    "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}>
                    {step.status === "done" ? "✓" : step.status === "active" ? <ArrowRight size={9} /> : i + 1}
                  </div>
                  <span className={`text-sm ${
                    step.status === "done" ? "text-zinc-900 dark:text-zinc-100" :
                    step.status === "active" ? "text-amber-700 dark:text-amber-300 font-medium" :
                    "text-zinc-400"
                  }`}>
                    {step.label}
                  </span>
                  {step.status === "active" && (
                    <span className="ml-auto text-[11px] text-zinc-400">In progress</span>
                  )}
                </div>
                {i < APP_STEPS.length - 1 && (
                  <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 ml-2.5 my-0.5" />
                )}
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard className="flex flex-col">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Lease agreement
          </h2>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2.5 mb-3">
            <p className="text-[11px] text-zinc-400 mb-0.5">Active lease</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Unit 3B — 1 year term</p>
            <p className="text-xs text-zinc-500">Jan 1 – Dec 31, 2025</p>
          </div>
          <Button variant="flat" className="w-full justify-start" startContent={<FileText size={14} />}>
            View lease PDF
          </Button>
          <Button variant="flat" className="mt-2 w-full justify-start" startContent={<Download size={14} />}>
            Download copy
          </Button>
          <div className="mt-auto pt-3 flex items-center gap-2">
            <StatusChip variant="success">Active</StatusChip>
            <span className="text-[11px] text-zinc-400">Signed Jan 1, 2025</span>
          </div>
        </DashboardCard>
      </div>

      {/* Payment history */}
      <DashboardCard>
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
          Payment history
        </h2>
        <div className="space-y-0">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center text-[11px] text-zinc-400 font-medium uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span>Date</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>
          {PAYMENT_HISTORY.map((row) => (
            <div key={row.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 text-sm">
              <span className="text-zinc-400 text-xs min-w-20">{row.date}</span>
              <span className="text-zinc-700 dark:text-zinc-300 text-xs">{row.description}</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium text-right">₱{formatCurrency(row.amount)}</span>
              <div className="text-right">{statusBadge(row.status)}</div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Payment modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onConfirm={() => {
          setShowPaymentModal(false);
          // TODO: trigger Supabase payment flow
        }}
      />
    </div>
  );
}
