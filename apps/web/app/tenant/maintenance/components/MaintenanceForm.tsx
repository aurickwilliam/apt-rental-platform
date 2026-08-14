"use client";

// apps/web/app/(main)/tenant/maintenance/components/MaintenanceForm.tsx
import { useRef, useState } from "react";
import type { Key } from "@heroui/react";
import {
  Card,
  ComboBox,
  FieldError,
  Input,
  Label,
  ListBox,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import { UploadCloud, X, ImageIcon, CheckCircle2 } from "lucide-react";
import { CATEGORIES, FORM_LIMITS } from "../data/maintenance-data";
import {
  saveMaintenanceRequest,
  type MaintenanceRequestPayload,
  type StoredMaintenanceRequest,
} from "../lib/maintenance-store";

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

const MAX_FILE_SIZE_BYTES = FORM_LIMITS.maxFileSizeMB * 1024 * 1024;

type FormErrors = {
  title?: string;
  category?: string;
  description?: string;
  urgency?: string;
};

export default function MaintenanceForm() {
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState<Key | null>(null);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [lastStored, setLastStored] = useState<StoredMaintenanceRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    const messages: string[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        messages.push(`${file.name}: only image and video files are allowed.`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        messages.push(
          `${file.name}: each file must be ${FORM_LIMITS.maxFileSizeMB}MB or smaller.`
        );
      } else {
        accepted.push(file);
      }
    }

    const remaining = FORM_LIMITS.maxFiles - files.length;
    if (accepted.length > remaining) {
      accepted.length = Math.max(remaining, 0);
      messages.push(`You can attach up to ${FORM_LIMITS.maxFiles} files.`);
    }

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
    }
    setFileError(messages.length > 0 ? messages.join(" ") : null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const validateForm = (): FormErrors => {
    const next: FormErrors = {};
    if (title.trim().length < FORM_LIMITS.titleMinLength) {
      next.title = `Title must be at least ${FORM_LIMITS.titleMinLength} characters.`;
    }
    if (!categoryKey) {
      next.category = "Please select a category.";
    }
    if (description.trim().length < FORM_LIMITS.descriptionMinLength) {
      next.description = `Description must be at least ${FORM_LIMITS.descriptionMinLength} characters.`;
    }
    if (!urgency) {
      next.urgency = "Please select an urgency level.";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.danger("Please fix the highlighted fields.");
      return;
    }

    const category = CATEGORIES.find((cat) => cat.id === categoryKey);
    const payload: MaintenanceRequestPayload = {
      title: title.trim(),
      categoryId: category!.id,
      categoryLabel: category!.label,
      description: description.trim(),
      urgency: urgency!,
      files: files.map((file) => ({ name: file.name, type: file.type, size: file.size })),
    };

    const stored = saveMaintenanceRequest(payload);
    setLastStored(stored);
    toast.success("Maintenance request submitted");

    setTitle("");
    setCategoryKey(null);
    setDescription("");
    setUrgency(null);
    setFiles([]);
    setFileError(null);
    setErrors({});
  };

  return (
    <>
    <Card className="bg-surface border border-default-200 shadow-none p-6 md:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-1">
            Maintenance Details
          </p>
          <p className="text-sm text-default-500">
            Tell us what&apos;s going on and we&apos;ll pass it along to your landlord.
          </p>
        </div>

        {/* Issue Title */}
        <TextField
          isRequired
          name="issue-title"
          value={title}
          onChange={(value) => {
            setTitle(value);
            clearError("title");
          }}
          isInvalid={!!errors.title}
        >
          <Label className="block text-sm font-poppinsSemiBold text-foreground mb-1.5">
            Issue Title <span className="text-primary"></span>
          </Label>
          <Input
            placeholder="Enter a short title for the issue..."
            style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
          />
          <FieldError>{errors.title}</FieldError>
        </TextField>

        {/* Issue Category */}
        <ComboBox
          aria-label="Issue Category"
          className="w-full"
          isRequired
          selectedKey={categoryKey}
          onSelectionChange={(key) => {
            setCategoryKey(key);
            clearError("category");
          }}
          isInvalid={!!errors.category}
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
          <FieldError>{errors.category}</FieldError>
        </ComboBox>

        {/* Issue Description */}
        <TextField
          isRequired
          name="issue-description"
          value={description}
          onChange={(value) => {
            setDescription(value);
            clearError("description");
          }}
          isInvalid={!!errors.description}
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
          <FieldError>{errors.description}</FieldError>
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
              clearError("urgency");
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
          {errors.urgency && <p className="text-xs text-danger mt-1">{errors.urgency}</p>}
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
          {fileError && <p className="text-xs text-danger mt-2">{fileError}</p>}
        </div>

        {/* Submit */}
        <button type="submit" className="button--primary w-full rounded-full py-3 text-sm font-poppinsSemiBold mt-2">
          Submit Request
        </button>
      </form>
    </Card>

    {lastStored && (
      <Card className="bg-surface border border-default-200 shadow-none p-6 md:p-8 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-success shrink-0" />
            <p className="text-sm font-poppinsSemiBold text-foreground">
              Request received & stored
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastStored(null)}
            aria-label="Dismiss summary"
            className="!text-card-foreground/50 hover:!text-card-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="font-poppinsSemiBold text-xs uppercase tracking-widest text-default-500 mb-0.5">
              Issue Title
            </dt>
            <dd className="text-foreground">{lastStored.title}</dd>
          </div>
          <div>
            <dt className="font-poppinsSemiBold text-xs uppercase tracking-widest text-default-500 mb-0.5">
              Category
            </dt>
            <dd className="text-foreground">{lastStored.categoryLabel}</dd>
          </div>
          <div>
            <dt className="font-poppinsSemiBold text-xs uppercase tracking-widest text-default-500 mb-0.5">
              Urgency
            </dt>
            <dd className="text-foreground">
              {URGENCY_LEVELS.find((level) => level.id === lastStored.urgency)?.label}
            </dd>
          </div>
          <div>
            <dt className="font-poppinsSemiBold text-xs uppercase tracking-widest text-default-500 mb-0.5">
              Submitted
            </dt>
            <dd className="text-foreground">
              {new Date(lastStored.createdAt).toLocaleString()}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-poppinsSemiBold text-xs uppercase tracking-widest text-default-500 mb-0.5">
              Description
            </dt>
            <dd className="text-foreground whitespace-pre-line">{lastStored.description}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-poppinsSemiBold text-xs uppercase tracking-widest text-default-500 mb-0.5">
              Attachments
            </dt>
            <dd className="text-foreground">
              {lastStored.files.length > 0
                ? lastStored.files.map((file) => file.name).join(", ")
                : "None"}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-default-500">
          Stored in an in-memory cache — data resets when the page reloads. Request ID:{" "}
          <code className="text-foreground">{lastStored.id}</code>
        </p>
      </Card>
    )}
  </>
  );
}