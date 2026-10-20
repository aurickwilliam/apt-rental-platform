import Link from "next/link";

import { Button, Surface } from "@heroui/react";

import {
  IconBrandAndroid,
  IconBuildingSkyscraper,
  IconCircleCheck,
  IconCreditCard,
  IconMessageCircle,
  IconShieldCheck,
} from "@tabler/icons-react";

const APP_FEATURES = [
  { icon: <IconCreditCard size={18} />, label: "Pay rent with GCash, Maya, QRPh or card" },
  { icon: <IconMessageCircle size={18} />, label: "Chat with your landlord in real time" },
  { icon: <IconShieldCheck size={18} />, label: "Keep your APT Passport documents ready to attach" },
];

const INSTALL_STEPS = [
  "Tap Download for Android and save the file.",
  "Open the file and allow installs from your browser when Android asks.",
  "Sign in with the same account you use on the web.",
];

/**
 * Mobile-app section of the landing page. Rendered only when the APK download
 * is configured — see `NEXT_PUBLIC_APT_APK_URL` in the page. The download
 * button always points at `/download`, so swapping the hosted file never
 * requires a code change.
 */
export default function AppSection() {
  return (
    <section className="mb-16 mt-16 md:mt-24">
      <Surface className="overflow-hidden rounded-3xl border border-divider bg-secondary">
        <div className="grid items-center gap-10 p-8 md:p-12 lg:grid-cols-2">
          {/* Copy */}
          <div className="flex flex-col gap-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
              APT Mobile
            </span>

            <h2 className="font-nunito text-3xl font-bold text-brand md:text-4xl">
              Carry your rental in your pocket
            </h2>

            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              The APT Android app puts rent day, landlord chats and your verified
              documents a thumb-tap away — the same account and data as the web.
            </p>

            <ul className="flex flex-col gap-3">
              {APP_FEATURES.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <span className="text-primary">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/download" prefetch={false} className="inline-flex">
                <Button variant="primary">
                  <IconBrandAndroid size={18} />
                  Download for Android
                </Button>
              </Link>

              <span className="text-xs text-muted-foreground">
                Android only for now — the APK installs directly.
              </span>
            </div>

            <div className="grid gap-2 border-t border-divider pt-4">
              {INSTALL_STEPS.map((step, index) => (
                <div key={step} className="flex items-start gap-2">
                  <IconCircleCheck size={16} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {index + 1}.
                    </span>{" "}
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative phone frame — pure tokens, no external screenshot. */}
          <div className="mx-auto w-full max-w-[260px]">
            <div className="rounded-[2.5rem] border border-border bg-background p-2.5 shadow-sm">
              <div className="flex flex-col gap-3 rounded-[2rem] bg-card p-4">
                <div className="mx-auto h-1.5 w-14 rounded-full bg-muted" />

                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <IconBuildingSkyscraper size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">APT</p>
                    <p className="text-[10px] text-muted-foreground">
                      Your rentals
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                    Rent due
                  </p>
                  <p className="font-nunito text-lg font-bold text-primary">
                    ₱12,500
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Due in 5 days · GCash
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-divider p-2.5">
                  <div className="size-7 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold">
                      Landlord
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      See you on move-in day!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-divider p-2.5">
                  <IconShieldCheck size={16} className="text-success" />
                  <p className="text-[10px] font-medium">
                    APT Passport verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </section>
  );
}
