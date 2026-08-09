"use client";

// apps/web/app/(main)/tenant/maintenance/components/MaintenanceForm.tsx
import { useRef, useState } from "react";
import type { Key } from "@heroui/react";
import {
  Card,
  ComboBox,
  Input,
  Label, // 1. Added Label import
  ListBox,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { CATEGORIES } from "../data/maintenance-data";

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
        <TextField
          isRequired
          name="issue-title"
          value={title}
          onChange={setTitle}
        >
          <Label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Title <span className="text-primary"></span>
          </Label>
          <Input
            placeholder="Enter a short title for the issue..."
            style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
          />
        </TextField>

        {/* Issue Category */}
        <ComboBox
          aria-label="Issue Category"
          className="w-full"
          isRequired
          selectedKey={categoryKey}
          onSelectionChange={setCategoryKey}
        >
          {/* 2. Swapped HTML <label> to Hero UI <Label> inside <ComboBox> */}
          <Label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Category <span className="text-primary"></span>
          </Label>
          <ComboBox.InputGroup>
            <Input
              placeholder="Select a category..."
              style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
            />
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

        {/* Issue Description */}
        <TextField
          isRequired
          name="issue-description"
          value={description}
          onChange={setDescription}
        >
          <Label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Description <span className="text-primary"></span>
          </Label>
          <TextArea
            rows={5}
            placeholder="Describe the issue in detail..."
            className="resize-none"
            style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
          />
        </TextField>

        {/* Urgency */}
        <div>
          {/* 3. Updated <label> to <Label> */}
          <Label className="block text-sm font-poppinsSemibold text-foreground mb-2">
            How urgent is this issue? <span className="text-primary">*</span>
          </Label>
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
          {/* 4. Updated <label> to <Label> */}
          <Label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Add Photos or Videos
          </Label>
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
            className="w-full rounded-xl border border-dashed border-border !bg-card py-8 flex items-center justify-center gap-2 text-sm !text-card-foreground/70 hover:border-primary hover:!text-primary transition-colors"
          >
            <UploadCloud size={18} />
            Add photos
          </button>

          {files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-border !bg-card pl-2.5 pr-1.5 py-1.5 text-xs !text-card-foreground/70"
                >
                  <ImageIcon size={14} className="!text-card-foreground/50 shrink-0" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                    className="!text-card-foreground/50 hover:!text-red-600 transition-colors"
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