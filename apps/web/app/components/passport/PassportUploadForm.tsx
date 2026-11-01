"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { Button, Calendar, Checkbox, CloseButton, DateField, DatePicker, FieldError, Label, Link, Modal, Spinner } from "@heroui/react";
import { IconAlertTriangle, IconFileInfo, IconFileText, IconShieldCheck, IconUpload } from "@tabler/icons-react";

import { isReviewEligibleDocType } from "@repo/constants";
import { isExpiredDate, toExpiryDateString } from "@repo/passport";
import { PASSPORT_DOC_TYPE_KEYS, enumLabel, type Translate } from "@repo/i18n";

import PdfThumbnail from "@/app/components/display/PdfThumbnail";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { PASSPORT_UPLOAD_ACCEPT, validatePassportUploadFile } from "@/lib/passport-upload";

import { DocumentTypeIcon, isImageDocument } from "./documentTypeIcons";
import { documentTypeDescriptionKey } from "./documentTypeCopy";
import { isPdfDocument } from "./PassportDocumentThumbnail";

interface PassportUploadFormProps {
  portal?: "tenant" | "landlord";
  docType: string;
  isUploading: boolean;
  /** Rejects with a user-facing message; the chosen file is kept for a retry. */
  onSubmit: (input: { file: File; expiresAt: string | null }) => Promise<void>;
  onCancel: () => void;
  /** Replacing a file reuses this form; the labels and an extra notice change, nothing else. */
  submitLabel?: string;
  pendingLabel?: string;
  notice?: string;
}

function validateExpiry(value: CalendarDate | null, t: Translate): string | null {
  if (!value) return null;
  return isExpiredDate(value.toString()) ? t("passport.upload.expiryPast") : null;
}

/** Upload step of the add-document modal; renders the modal body and footer. */
export default function PassportUploadForm({
  portal = "tenant",
  docType,
  isUploading,
  onSubmit,
  onCancel,
  submitLabel,
  pendingLabel,
  notice,
}: PassportUploadFormProps) {
  const { language, t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<CalendarDate | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const expiryError = validateExpiry(expiresAt, t);
  const typeLabel = enumLabel(language, PASSPORT_DOC_TYPE_KEYS, docType);

  // Object URLs hold the file in memory until revoked.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!picked) return;

    const error = validatePassportUploadFile(picked);
    setFileError(error);
    setSubmitError(null);
    if (error) return;

    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const handleSubmit = async () => {
    if (!file || !isConfirmed || expiryError) return;
    setSubmitError(null);
    try {
      await onSubmit({ file, expiresAt: expiresAt ? expiresAt.toString() : null });
    } catch (err) {
      console.error("Passport upload failed", err);
      setSubmitError(err instanceof Error ? err.message : t("passport.upload.saveError"));
    }
  };

  return (
    <>
      <Modal.Body className="space-y-5">
        {notice ? (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-card-foreground">{notice}</p>
        ) : null}
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <DocumentTypeIcon docType={docType} size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{t(documentTypeDescriptionKey(docType, portal))}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconFileInfo size={14} aria-hidden="true" />
              {t("passport.upload.fileHint")}
            </p>
            {isReviewEligibleDocType(docType) ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-success">
                <IconShieldCheck size={14} aria-hidden="true" />
                {t("passport.upload.reviewHint")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-card-foreground">
              {t("passport.upload.document")} <span className="text-danger">*</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={PASSPORT_UPLOAD_ACCEPT}
              className="hidden"
              onChange={handleFileChange}
              aria-label={t("passport.upload.chooseAria", { type: typeLabel })}
            />
            <Button
              variant="ghost"
              isDisabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label={
                file ? t("passport.upload.replaceAria", { name: file.name }) : t("passport.upload.chooseFile")
              }
              className={`button--bare relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                fileError
                  ? "border-danger text-danger"
                  : file
                    ? "border-border"
                    : "border-border text-muted-foreground hover:border-primary hover:bg-accent"
              }`}
            >
              {file && previewUrl && isImageDocument(file.type, file.name) ? (
                // Local object URL preview; next/image cannot load blob: URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={t("passport.upload.previewAlt", { type: typeLabel })}
                  className="absolute inset-0 size-full object-contain"
                />
              ) : file && previewUrl && isPdfDocument(file.type, file.name) ? (
                <PdfThumbnail
                  url={previewUrl}
                  cacheKey={`local:${file.name}:${file.size}:${file.lastModified}`}
                  alt={t("passport.upload.previewAlt", { type: typeLabel })}
                  fit="contain"
                />
              ) : file ? (
                <>
                  <IconFileText size={36} className="text-muted-foreground" aria-hidden="true" />
                  <span className="px-3 text-center text-card-foreground">{file.name}</span>
                </>
              ) : (
                <>
                  <IconUpload size={24} aria-hidden="true" />
                  {t("passport.upload.chooseFile")}
                </>
              )}
            </Button>
            {file ? (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </span>
                <Button
                  variant="ghost"
                  isDisabled={isUploading}
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="button--bare shrink-0 cursor-pointer font-medium text-danger hover:underline"
                >
                  {t("passport.upload.remove")}
                </Button>
              </div>
            ) : null}
            {fileError ? <p className="text-xs text-danger">{fileError}</p> : null}
          </div>

          <div className="space-y-5">
            <DatePicker
              className="flex w-full flex-col gap-1"
              value={expiresAt}
              onChange={setExpiresAt}
              minValue={parseDate(toExpiryDateString(new Date()))}
              isInvalid={!!expiryError}
              isDisabled={isUploading}
            >
              <Label className="text-sm font-medium text-card-foreground">{t("passport.upload.expiryLabel")}</Label>
              <DateField.Group fullWidth className="border border-border bg-card">
                <DateField.Input>
                  {(segment) => (
                    <DateField.Segment
                      segment={segment}
                      className="text-card-foreground data-[placeholder=true]:text-muted-foreground"
                    />
                  )}
                </DateField.Input>
                <DateField.Suffix className="flex items-center gap-1">
                  {expiresAt ? (
                    <CloseButton
                      // Opt out of the DatePicker's button context, which
                      // would otherwise make this open the calendar too.
                      slot={null}
                      aria-label={t("passport.upload.clearExpiry")}
                      className="cursor-pointer text-muted-foreground!"
                      isDisabled={isUploading}
                      onPress={() => setExpiresAt(null)}
                    />
                  ) : null}
                  <DatePicker.Trigger className="cursor-pointer">
                    <DatePicker.TriggerIndicator className="text-muted-foreground" />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              <FieldError>{expiryError}</FieldError>
              <DatePicker.Popover>
                <Calendar aria-label={t("passport.upload.calendarAria")}>
                  <Calendar.Header>
                    <Calendar.YearPickerTrigger className="cursor-pointer">
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator className="text-muted-foreground" />
                    </Calendar.YearPickerTrigger>
                    <Calendar.NavButton slot="previous" className="cursor-pointer text-muted-foreground" />
                    <Calendar.NavButton slot="next" className="cursor-pointer text-muted-foreground" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => (
                        <Calendar.Cell
                          date={date}
                          className="cursor-pointer data-selected:bg-primary data-selected:text-white data-disabled:cursor-not-allowed"
                        />
                      )}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                  <Calendar.YearPickerGrid>
                    <Calendar.YearPickerGridBody>
                      {(yearProps) => (
                        <Calendar.YearPickerCell
                          year={yearProps.year}
                          className="cursor-pointer data-selected:bg-primary data-selected:text-white"
                        />
                      )}
                    </Calendar.YearPickerGridBody>
                  </Calendar.YearPickerGrid>
                </Calendar>
              </DatePicker.Popover>
            </DatePicker>

            <Checkbox className="group" isSelected={isConfirmed} onChange={setIsConfirmed} isDisabled={isUploading}>
              <Checkbox.Content className="flex cursor-pointer items-start gap-2 select-none">
                <Checkbox.Control className="mt-0.5 size-5 shrink-0 border border-border shadow-none! before:bg-primary! group-data-[selected=true]:border-primary! group-data-[selected=true]:bg-primary!">
                  <Checkbox.Indicator className="[&_svg]:text-white!" />
                </Checkbox.Control>
                <Label className="cursor-pointer text-sm font-semibold text-card-foreground">
                  {t("passport.upload.confirm")}{" "}
                  <span className="text-danger">*</span>
                </Label>
              </Checkbox.Content>
            </Checkbox>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="text-danger">*</span> {t("passport.upload.certify")}
              </p>
              <Link className="cursor-pointer text-sm font-medium text-primary! underline" onPress={() => setIsLegalOpen(true)}>
                {t("passport.upload.legalNoticeTitle")}
              </Link>
            </div>
          </div>
        </div>

        {submitError ? (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {submitError}
          </p>
        ) : null}
      </Modal.Body>

      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="danger-soft" isDisabled={isUploading} onPress={onCancel}>
          {t("passport.upload.cancel")}
        </Button>
        <Button
          isDisabled={!file || !isConfirmed || !!expiryError}
          isPending={isUploading}
          onPress={() => void handleSubmit()}
        >
          {isUploading ? <Spinner size="sm" color="current" /> : null}
          {isUploading ? (pendingLabel ?? t("passport.upload.adding")) : (submitLabel ?? t("passport.upload.add"))}
        </Button>
      </Modal.Footer>

      <Modal isOpen={isLegalOpen} onOpenChange={setIsLegalOpen}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-3xl bg-card">
              <Modal.CloseTrigger className="cursor-pointer text-card-foreground" />
              <Modal.Header>
                <Modal.Heading className="flex items-center gap-2 font-nunito text-xl font-bold text-card-foreground">
                  <IconAlertTriangle size={20} className="text-warning" aria-hidden="true" />
                  {t("passport.upload.legalNoticeTitle")}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("passport.upload.legalNotice")}</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end">
                <Button className="cursor-pointer" onPress={() => setIsLegalOpen(false)}>
                  {t("passport.upload.gotIt")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
