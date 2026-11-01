"use client";

import { Label, Radio, RadioGroup } from "@heroui/react";
import { SECONDARY_IDS, VALID_IDS } from "@repo/constants";

interface VerificationIdSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
}

export default function VerificationIdSelector({ value, onChange }: VerificationIdSelectorProps) {
  return (
    <RadioGroup aria-label="Supported ID types" value={value ?? ""} onChange={onChange} className="mobile-verification-id-options">
      <p className="mobile-verification-group-label">Government IDs</p>
      {VALID_IDS.map(id => (
        <Radio key={id} value={id}>
          <Radio.Content>
            <Radio.Control><Radio.Indicator /></Radio.Control>
            <Label>{id}</Label>
          </Radio.Content>
        </Radio>
      ))}
      <p className="mobile-verification-group-label">Secondary IDs</p>
      {SECONDARY_IDS.map(id => (
        <Radio key={id} value={id}>
          <Radio.Content>
            <Radio.Control><Radio.Indicator /></Radio.Control>
            <Label>{id}</Label>
          </Radio.Content>
        </Radio>
      ))}
    </RadioGroup>
  );
}
