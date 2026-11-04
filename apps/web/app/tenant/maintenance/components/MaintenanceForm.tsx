"use client";

// apps/web/app/(main)/tenant/maintenance/components/MaintenanceForm.tsx
import { useEffect, useRef, useState } from "react";
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
import {
  IconUpload as UploadCloud,
  IconX as X,
  IconPhoto as ImageIcon,
  IconLeaf,
  IconBolt,
  IconAlertTriangle,
  IconCircle,
  IconCircleDot,
} from "@tabler/icons-react";
import { CATEGORIES, FORM_LIMITS } from "../data/maintenance-data";
import { useSubmitMaintenanceRequest } from "@/hooks/use-submit-maintenance-request";
import type { MaintenanceUrgency } from "@/service/maintenanceService";

const URGENCY_LEVELS: {
  id: MaintenanceUrgency;
  label: string;
  description: string;
  icon: typeof IconLeaf;
  bg: string;
  text: string;
  solidBg: string;
}[] = [
  { id: "low", label: "Low", description: "Minor issue, not urgent", icon: IconLeaf, bg: "#E5E7EB", text: "#475569", solidBg: "#475569" },
  { id: "medium", label: "Medium", description: "Needs attention soon", icon: IconBolt, bg: "#FFF8E1", text: "#92400E", solidBg: "#92400E" },
  { id: "high", label: "High", description: "Urgent, needs immediate action", icon: IconAlertTriangle, bg: "#FDA4AF", text: "#991B1B", solidBg: "#991B1B" },
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
  onSubmitted?: () => void | Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
  embedded?: boolean;
};

export default function MaintenanceForm({ apartmentId, onSubmitted, onSubmittingChange, embedded = false }: MaintenanceFormProps) {
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState<Key | null>(null);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<MaintenanceUrgency | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit, isSubmitting } = useSubmitMaintenanceRequest();
  const [reconciling, setReconciling] = useState(false);
  const submissionLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

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
    if (submissionLock.current) return;

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

    submissionLock.current = true;
    onSubmittingChange?.(true);
    try {
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
    if (!mounted.current) return;

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
    setReconciling(true);
    await onSubmitted?.();
    } finally {
      submissionLock.current = false;
      if (mounted.current) {
        setReconciling(false);
        onSubmittingChange?.(false);
      }
    }
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm" style={embedded ? { border: 0, boxShadow: "none", background: "transparent" } : undefined}>
      <Card.Content className="p-6 sm:p-8" style={embedded ? { padding: 0 } : undefined}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="text-lg font-nunito font-semibold text-card-foreground mb-1">
            Maintenance Details
          </p>
          <p className="font-inter text-base text-card-foreground">
            Tell us what&apos;s going on and we&apos;ll pass it along to your landlord.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Issue Title */}
        <TextField
          className="min-w-0 md:col-span-7"
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
          <Input placeholder="Enter a short title for the issue..." className="font-inter" />
          <FieldError className="font-inter">{errors.title}</FieldError>
        </TextField>

        {/* Issue Category */}
        <ComboBox
          aria-label="Issue Category"
          className="min-w-0 w-full md:col-span-5"
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
            <Input placeholder="Select a category..." className="font-inter" />
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
          <FieldError className="font-inter">{errors.category}</FieldError>
        </ComboBox>
        </div>

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
            className="resize-none font-inter"
          />
          <FieldError className="font-inter">{errors.description}</FieldError>
        </TextField>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Urgency */}
        <div className="min-w-0 lg:col-span-7">
          <Label className="block text-sm font-nunito font-semibold text-card-foreground mb-2">
            How urgent is this issue? <span className="text-danger">*</span>
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
            className="w-full gap-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
            }}
          >
            {URGENCY_LEVELS.map((level) => {
              const selected = urgency === level.id;
              const UrgencyIcon = level.icon;
              const SelectionIcon = selected ? IconCircleDot : IconCircle;
              return (
                <ToggleButton
                  key={level.id}
                  id={level.id}
                  className="text-sm font-nunito font-semibold transition-colors"
                  style={{
                    backgroundColor: selected ? level.solidBg : level.bg,
                    color: selected ? "#FFFFFF" : level.text,
                    boxShadow: "none",
                    height: "auto",
                    minHeight: 80,
                    minWidth: 0,
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${selected ? "currentColor" : "transparent"}`,
                    justifyContent: "flex-start",
                    whiteSpace: "normal",
                  }}
                >
                  <span className="flex w-full items-start gap-2 text-left">
                    <SelectionIcon size={20} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1">
                        <UrgencyIcon size={16} className="shrink-0" aria-hidden="true" />
                        {level.label}
                      </span>
                      <span className="mt-1 block font-inter text-xs font-normal">
                        {level.description}
                      </span>
                    </span>
                  </span>
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
          {errors.urgency && <p className="font-inter text-xs text-danger mt-1">{errors.urgency}</p>}
        </div>

        {/* Add Photos */}
        <div className="min-w-0 lg:col-span-5 lg:border-l lg:border-border lg:pl-6">
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
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="button--bare w-full rounded-xl border border-dashed border-border bg-muted py-8 flex items-center justify-center gap-2 font-inter text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <UploadCloud size={18} />
            Add photos
          </Button>

          {files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card pl-2.5 pr-1.5 py-1.5 font-inter text-xs text-muted-foreground"
                >
                  <ImageIcon size={14} className="text-muted-foreground shrink-0" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                    className="button--bare text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {fileError && <p className="font-inter text-xs text-danger mt-2">{fileError}</p>}
        </div>
        </div>

        {/* Submit */}
        <Button type="submit" className="h-12 w-full rounded-full font-nunito text-base font-bold mt-2" isDisabled={isSubmitting || reconciling}>
          {isSubmitting || reconciling ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
      </Card.Content>
    </Card>
  );
}
