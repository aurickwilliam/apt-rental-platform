"use client";

// apps/web/app/(main)/tenant/maintenance/components/MaintenanceForm.tsx
import { useRef, useState } from "react";
import type { Key } from "@heroui/react";
import { Card, ComboBox, Input, ListBox, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { CATEGORIES } from "../data/maintenance-data";

// Using inline `style` instead of Tailwind bg-* classes: @heroui/styles loads
// AFTER tailwindcss in globals.css and isn't wrapped in Tailwind's @layer
// system, so its shipped ToggleButton background was silently beating our
// utility classes (even with "!"), making every pill render the same default
// grey. A plain inline style always wins against a non-!important stylesheet
// rule regardless of import order, so this sidesteps that fight entirely.
// `style` accepts a function of render props here (same pattern as
// `className`), which is how we read the real isSelected state for the ring.
const URGENCY_LEVELS: {
  id: "low" | "medium" | "high";
  label: string;
  bg: string;
  text: string;
  ring: string;
}[] = [
  { id: "low", label: "Low", bg: "#E5E7EB", text: "#6C757D", ring: "#6C757D" },
  { id: "medium", label: "Medium", bg: "#FFF8E1", text: "#333333", ring: "#FACC15" },
  { id: "high", label: "High", bg: "#FDA4AF", text: "#E50914", ring: "#E50914" },
];

export default function MaintenanceForm() {
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState<Key | null>(null);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up to the actual maintenance-request endpoint.
    console.log({ title, categoryKey, description, urgency, files });
  };

  return (
    <Card className="bg-surface border border-default-200 shadow-none p-6 md:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-1">
            Maintenance Details
          </p>
          <p className="text-sm text-default-500">
            Tell us what's going on and we'll pass it along to your landlord.
          </p>
        </div>

        {/* Issue Title */}
        <div>
          <label htmlFor="issue-title" className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Title <span className="text-primary">*</span>
          </label>
          <input
            id="issue-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a short title for the issue..."
            className="input w-full px-4 py-2.5 text-sm text-foreground"
          />
        </div>

        {/* Issue Category */}
        <div>
          <label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Category <span className="text-primary">*</span>
          </label>
          <ComboBox
            aria-label="Issue Category"
            className="w-full"
            isRequired
            selectedKey={categoryKey}
            onSelectionChange={setCategoryKey}
          >
            <ComboBox.InputGroup>
              <Input placeholder="Select a category..." />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox>
                {CATEGORIES.map((cat) => (
                  <ListBox.Item key={cat.id} id={cat.id} textValue={cat.label}>
                    {cat.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>

        {/* Issue Description */}
        <div>
          <label htmlFor="issue-description" className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Description <span className="text-primary">*</span>
          </label>
          <textarea
            id="issue-description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="textarea w-full px-4 py-3 text-sm text-foreground resize-none"
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-poppinsSemiBold text-foreground mb-2">
            How urgent is this issue? <span className="text-primary">*</span>
          </label>
          <ToggleButtonGroup
            aria-label="How urgent is this issue?"
            isDetached
            selectionMode="single"
            selectedKeys={urgency ? [urgency] : []}
            onSelectionChange={(keys) => {
              const [first] = Array.from(keys);
              setUrgency((first as "low" | "medium" | "high") ?? null);
            }}
            className="flex flex-wrap gap-2"
          >
            {URGENCY_LEVELS.map((level) => (
              <ToggleButton
                key={level.id}
                id={level.id}
                className="rounded-full px-4 py-1.5 text-sm font-poppinsSemiBold transition-all"
                style={({ isSelected }) => ({
                  backgroundColor: level.bg,
                  color: level.text,
                  boxShadow: isSelected ? `0 0 0 2px ${level.ring}` : "none",
                })}
              >
                {level.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        {/* Add Photos or Videos */}
        <div>
          <label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Add Photos or Videos
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-gray-300 bg-white py-8 flex items-center justify-center gap-2 text-sm text-default-700 hover:border-primary hover:text-primary transition-colors"
          >
            <UploadCloud size={18} />
            Add photos
          </button>

          {files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-default-200 bg-white pl-2.5 pr-1.5 py-1.5 text-xs text-default-700"
                >
                  <ImageIcon size={14} className="text-default-500 shrink-0" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                    className="text-default-500 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="button--primary w-full rounded-full py-3 text-sm font-poppinsSemiBold mt-2">
          Submit Request
        </button>
      </form>
    </Card>
  );
}