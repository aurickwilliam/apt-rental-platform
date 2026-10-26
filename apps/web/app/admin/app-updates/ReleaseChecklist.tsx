import { IconListCheck } from "@tabler/icons-react";
import { suggestNextAppVersion } from "@repo/utils";
import { githubRepoFromUrl } from "@/lib/app-release-link";
import CopyButton from "./CopyButton";
import { CARD_CLASSES, CARD_HEADING_CLASSES } from "./LiveReleaseCard";

const BUILD_COMMAND = "cd apps/mobile && npx eas-cli build --platform android --profile production";

interface ReleaseChecklistProps {
  latestVersion: string | null;
  apkUrl: string | null;
}

function Command({ value, label }: { value: string; label: string }) {
  return (
    <div className="mt-2 flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all rounded-lg bg-muted px-3 py-2 text-xs text-foreground">{value}</code>
      <CopyButton value={value} label={label} />
    </div>
  );
}

export default function ReleaseChecklist({ latestVersion, apkUrl }: ReleaseChecklistProps) {
  const nextVersion = suggestNextAppVersion(latestVersion) ?? "1.0.1";
  const repo = (apkUrl ? githubRepoFromUrl(apkUrl) : null) ?? "<owner>/<repo>";
  const releaseCommand = `gh release create v${nextVersion} apt.apk --repo ${repo} --title "APT ${nextVersion}" --notes "What changed"`;

  const steps = [
    {
      title: `Raise the version to ${nextVersion}`,
      body: (
        <p className="text-xs text-muted-foreground">
          Change <code>version</code> in <code>apps/mobile/app.config.js</code> and merge it to <code>main</code>.
        </p>
      ),
    },
    {
      title: "Build the APK",
      body: <Command value={BUILD_COMMAND} label="Copy build command" />,
    },
    {
      title: "Upload it to GitHub",
      body: (
        <>
          <p className="text-xs text-muted-foreground">
            Download the APK from the build page, rename it <code>apt.apk</code>, then run this next to it.
          </p>
          <Command value={releaseCommand} label="Copy release command" />
        </>
      ),
    },
    {
      title: "Check the link, then publish",
      body: (
        <p className="text-xs text-muted-foreground">
          Publish the new version here once the link above says it works.
        </p>
      ),
    },
  ];

  return (
    <section aria-labelledby="release-checklist-heading" className={CARD_CLASSES}>
      <h2 id="release-checklist-heading" className={CARD_HEADING_CLASSES}>
        <IconListCheck size={20} aria-hidden="true" />
        Release checklist
      </h2>
      <ol className="mt-3 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              {step.body}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        Only JavaScript changed (no new native package, permission or SDK)? Skip the build and upload, and ship it over the air
        with <code>pnpm --filter mobile ota &quot;What changed&quot;</code> instead. Users get it without installing a new APK.
      </p>
    </section>
  );
}
