"use client";

import BottomLinks from "./BottomLinks";
import ThirdPartySignIn from "./ThirdPartySignIn";
import AuthForm from "./AuthForm";
import RolePickerContinue from "./RolePickerContinue";
import { AuthProvider, useAuth } from "./AuthContext";
import LanguageToggle from "@/app/components/i18n/LanguageToggle";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { Separator, Button, Tabs, Alert } from "@heroui/react";

import { IconArrowLeft as ArrowLeft, IconKey as UserRoundKey, IconBuilding as Building, IconSparkles as Sparkles } from "@tabler/icons-react";

import Link from "next/link";

interface AuthWrapperProps {
  type: 'sign-in' | 'sign-up';
  initialRole?: 'tenant' | 'landlord';
  portalError?: string | null;
  showWelcomeNotice?: boolean;
  // Signed in with a confirmed email but no saved profile (interrupted sign-up).
  profileMissing?: boolean;
  rolePickerMode?: boolean;
  // Verification handoff only: where to resume after login
  // (/verify or /verify/mobile?token=...). Never an external URL.
  next?: string;
}

function AuthContent({ portalError, showWelcomeNotice, profileMissing, rolePickerMode, next }: { portalError?: string | null; showWelcomeNotice?: boolean; profileMissing?: boolean; rolePickerMode?: boolean; next?: string }) {
  const { type, role, setRole } = useAuth();
  const { t } = useTranslation();

  const description = type === 'sign-up'
    ? role === 'tenant' ? t("auth.signUp.description.tenant") : t("auth.signUp.description.landlord")
    : t("auth.signIn.description");

  return (
    // Outer: no horizontal padding (the page supplies fluid padding) and no
    // fixed height — the page scrolls when the viewport gets short. Only the
    // reading-width cap lives here.
    <div className="flex min-w-0 flex-1 flex-col bg-card">
      <div className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col py-[clamp(0.5rem,2vh,1.25rem)]">
        <div className="flex items-center justify-between">
          {/* Back Button: anchor outside the button so every click
              navigates (a link nested inside a button swallows clicks
              that land on the button padding). */}
          <Link href="/" aria-label={t("auth.backToHome")}>
            <Button
              isIconOnly
              variant="ghost"
              className="-ml-2"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <LanguageToggle />
        </div>

        {/* Headline scales with viewport width so it stays proportionate
            from 320px phones to 4K desktops without a breakpoint ladder. */}
        <div className="mt-[clamp(0.75rem,2vh,1.25rem)]">
          <h1 className="font-nunito font-semibold text-[clamp(1.75rem,5vw,2.5rem)] leading-tight text-foreground">
            {type === 'sign-up' ? t("auth.signUp.title") : t("auth.signIn.title")}
          </h1>
          <h3 className="mt-[clamp(0.5rem,1.5vh,0.75rem)] text-base text-foreground">
            {description}
          </h3>
        </div>

        {/* First-time Google arrival banner. The `!`-suffixed utilities
            below are intentional: @heroui/styles ships unlayered CSS,
            which beats layered Tailwind utilities without them. */}
        {type === 'sign-up' && showWelcomeNotice && (
          <Alert status="accent" className="mt-4 border border-primary/20 bg-accent!">
            <Alert.Indicator className="text-primary!">
              <Sparkles size={18} className="shrink-0" />
            </Alert.Indicator>
            <Alert.Content className="gap-1">
              <Alert.Title className="font-poppinsSemiBold text-foreground!">
                {t("auth.welcome.title")}
              </Alert.Title>
              <Alert.Description className="text-sm text-foreground/80!">
                {t("auth.welcome.body")}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {type === 'sign-up' && profileMissing && (
          <Alert status="accent" className="mt-4 border border-primary/20 bg-accent!">
            <Alert.Indicator className="text-primary!">
              <Sparkles size={18} className="shrink-0" />
            </Alert.Indicator>
            <Alert.Content className="gap-1">
              <Alert.Title className="font-poppinsSemiBold text-foreground!">
                {t("auth.welcome.finishTitle")}
              </Alert.Title>
              <Alert.Description className="text-sm text-foreground/80!">
                {t("auth.welcome.finishBody")}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {/* Role is chosen on sign-up only. Sign-in is role-agnostic and
            routes by the user's held roles after login. */}
        {type === 'sign-up' && (
          <Tabs
            selectedKey={role}
            onSelectionChange={(key) => setRole(key as 'tenant' | 'landlord')}
            className="mt-[clamp(0.75rem,2vh,1.25rem)]"
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label={t("auth.selectRole")}
                className="*:text-foreground"
              >
                {/* Tenant Tab */}
                <Tabs.Tab id="tenant" className="data-[selected=true]:text-primary">
                  <span className="flex items-center gap-1.5">
                    <UserRoundKey size={15} />
                    {t("auth.role.tenant")}
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>

                {/* Landlord Tab */}
                <Tabs.Tab id="landlord" className="data-[selected=true]:text-sky">
                  <Tabs.Separator />
                  <span className="flex items-center gap-1.5">
                    <Building size={15} />
                    {t("auth.role.landlord")}
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        )}


        {/* Pending-onboarding role picker: the user is already logged in
            with a placeholder profile. Show only the banner, the role
            selector above, and Continue. The email/password form, Google
            button, and footer links stay hidden. */}
        {rolePickerMode ? (
          <RolePickerContinue skipRoleStep={profileMissing} />
        ) : (
          <>
            {portalError && (
              <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg">
                <p className="text-sm text-red-600">{portalError}</p>
              </div>
            )}

            <AuthForm next={type === "sign-in" ? next : undefined} />

            {/* Divider */}
            <div className="mt-[clamp(1rem,2.5vh,1.25rem)] flex items-center gap-3">
              <Separator className="flex-1" />
              <p className="text-sm text-gray-400 whitespace-nowrap">
                {type === "sign-in" ? t("auth.orSignInWith") : t("auth.orSignUpWith")}
              </p>
              <Separator className="flex-1" />
            </div>

            <ThirdPartySignIn next={type === "sign-in" ? next : undefined} />

            <div className="mt-auto flex flex-col items-center gap-[clamp(0.75rem,2vh,1.25rem)] pt-[clamp(1.5rem,4vh,2rem)]">
              <BottomLinks />

              <div className="text-center text-sm text-default-500">
                APT Rental Platform &copy; {new Date().getFullYear()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthWrapper({ type, initialRole, portalError, showWelcomeNotice, profileMissing, rolePickerMode, next }: AuthWrapperProps) {
  return (
    <AuthProvider type={type} initialRole={initialRole}>
      <AuthContent portalError={portalError} showWelcomeNotice={showWelcomeNotice} profileMissing={profileMissing} rolePickerMode={rolePickerMode} next={next} />
    </AuthProvider>
  );
}