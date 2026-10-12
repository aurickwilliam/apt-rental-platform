"use client";

import { useState } from "react";
import { IconGlobe, IconMapPin } from "@tabler/icons-react";

import SettingsRow from "../SettingsRow";
import SettingsSelect from "../SettingsSelect";
import { LANGUAGES, REGIONS } from "@repo/constants";

const LANGUAGE_OPTIONS = LANGUAGES.map(({ label }) => ({ value: label, label }));
const REGION_OPTIONS = REGIONS.map((region) => ({ value: region, label: region }));

export default function LanguageRegionTab() {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].label);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        Language &amp; Region
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure your language and region settings
      </p>
      <div className="mt-3 divide-y divide-border">
        <SettingsRow
          icon={<IconGlobe size={18} />}
          title="Language"
          description="Choose the language used in the app."
          suffix={
            <SettingsSelect
              label="Language"
              value={selectedLanguage}
              options={LANGUAGE_OPTIONS}
              onChange={setSelectedLanguage}
              className="w-44"
            />
          }
        />
        <SettingsRow
          icon={<IconMapPin size={18} />}
          title="Region"
          description="Set the region used for local content."
          suffix={
            <SettingsSelect
              label="Region"
              value={selectedRegion}
              options={REGION_OPTIONS}
              onChange={setSelectedRegion}
              className="w-64"
            />
          }
        />
      </div>
      <p className="mt-4 px-4 font-inter text-sm text-muted-foreground">
        Note: Some changes may require restarting the app. This feature is coming soon.
      </p>
    </>
  );
}
