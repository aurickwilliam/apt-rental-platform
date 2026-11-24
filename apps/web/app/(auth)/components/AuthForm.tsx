"use client";

import { startTransition, useActionState, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useTranslation } from '@/app/components/i18n/LocaleProvider';
import { useAuth } from './AuthContext';
import { signIn, type SignInFormState } from '../actions/sign-in';
import { checkEmailAvailability } from '../actions/check-email-availability';
import { useConfirmEmail } from '../hooks/use-confirm-email';
import TurnstileWidget from '@/app/components/inputs/TurnstileWidget';
import { useCaptcha } from '@/hooks/use-captcha';
import { CAPTCHA_PENDING_MESSAGE, formatLockoutClock } from '@repo/utils';
import { useAuthLockout } from '@/hooks/use-auth-lockout';
import OtpModal from '../sign-up-form/components/OtpModal';
import AuthLockoutModal from './AuthLockoutModal';

import { Form, Input, Link, Button, TextField, FieldError, Label } from '@heroui/react'

const initialState: SignInFormState = {
  error: null,
};

type SignUpEmailError = {
  kind: 'required' | 'registered';
  email: string;
};

export default function AuthForm({ next }: { next?: string }) {
  const { t } = useTranslation();
  const { type, role, email, setEmail } = useAuth();
  const router = useRouter();
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpEmailError, setSignUpEmailError] = useState<SignUpEmailError | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Attempt limit on sign-in: the server reports the lock, the modal explains it
  // and Sign in stays disabled (kept across refreshes) until it ends.
  const signInLockout = useAuthLockout('signin', email);
  const { lock: lockSignIn } = signInLockout;

  const { attach: attachCaptcha, take: takeCaptcha } = useCaptcha();
  const [state, formAction, isPending] = useActionState(
    async (previous: SignInFormState, formData: FormData): Promise<SignInFormState> => {
      const attempt = takeCaptcha();
      if (attempt.pending) return { error: CAPTCHA_PENDING_MESSAGE };
      if (attempt.token) formData.set('captchaToken', attempt.token);
      const result = await signIn(previous, formData);
      if (result.lockedForSeconds) {
        const submittedEmail = formData.get('email');
        lockSignIn(result.lockedForSeconds, typeof submittedEmail === 'string' ? submittedEmail : undefined);
      }
      return result;
    },
    initialState,
  );
  const confirmEmail = useConfirmEmail(email, takeCaptcha);

  const clearSignUpError = useCallback(() => {
    setSignUpError((current) => (current === null ? current : null));
  }, []);

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearSignUpError();
      setSignUpEmailError(null);
    },
    [setEmail, clearSignUpError],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      if (type === 'sign-in') {
        // Dispatch the action ourselves instead of using the form's `action`: React
        // resets a form after its action finishes, which wiped the email (and with
        // it the sign-in lock, which is keyed by that email) after every attempt and
        // made people retype. Same pattern as Complete Profile.
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
        return;
      }
      if (type !== 'sign-up') return;

      e.preventDefault();
      setSignUpError(null);
      setSignUpEmailError(null);

      const data = Object.fromEntries(new FormData(e.currentTarget));
      const rawEmail = (data.email as string | undefined)?.trim() ?? '';

      if (!rawEmail) {
        setSignUpEmailError({ kind: 'required', email: rawEmail });
        return;
      }

      setCheckingEmail(true);

      try {
        const { exists, error } = await checkEmailAvailability(rawEmail);

        if (error) {
          setSignUpError(error);
          return;
        }

        if (exists) {
          // A conflict is not a role grant: existing accounts must sign in
          // and add any other role through their profile.
          setSignUpEmailError({ kind: 'registered', email: rawEmail });
          return;
        }

        const emailValue = encodeURIComponent(rawEmail);
        router.push(`/sign-up-form?role=${role}&email=${emailValue}`);
      } catch {
        console.error('Could not check signup email availability');
        setSignUpError(t('auth.error.emailCheck'));
      } finally {
        setCheckingEmail(false);
      }
    },
    [type, role, router, t, formAction],
  );

  const busy = isPending || checkingEmail;
  const signInLocked = type === 'sign-in' && signInLockout.isLocked;
  // A lock is explained by the modal, never by a red banner that would outlive it.
  const visibleError = type === 'sign-in'
    ? (state.lockedForSeconds ? null : state.error)
    : signUpError;
  const emailError = type === 'sign-up' && signUpEmailError?.email === email.trim()
    ? signUpEmailError
    : null;

  return (
    <div>
      {/* Error Message */}
      {visibleError && (
        <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg">
          <p className="text-sm text-red-600">{visibleError}</p>
          {type === 'sign-in' && state.needsEmailConfirmation && (
            <Link
              onPress={confirmEmail.open}
              className="mt-1 cursor-pointer text-sm font-medium text-primary"
            >
              {t('auth.resendConfirmation')}
            </Link>
          )}
        </div>
      )}

      {type === 'sign-in' && (
        <OtpModal
          isOpen={confirmEmail.isOpen}
          onOpenChange={(open) => {
            if (!open) confirmEmail.cancel();
          }}
          email={email.trim()}
          otp={confirmEmail.otp}
          otpError={confirmEmail.otpError}
          resendCooldown={confirmEmail.resendCooldown}
          resendLoading={confirmEmail.resendLoading}
          loading={confirmEmail.loading}
          formatCooldown={confirmEmail.formatCooldown}
          onOtpChange={confirmEmail.setOtp}
          onResend={confirmEmail.sendCode}
          onVerify={() => void confirmEmail.verify()}
          onCancel={(close) => {
            confirmEmail.cancel();
            close();
          }}
          verifyLabel={t("auth.signIn.verifyEmail")}
          locked={confirmEmail.otpLocked}
          lockoutSeconds={confirmEmail.lockoutSeconds}
        />
      )}

      {type === 'sign-in' && (
        <AuthLockoutModal
          isOpen={signInLockout.modalOpen}
          onOpenChange={signInLockout.setModalOpen}
          secondsLeft={signInLockout.secondsLeft}
        />
      )}

      {/* Form */}
      <Form
        className={`${visibleError ? 'mt-4' : 'mt-[clamp(1.5rem,4vh,2rem)]'} flex flex-col gap-[clamp(0.75rem,2vh,1rem)]`}
        onSubmit={onSubmit}
      >
        {/* Hidden field to pass the role to the server action */}
        <input type="hidden" name="role" value={role} />
        {/* Verification handoff: resume target re-validated server-side. */}
        {type === "sign-in" && next ? (
          <input type="hidden" name="next" value={next} />
        ) : null}

        <TextField
          name="email"
          type="email"
          isRequired
          value={email}
          onChange={handleEmailChange}
          isDisabled={busy}
          isInvalid={emailError ? true : undefined}
        >
          <Label>{t("auth.email")}</Label>

          <Input placeholder={t("auth.emailPlaceholder")} className="bg-card! text-foreground!" />

          <FieldError className="text-xs">
            {({ validationDetails }) => {
              if (validationDetails.valueMissing) {
                return t("auth.error.emailRequired");
              }

              if (validationDetails.typeMismatch) {
                return t("auth.error.invalidEmail");
              }

              if (emailError?.kind === 'required') return t("auth.error.emailRequired");

              if (emailError?.kind === 'registered') {
                return (
                  <>
                    <span className="block">{t("auth.error.emailRegistered")}</span>
                    <span className="mt-1 block text-muted-foreground">
                      <NextLink href="/sign-in" className="text-xs text-brand underline">
                        {t("auth.signIn.inline")}
                      </NextLink>{' '}
                      {t("auth.error.emailRegisteredHint")}
                    </span>
                  </>
                );
              }

              return null;
            }}
          </FieldError>
        </TextField>

        {
          type === 'sign-in' && (
            <>
              <PasswordField
                name="password"
                label={t("auth.password")}
                isRequired
                errorMessage={t("auth.error.passwordRequired")}
                placeholder={t("auth.passwordPlaceholder")}
              />

              <Link
                href="/forgot-password"
                className="text-sm text-right text-brand underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </>
          )
        }

        {type === 'sign-in' && <TurnstileWidget ref={attachCaptcha} />}

        <Button
          className='w-full mt-[clamp(0.75rem,2vh,1.25rem)]'
          size='lg'
          type='submit'
          isPending={busy}
          isDisabled={busy || signInLocked}
        >
          {signInLocked
            ? `Try again in ${formatLockoutClock(signInLockout.secondsLeft)}`
            : busy
              ? (type === 'sign-up' ? t('auth.checkingEmail') : t('auth.signingIn'))
              : (type === 'sign-up' ? t('auth.signUp.action') : t('auth.signIn.action'))
          }
        </Button>
      </Form>
    </div>
  );
}
