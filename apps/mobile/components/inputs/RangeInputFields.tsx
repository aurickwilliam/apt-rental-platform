import { useState } from "react";
import { Text, View } from "react-native";
import { InputGroup, Label, TextField, useBottomSheetAwareHandlers } from "heroui-native";
import { commitRangeDraft, type RangeSide } from "@repo/utils";

interface RangeInputFieldsProps {
  min: number;
  max: number;
  absoluteMin: number;
  absoluteMax: number;
  step: number;
  /** Shown before each number, e.g. a currency sign. */
  prefix?: string;
  /** Shown after each number, e.g. a unit. */
  suffix?: string;
  minLabel: string;
  maxLabel: string;
  onCommit: (next: [number, number]) => void;
}

/**
 * Min and Max fields beside a range slider, for typing an exact range (web has
 * the same pair). Drafts stay local while typing and commit on blur or the
 * keyboard's Done key, snapped to the slider's step and clamped to its ends and
 * to the other side (`commitRangeDraft`), so partial input is never clobbered.
 * Meant for a bottom sheet: it keeps the sheet above the keyboard.
 */
export default function RangeInputFields({
  min,
  max,
  absoluteMin,
  absoluteMax,
  step,
  prefix,
  suffix,
  minLabel,
  maxLabel,
  onCommit,
}: RangeInputFieldsProps) {
  const sheetHandlers = useBottomSheetAwareHandlers();
  const [drafts, setDrafts] = useState<Record<RangeSide, string | null>>({ min: null, max: null });

  // The slider, Clear All or a new range from outside resets the drafts, so the
  // fields always show the committed range when not being edited. Compared
  // during render rather than in an effect.
  const [prevRange, setPrevRange] = useState<[number, number]>([min, max]);
  if (prevRange[0] !== min || prevRange[1] !== max) {
    setPrevRange([min, max]);
    setDrafts({ min: null, max: null });
  }

  const commit = (side: RangeSide) => {
    const draft = drafts[side];
    if (draft === null) return;
    const next = commitRangeDraft(side, draft, {
      range: [min, max],
      absoluteMin,
      absoluteMax,
      step,
    });
    setDrafts((previous) => ({ ...previous, [side]: null }));
    if (next[0] !== min || next[1] !== max) onCommit(next);
  };

  const field = (side: RangeSide, committed: number, label: string) => (
    <TextField className="flex-1">
      <Label>
        <Label.Text className="font-inter text-xs text-muted">
          {side === "min" ? "Min" : "Max"}
        </Label.Text>
      </Label>
      <InputGroup>
        {prefix ? (
          <InputGroup.Prefix>
            <Text className="font-inter text-sm text-muted">{prefix}</Text>
          </InputGroup.Prefix>
        ) : null}
        <InputGroup.Input
          value={drafts[side] ?? String(committed)}
          onChangeText={(text) => setDrafts((previous) => ({ ...previous, [side]: text }))}
          accessibilityLabel={label}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={9}
          className="font-inter text-sm text-foreground"
          onFocus={sheetHandlers.onFocus}
          onBlur={sheetHandlers.onBlur}
          onEndEditing={() => commit(side)}
        />
        {suffix ? (
          <InputGroup.Suffix>
            <Text className="font-inter text-xs text-muted">{suffix}</Text>
          </InputGroup.Suffix>
        ) : null}
      </InputGroup>
    </TextField>
  );

  return (
    <View className="flex-row gap-2 mt-3">
      {field("min", min, minLabel)}
      {field("max", max, maxLabel)}
    </View>
  );
}
