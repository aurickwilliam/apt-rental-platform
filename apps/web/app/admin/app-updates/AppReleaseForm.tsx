"use client";

import { useState, useTransition } from "react";
import { Button, FieldError, Input, Label, TextArea, TextField } from "@heroui/react";
import {
  APP_RELEASE_NOTES_MAX_LENGTH,
  validateAppRelease,
  type AppReleaseField,
  type AppReleaseInput,
} from "@repo/utils";
import { publishAppRelease } from "../actions/app-release";

interface CurrentRelease extends AppReleaseInput {
  updatedAt: string;
}

interface AppReleaseFormProps {
  current: CurrentRelease | null;
}

const DOWNLOAD_LINK_HINT =
  "On GitHub, attach the APK to a release under the same file name every time and use https://github.com/<owner>/<repo>/releases/latest/download/<file>.apk. The link then never changes.";

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

export default function AppReleaseForm({ current }: AppReleaseFormProps) {
  const [values, setValues] = useState<AppReleaseInput>({
    latestVersion: current?.latestVersion ?? "",
    minVersion: current?.minVersion ?? "",
    apkUrl: current?.apkUrl ?? "",
    releaseNotes: current?.releaseNotes ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AppReleaseField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [pending, startTransition] = useTransition();

  const update = (field: AppReleaseField) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setPublished(false);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateAppRelease(values);
    setFieldErrors(errors);
    setFormError(null);
    setPublished(false);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    for (const [field, value] of Object.entries(values)) formData.set(field, value);
    startTransition(async () => {
      try {
        const result = await publishAppRelease(formData);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        else if (result.error) setFormError(result.error);
        else setPublished(true);
      } catch (error) {
        console.error("Publishing the app release failed", error);
        setFormError("The release could not be published. Refresh and try again.");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5"
    >
      <div>
        <h2 className="font-nunito text-lg font-bold text-primary">Android release</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {current
            ? `Last published ${formatUpdatedAt(current.updatedAt)}. Saving replaces it for everyone.`
            : "Nothing is published yet, so no one sees an update prompt."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="latestVersion"
          value={values.latestVersion}
          onChange={update("latestVersion")}
          isRequired
          isInvalid={!!fieldErrors.latestVersion}
          isDisabled={pending}
        >
          <Label>Latest version</Label>
          <Input placeholder="1.1.0" inputMode="decimal" autoComplete="off" />
          <p className="text-xs text-muted-foreground">Must match the version in the new build. Older apps see an Update button.</p>
          <FieldError>{fieldErrors.latestVersion}</FieldError>
        </TextField>
        <TextField
          name="minVersion"
          value={values.minVersion}
          onChange={update("minVersion")}
          isRequired
          isInvalid={!!fieldErrors.minVersion}
          isDisabled={pending}
        >
          <Label>Required version</Label>
          <Input placeholder="1.0.0" inputMode="decimal" autoComplete="off" />
          <p className="text-xs text-muted-foreground">Apps older than this are blocked until they update. Use it only for breaking changes.</p>
          <FieldError>{fieldErrors.minVersion}</FieldError>
        </TextField>
      </div>

      <TextField
        name="apkUrl"
        value={values.apkUrl}
        onChange={update("apkUrl")}
        isRequired
        isInvalid={!!fieldErrors.apkUrl}
        isDisabled={pending}
      >
        <Label>APK download link</Label>
        <Input type="url" placeholder="https://github.com/owner/repo/releases/latest/download/apt.apk" autoComplete="off" />
        <p className="text-xs text-muted-foreground">{DOWNLOAD_LINK_HINT}</p>
        <FieldError>{fieldErrors.apkUrl}</FieldError>
      </TextField>

      <TextField
        name="releaseNotes"
        value={values.releaseNotes}
        onChange={update("releaseNotes")}
        isInvalid={!!fieldErrors.releaseNotes}
        isDisabled={pending}
      >
        <Label>What&apos;s new (optional)</Label>
        <TextArea rows={4} maxLength={APP_RELEASE_NOTES_MAX_LENGTH} placeholder="Shown to users above the Update button." />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {values.releaseNotes.length}/{APP_RELEASE_NOTES_MAX_LENGTH}
        </p>
        <FieldError>{fieldErrors.releaseNotes}</FieldError>
      </TextField>

      {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
      {published && <p role="status" className="text-sm text-success">Published. Apps pick it up the next time they open.</p>}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" isDisabled={pending} className="cursor-pointer">
          {pending ? "Publishing…" : "Publish release"}
        </Button>
      </div>
    </form>
  );
}
