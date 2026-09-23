"use client";

// apps/web/app/(main)/tenant/maintenance/components/MaintenanceForm.tsx
import { useRef, useState } from "react";
import type { Key } from "@heroui/react";
import {
  Button,
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
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { CATEGORIES, FORM_LIMITS } from "../data/maintenance-data";
import { useSubmitMaintenanceRequest } from "@/hooks/use-submit-maintenance-request";
import type { MaintenanceUrgency } from "@/service/maintenanceService";

const URGENCY_LEVELS: {
  id: MaintenanceUrgency;
  label: string;
  bg: string;
  text: string;
  ring: string;
}[] = [
  { id: "low", label: "Low", bg: "#E5E7EB", text: "#6C757D", ring: "#6C757D" },
  { id: "medium", label: "Medium", bg: "#FFF8E1", text: "#FACC15", ring: "#FACC15" },
  { id: "high", label: "High", bg: "#FDA4AF", text: "#E50914", ring: "#E50914" },
];

const MAX_FILE_SIZE_BYTES = FORM_LIMITS.maxFileSizeMB * 1024 * 1024;

type FormErrors = {
  title?: string;
  category?: string;
  description?: string;
  urgency?: string;
};

type MaintenanceFormProps = {
  apartmentId: string;
  onSubmitted?: () => void;
};

export default function MaintenanceForm({ apartmentId, onSubmitted }: MaintenanceFormProps) {
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState<Key | null>(null);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<MaintenanceUrgency | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit, isSubmitting } = useSubmitMaintenanceRequest();

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    const messages: string[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        messages.push(`${file.name}: only image files are allowed.`);
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
      messages.push(`You can attach up to ${FORM_LIMITS.maxFiles} photos.`);
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
    if (!title.trim()) {
      next.title = "Title is required.";
    }
    if (!categoryKey) {
      next.category = "Category is required.";
    }
    if (!description.trim()) {
      next.description = "Description is required.";
    }
    if (!urgency) {
      next.urgency = "Please select an urgency level.";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.danger("Please fix the highlighted fields.");
      return;
    }

    const category = CATEGORIES.find((cat) => cat.id === categoryKey);
    if (!category) {
      toast.danger("Please select a valid category.");
      return;
    }

    const result = await submit({
      apartmentId,
      form: {
        title: title.trim(),
        category: category.id,
        message: description.trim(),
        urgency,
      },
      files,
    });

    if (!result.success) {
      toast.danger(result.error);
      return;
    }

    toast.success("Maintenance request submitted");
    setTitle("");
    setCategoryKey(null);
    setDescription("");
    setUrgency(null);
    setFiles([]);
    setFileError(null);
    setErrors({});
    onSubmitted?.();
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm font-nunito">
      <Card.Content className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-nunito font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Maintenance Details
          </p>
          <p className="text-sm text-muted-foreground">
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
          <Label className="block text-sm font-nunito font-semibold text-card-foreground mb-1.5">
            Issue Title
          </Label>
          <Input placeholder="Enter a short title for the issue..." />
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
          <Label className="block text-sm font-nunito font-semibold text-card-foreground mb-1.5">
            Issue Category
          </Label>
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
          <Label className="block text-sm font-nunito font-semibold text-card-foreground mb-1.5">
            Issue Description
          </Label>
          <TextArea
            rows={5}
            placeholder="Describe the issue in detail..."
            className="resize-none"
          />
          <FieldError>{errors.description}</FieldError>
        </TextField>

        {/* Urgency */}
        <div>
          <Label className="block text-sm font-nunito font-semibold text-card-foreground mb-2">
            How urgent is this issue? <span className="text-primary">*</span>
          </Label>
          <ToggleButtonGroup
            aria-label="How urgent is this issue?"
            isDetached
            selectionMode="single"
            selectedKeys={urgency ? [urgency] : []}
            onSelectionChange={(keys) => {
              const [first] = Array.from(keys);
              setUrgency((first as MaintenanceUrgency) ?? null);
              clearError("urgency");
            }}
            className="flex flex-wrap gap-2"
          >
            {URGENCY_LEVELS.map((level) => (
              <ToggleButton
                key={level.id}
                id={level.id}
                className="rounded-full px-4 py-1.5 text-sm font-nunito font-semibold transition-all"
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

        {/* Add Photos */}
        <div>
          <Label className="block text-sm font-nunito font-semibold text-card-foreground mb-1.5">
            Add Photos
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-border bg-muted py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <UploadCloud size={18} />
            Add photos
          </button>

          {files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card pl-2.5 pr-1.5 py-1.5 text-xs text-muted-foreground"
                >
                  <ImageIcon size={14} className="text-muted-foreground shrink-0" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
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
        <Button type="submit" className="w-full rounded-full font-nunito mt-2" isDisabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
      </Card.Content>
    </Card>
  );
}
