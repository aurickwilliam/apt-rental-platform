"use client";

import { useState } from "react";
import { Card, Separator } from "@heroui/react";
import { Banknote } from "lucide-react";
import type { CardInformation, PaymentMethod, SelectedPaymentMethod } from "../types";
import type { CardFormErrors } from "@repo/utils";
import type { CashPaymentErrors } from "../types";
import { PAYMENT_METHODS, SAVED_PAYMENT_METHODS } from "../constants";
import PaymentMethodButton from "./PaymentMethodButton";
import CardPaymentForm from "./CardPaymentForm";
import CashPaymentForm from "./CashPaymentForm";

interface PaymentMethodSelectorProps {
  onPaymentMethodChange: (method: PaymentMethod | null) => void;
  cardInformation: CardInformation;
  onCardInformationChange: (patch: Partial<CardInformation>) => void;
  cardErrors?: CardFormErrors;
  cashPaymentDate: Date | null;
  onCashPaymentDateChange: (date: Date) => void;
  cashErrors?: CashPaymentErrors;
  showSaved?: boolean;
}

export default function PaymentMethodSelector({
  onPaymentMethodChange,
  cardInformation,
  onCardInformationChange,
  cardErrors,
  cashPaymentDate,
  onCashPaymentDateChange,
  cashErrors,
  showSaved = false,
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<SelectedPaymentMethod>(null);

  const isNewSelected = (method: PaymentMethod) => selected?.kind === "new" && selected.method === method;
  const isSavedSelected = (id: string) => selected?.kind === "saved" && selected.id === id;

  const selectNew = (method: PaymentMethod) => {
    setSelected({ kind: "new", method });
    onPaymentMethodChange(method);
  };
  const selectSaved = (id: string, method: PaymentMethod) => {
    setSelected({ kind: "saved", id, method });
    onPaymentMethodChange(method);
  };

  const activeMethod = selected ? selected.method : null;
  const showCardForm = selected?.kind === "new" && activeMethod === "Debit/Credit-Card";
  const showCashForm = selected?.kind === "new" && activeMethod === "Cash";

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-nunito font-semibold text-zinc-900 dark:text-zinc-100">Choose Payment Method</h3>
        <p className="text-sm text-zinc-500">Select how you&apos;d like to pay this month&apos;s rent.</p>
      </div>

      <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        <Card.Content className="p-4">
          {showSaved && (
            <>
              <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Saved</p>
              <div className="flex flex-wrap gap-2">
                {SAVED_PAYMENT_METHODS.map((m) => (
                  <PaymentMethodButton
                    key={m.id}
                    variant="chip"
                    imageSrc={m.src}
                    label={m.label}
                    selected={isSavedSelected(m.id)}
                    onPress={() => selectSaved(m.id, m.method)}
                  />
                ))}
              </div>
              <Separator className="my-4" />
            </>
          )}

          <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            {showSaved ? "Or use a new method" : "Use a new method"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
            {PAYMENT_METHODS.map((m) => {
              if (m.key === "Cash") {
                return (
                  <PaymentMethodButton
                    key={m.key}
                    variant="tile"
                    icon={<Banknote size={28} className="text-green-600" />}
                    label="Cash"
                    selected={isNewSelected("Cash")}
                    onPress={() => selectNew("Cash")}
                  />
                );
              }
              return (
                <PaymentMethodButton
                  key={m.key}
                  variant="tile"
                  imageSrc={"tileSrc" in m ? (m as { tileSrc: string }).tileSrc : undefined}
                  imageSrcs={"tileSrcs" in m ? [...((m as { tileSrcs: readonly string[] }).tileSrcs)] : undefined}
                  label={m.label}
                  selected={isNewSelected(m.key as PaymentMethod)}
                  onPress={() => selectNew(m.key as PaymentMethod)}
                />
              );
            })}
          </div>

          {showCardForm && (
            <CardPaymentForm value={cardInformation} onChange={onCardInformationChange} errors={cardErrors} />
          )}
          {showCashForm && (
            <CashPaymentForm paymentDate={cashPaymentDate} onPaymentDateChange={onCashPaymentDateChange} errors={cashErrors} />
          )}
        </Card.Content>
      </Card>
    </div>
  );
}



