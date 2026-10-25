"use client";

import { useActionState, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useAuth } from './AuthContext';
import { signIn, type SignInFormState } from '../actions/sign-in';
import { checkEmailAvailability } from '../actions/check-email-availability';
import { useConfirmEmail } from '../hooks/use-confirm-email';
import OtpModal from '../sign-up-form/components/OtpModal';

import { Form, Input, Link, Button, TextField, FieldError, Label } from '@heroui/react'

const initialState: SignInFormState = {
  error: null,
};

type SignUpEmailError = {
  kind: 'required' | 'registered';
  email: string;
};

export default function AuthForm({ next }: { next?: string }) {
  const { type, role, email, setEmail } = useAuth();
  const router = useRouter();
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpEmailError, setSignUpEmailError] = useState<SignUpEmailError | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const confirmEmail = useConfirmEmail(email);

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
      // Sign-in posts through the server action; only sign-up is intercepted.
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
        setSignUpError('Could not validate your email right now. Please try again.');
      } finally {
        setCheckingEmail(false);
      }
    },
    [type, role, router],
  );

  const busy = isPending || checkingEmail;
  const visibleError = type === 'sign-in' ? state.error : signUpError;
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
              Send me a new code
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
          verifyLabel="Verify Email"
          locked={confirmEmail.otpLocked}
        />
      )}

      {/* Form */}
      <Form
        className={`${visibleError ? 'mt-4' : 'mt-[clamp(1.5rem,4vh,2rem)]'} flex flex-col gap-[clamp(0.75rem,2vh,1rem)]`}
        action={type === 'sign-in' ? formAction : undefined}
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
          <Label>Email</Label>

          <Input placeholder="Enter your email" className="bg-card! text-foreground!" />

          <FieldError className="text-xs">
            {({ validationDetails }) => {
              if (validationDetails.valueMissing) {
                return "Email is required";
              }

              if (validationDetails.typeMismatch) {
                return "Enter a valid email";
              }

              if (emailError?.kind === 'required') return "Email is required";

              if (emailError?.kind === 'registered') {
                return (
                  <>
                    <span className="block">This email is already registered.</span>
                    <span className="mt-1 block text-muted-foreground">
                      <NextLink href="/sign-in" className="text-xs text-brand underline">
                        Sign in
                      </NextLink>{' '}
                      to your existing account to add another role.
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
                label="Password"
                isRequired
                errorMessage="Please enter your password"
                placeholder='Enter your password'
              />

              <Link
                href="/forgot-password"
                className="text-sm text-right text-brand underline"
              >
                Forgot Password?
              </Link>
            </>
          )
        }

        <Button
          className='w-full mt-[clamp(0.75rem,2vh,1.25rem)]'
          size='lg'
          type='submit'
          isPending={busy}
          isDisabled={busy}
        >
          {busy
            ? (type === 'sign-up' ? 'Checking Email...' : 'Signing In...')
            : (type === 'sign-up' ? 'Sign Up' : 'Sign In')
          }
        </Button>
      </Form>
    </div>
  );
}
