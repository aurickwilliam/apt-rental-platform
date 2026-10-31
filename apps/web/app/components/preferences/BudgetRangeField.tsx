"use client";

import { useImperativeHandle, useState, forwardRef } from "react";
import type { ReactNode } from "react";
import { InputGroup, Label, Button } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

import {
  BUDGET_CUSTOM_ID,
  BUDGET_PRESETS,
  PREFERENCE_BUDGET_MAX,
  PREFERENCE_BUDGET_MIN,
  matchBudgetPreset,
  orderBudgetRange,
  parseBudgetDraftAmount,
} from "@/lib/tenant-preferences";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import SettingsSelect from "../settings/SettingsSelect";

// Marks a card choice the user cleared on purpose, so the saved values
// are not used to pick a card again.
const BUDGET_NONE_ID = "none";

// Selectable option card shared by the onboarding wizard and the Settings
// rental-preferences editor. Native button semantics keep keyboard
// interaction free.
export function PreferenceOptionCard({
  selected,
  onPress,
  label,
  icon,
  className = "",
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      aria-pressed={selected}
      onClick={onPress}
      className={`button--bare flex min-h-16 items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40"
      } ${className}`}
    >
      {icon && (
        <span className="shrink-0 text-primary" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary text-white" : "border-border text-transparent"
        }`}
      >
        <IconCheck size={13} />
      </span>
    </Button>
  );
}

export interface BudgetRangeFieldHandle {
  /** Flush pending typed drafts into the range. False when invalid. */
  commit: () => boolean;
}

interface BudgetRangeFieldProps {
  budgetMin: number;
  budgetMax: number;
  onRangeChange: (min: number, max: number) => void;
  /**
   * When true, the initial card resolves from the current values (exact
   * preset or custom) — for editors prefilled with saved preferences. When
   * false, cards start unselected until the user picks deliberately
   * (onboarding fresh-user behavior).
   */
  resolveInitialSelection?: boolean;
  /** Prefix for the min/max input ids (defaults to "budget"). */
  idPrefix?: string;
  /**
   * "cards" renders the full preset-card grid (onboarding). "compact"
   * renders the current value plus a preset dropdown, revealing the custom
   * inputs only for custom ranges. Same values, same commit semantics.
   */
  layout?: "cards" | "compact";
}

// Budget preset cards + Custom Range numeric inputs. Drafts stay local while
// typing and commit (step-snapped + clamped) on blur or Enter, so partial
// input is never clobbered. Out-of-range sides resolve against each other,
// so the minimum can never exceed the maximum.
const BudgetRangeField = forwardRef<BudgetRangeFieldHandle, BudgetRangeFieldProps>(
  function BudgetRangeField(
    { budgetMin, budgetMax, onRangeChange, resolveInitialSelection = false, idPrefix = "budget", layout = "cards" },
    ref,
  ) {
    const { t } = useTranslation();
    // Explicit budget-card choice. Null means "follow the values";
    // BUDGET_NONE_ID means the user cleared the choice.
    const [budgetSel, setBudgetSel] = useState<string | null>(null);
    const [hadSavedPrefs] = useState(resolveInitialSelection);
    // Text drafts for the budget inputs. Null means "follow the committed
    // value"; a string holds in-progress typing (including blank).
    const [minDraft, setMinDraft] = useState<string | null>(null);
    const [maxDraft, setMaxDraft] = useState<string | null>(null);
    const [budgetError, setBudgetError] = useState<string | null>(null);

    // Commit pending budget drafts: blank reverts to the current value, and
    // anything unparseable shows an inline error while keeping the last
    // valid value — so an invalid entry can never reach preferences or a
    // save. Min and max resolve against each other, so the minimum can
    // never exceed the maximum.
    const commitBudgetDrafts = (): boolean => {
      const resolveDraft = (draft: string | null, fallback: number): number => {
        if (draft === null || draft.trim() === "") return fallback;
        const parsed = parseBudgetDraftAmount(draft);
        if (Number.isNaN(parsed)) return NaN;
        return parsed;
      };
      const min = resolveDraft(minDraft, budgetMin);
      const max = resolveDraft(maxDraft, budgetMax);
      if (Number.isNaN(min) || Number.isNaN(max)) {
        setBudgetError(t("settings.budget.invalid"));
        return false;
      }
      setBudgetError(null);
      const [orderedMin, orderedMax] = orderBudgetRange(min, max);
      onRangeChange(orderedMin, orderedMax);
      setMinDraft(null);
      setMaxDraft(null);
      return true;
    };

    useImperativeHandle(ref, () => ({ commit: commitBudgetDrafts }));

    const budgetSelection =
      budgetSel === BUDGET_NONE_ID
        ? null
        : (budgetSel ?? (hadSavedPrefs ? (matchBudgetPreset(budgetMin, budgetMax) ?? BUDGET_CUSTOM_ID) : null));
    const showCustomInputs = budgetSelection === BUDGET_CUSTOM_ID;

    const selectBudgetPreset = (preset: { id: string; min: number; max: number }): void => {
      setMinDraft(null);
      setMaxDraft(null);
      setBudgetError(null);
      setBudgetSel(preset.id);
      onRangeChange(preset.min, preset.max);
    };

    // Tapping the selected card clears it and returns the budget to the
    // full range, which is how "no budget preference" is stored.
    const clearBudgetSelection = (): void => {
      setMinDraft(null);
      setMaxDraft(null);
      setBudgetError(null);
      setBudgetSel(BUDGET_NONE_ID);
      onRangeChange(PREFERENCE_BUDGET_MIN, PREFERENCE_BUDGET_MAX);
    };

    const customInputs = (
      <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-min`}>{t("settings.budget.minimum")}</Label>
            <InputGroup className="rounded-xl border border-border bg-card transition-colors focus-within:border-primary">
              <InputGroup.Prefix>
                <span className="pl-3 text-sm font-semibold text-muted-foreground" aria-hidden="true">
                  ₱
                </span>
              </InputGroup.Prefix>
              <InputGroup.Input
                id={`${idPrefix}-min`}
                inputMode="numeric"
                autoComplete="off"
                aria-label={t("settings.budget.minimum.aria")}
                value={minDraft ?? budgetMin.toLocaleString()}
                onChange={(e) => {
                  setMinDraft(e.target.value);
                  setBudgetError(null);
                }}
                onBlur={() => commitBudgetDrafts()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-max`}>{t("settings.budget.maximum")}</Label>
            <InputGroup className="rounded-xl border border-border bg-card transition-colors focus-within:border-primary">
              <InputGroup.Prefix>
                <span className="pl-3 text-sm font-semibold text-muted-foreground" aria-hidden="true">
                  ₱
                </span>
              </InputGroup.Prefix>
              <InputGroup.Input
                id={`${idPrefix}-max`}
                inputMode="numeric"
                autoComplete="off"
                aria-label={t("settings.budget.maximum.aria")}
                value={maxDraft ?? budgetMax.toLocaleString()}
                onChange={(e) => {
                  setMaxDraft(e.target.value);
                  setBudgetError(null);
                }}
                onBlur={() => commitBudgetDrafts()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            </InputGroup>
          </div>
        </div>
        {budgetError && (
          <p role="alert" className="text-sm text-danger">
            {budgetError}
          </p>
        )}
      </>
    );

    if (layout === "compact") {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-xl font-bold text-primary" aria-live="polite">
            ₱{budgetMin.toLocaleString()} – ₱{budgetMax.toLocaleString()}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm text-foreground">{t("settings.budget.preset")}</Label>
            <SettingsSelect
              label={t("settings.budget.preset")}
              value={budgetSelection ?? BUDGET_CUSTOM_ID}
              options={[
                ...BUDGET_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })),
                { value: BUDGET_CUSTOM_ID, label: t("settings.budget.custom") },
              ]}
              onChange={(value) => {
                if (value === BUDGET_CUSTOM_ID) {
                  setMinDraft(null);
                  setMaxDraft(null);
                  setBudgetError(null);
                  setBudgetSel(BUDGET_CUSTOM_ID);
                  return;
                }
                const preset = BUDGET_PRESETS.find((p) => p.id === value);
                if (preset) selectBudgetPreset(preset);
              }}
            />
          </div>
          {showCustomInputs && customInputs}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          role="group"
          aria-label={t("settings.budget.options")}
        >
          {BUDGET_PRESETS.map((preset) => (
            <PreferenceOptionCard
              key={preset.id}
              label={preset.label}
              selected={budgetSelection === preset.id}
              onPress={() =>
                budgetSelection === preset.id ? clearBudgetSelection() : selectBudgetPreset(preset)
              }
              className={`cursor-pointer ${
                budgetSelection === preset.id
                  ? "hover:bg-primary/15 active:bg-primary/20"
                  : "hover:bg-primary/5 active:bg-primary/10"
              }`}
            />
          ))}
          <div className="sm:col-span-2">
            <PreferenceOptionCard
              label={t("settings.budget.custom")}
              selected={budgetSelection === BUDGET_CUSTOM_ID}
              className={`w-full cursor-pointer ${
                budgetSelection === BUDGET_CUSTOM_ID
                  ? "hover:bg-primary/15 active:bg-primary/20"
                  : "hover:bg-primary/5 active:bg-primary/10"
              }`}
              onPress={() => {
                if (budgetSelection === BUDGET_CUSTOM_ID) {
                  clearBudgetSelection();
                  return;
                }
                setMinDraft(null);
                setMaxDraft(null);
                setBudgetError(null);
                setBudgetSel(BUDGET_CUSTOM_ID);
              }}
            />
          </div>
        </div>
        {showCustomInputs && customInputs}
      </div>
    );
  },
);

export default BudgetRangeField;
