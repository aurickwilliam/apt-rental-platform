"use client";

import { useState } from "react";
import { Globe, MapPin } from "lucide-react";
import { Popover, ListBox, Button } from "@heroui/react";

import SettingsShell from "../components/SettingsShell";
import SettingsRow from "../components/SettingsRow";
import SectionTitle from "../components/SectionTitle";
import { LANGUAGES, REGIONS } from "@repo/constants";

const RegionSelect = ({ value, onChange, options, placeholder, className }: { value: string; onChange: (value: string) => void; options: string[]; placeholder?: string; className?: string }) => (
  <Popover>
    <Popover.Trigger>
      <Button variant="outline" className={`w-full justify-between px-4 py-3 h-auto ${className || ""}`}>
        <span className="text-left flex-1 font-inter text-sm text-foreground truncate">
          {value || placeholder || "Select"}
        </span>
      </Button>
    </Popover.Trigger>
    <Popover.Content placement="bottom" className="w-(--trigger-width) p-0">
      <Popover.Dialog className="p-2 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
        <ListBox selectionMode="single" selectedKeys={[value]} onSelectionChange={(keys) => onChange(Array.from(keys)[0] as string)}>
          {options.map((opt) => (
            <ListBox.Item key={opt} id={opt} textValue={opt}>
              {opt}
            </ListBox.Item>
          ))}
        </ListBox>
      </Popover.Dialog>
    </Popover.Content>
  </Popover>
);

export default function LanguageRegionPage() {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].label);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  return (
    <SettingsShell title="Language & Region" subtitle="Configure your language and region settings" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        <div className="pt-6">
          <div className="px-4 pb-3">
            <SectionTitle title="Language" />
          </div>
          <div className="divide-y divide-border">
            <SettingsRow
              icon={<Globe size={18} />}
              title="Language"
              suffix={
                <RegionSelect
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                  options={LANGUAGES.map(l => l.label)}
                  placeholder="Select language"
                  className="w-full max-w-[12rem] sm:w-48"
                />
              }
            />
          </div>
        </div>

        <div className="pt-6">
          <div className="px-4 pb-3">
            <SectionTitle title="Region" />
          </div>
          <div className="divide-y divide-border">
            <SettingsRow
              icon={<MapPin size={18} />}
              title="Region"
              suffix={
                <RegionSelect
                  value={selectedRegion}
                  onChange={setSelectedRegion}
                  options={REGIONS}
                  placeholder="Select region"
                  className="w-full max-w-[16rem] sm:w-64"
                />
              }
            />
          </div>
        </div>

        <div className="pt-4 pb-6 px-4">
          <p className="text-muted-foreground text-sm font-inter">
            Note: Some changes may require restarting the app. This feature is coming soon.
          </p>
        </div>

      </div>
    </SettingsShell>
  );
}