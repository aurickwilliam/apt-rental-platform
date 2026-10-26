"use client";

import { useState, useTransition } from "react";
import { Button, FieldError, Input, Label, Modal, TextArea, TextField } from "@heroui/react";
import { IconRocket } from "@tabler/icons-react";
import {
  APP_RELEASE_NOTES_MAX_LENGTH,
  validateAppRelease,
  type AppReleaseField,
  type AppReleaseInput,
} from "@repo/utils";
import ProfileSaveSuccessDialog from "@/app/components/profile/ProfileSaveSuccessDialog";
import { publishAppRelease } from "../actions/app-release";

interface PublishReleaseModalProps {
  // The live release: its values prefill the form, so a new version is a small edit.
  current: AppReleaseInput | null;
}

const EMPTY_RELEASE: AppReleaseInput = { latestVersion: "", minVersion: "", apkUrl: "", releaseNotes: "" };

const DOWNLOAD_LINK_HINT =
  "On GitHub, attach the APK to a release under the same file name every time and use https://github.com/<owner>/<repo>/releases/latest/download/<file>.apk. The link then never changes.";

export default function PublishReleaseModal({ current }: PublishReleaseModalProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [values, setValues] = useState<AppReleaseInput>(current ?? EMPTY_RELEASE);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AppReleaseField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  // The version stays set while the dialog fades out, so its text never blanks.
  const [publishedVersion, setPublishedVersion] = useState("");
  const [isPublishedOpen, setIsPublishedOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const openForm = () => {
    setValues(current ?? EMPTY_RELEASE);
    setFieldErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const update = (field: AppReleaseField) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateAppRelease(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    for (const [field, value] of Object.entries(values)) formData.set(field, value);
    startTransition(async () => {
      try {
        const result = await publishAppRelease(formData);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        else if (result.error) setFormError(result.error);
        else {
          setPublishedVersion(values.latestVersion);
          setIsFormOpen(false);
          setIsPublishedOpen(true);
        }
      } catch (error) {
        console.error("Publishing the app release failed", error);
        setFormError("The release could not be published. Refresh and try again.");
      }
    });
  };

  return (
    <>
      <Button variant="primary" onPress={openForm} className="cursor-pointer">
        <IconRocket size={18} aria-hidden="true" />
        Publish release
      </Button>

      <Modal isOpen={isFormOpen} onOpenChange={(open) => { if (!pending) setIsFormOpen(open); }}>
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog>
              <Modal.CloseTrigger isDisabled={pending} />
              <Modal.Header>
                <Modal.Heading className="font-nunito text-2xl font-bold text-primary">Publish a release</Modal.Heading>
                <p className="mt-1 text-sm text-muted-foreground">
                  Android apps check this on launch. Saving replaces the live release for everyone.
                </p>
              </Modal.Header>
              <form onSubmit={submit} noValidate>
                <Modal.Body className="space-y-4">
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
                </Modal.Body>
                <Modal.Footer className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="secondary" onPress={() => setIsFormOpen(false)} isDisabled={pending} className="w-full">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isDisabled={pending} className="w-full">
                    <IconRocket size={18} aria-hidden="true" />
                    {pending ? "Publishing…" : "Publish release"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ProfileSaveSuccessDialog
        isOpen={isPublishedOpen}
        onClose={() => setIsPublishedOpen(false)}
        title="Release published"
        message={`APT ${publishedVersion} is now the latest Android version. Installed apps pick it up the next time they open.`}
        actionLabel="Done"
      />
    </>
  );
}
