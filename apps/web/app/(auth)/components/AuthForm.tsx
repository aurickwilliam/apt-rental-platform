"use client";

import { useActionState, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useAuth } from './AuthContext';
import { signIn, type SignInFormState } from '../actions/sign-in';
import { checkEmailAvailability } from '../actions/check-email-availability';

import { Form, Input, Link, Button, TextField, FieldError, Label } from '@heroui/react'

const initialState: SignInFormState = {
  error: null,
};

export default function AuthForm({ next }: { next?: string }) {
  const { type, role, email, setEmail } = useAuth();
  const router = useRouter();
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [state, formAction, isPending] = useActionState(signIn, initialState);

  const clearSignUpError = useCallback(() => {
    setSignUpError((current) => (current === null ? current : null));
  }, []);

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearSignUpError();
    },
    [setEmail, clearSignUpError],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      // Sign-in posts through the server action; only sign-up is intercepted.
      if (type !== 'sign-up') return;

      e.preventDefault();
      setSignUpError(null);

      const data = Object.fromEntries(new FormData(e.currentTarget));
      const rawEmail = (data.email as string | undefined)?.trim() ?? '';

      if (!rawEmail) {
        setSignUpError('Please enter your email.');
        return;
      }

      setCheckingEmail(true);

      const { exists, error } = await checkEmailAvailability(rawEmail);

      setCheckingEmail(false);

      if (error) {
        setSignUpError(error);
        return;
      }

      if (exists) {
        // Never grant a role without authentication: point them at sign-in;
        // adding a portal to an existing account happens from the profile.
        setSignUpError('This email is already registered. Please sign in, then add the role from your profile.');
        return;
      }

      const emailValue = encodeURIComponent(rawEmail);
      router.push(`/sign-up-form?role=${role}&email=${emailValue}`);
    },
    [type, role, router],
  );

  const busy = isPending || checkingEmail;
  const visibleError = state.error ?? signUpError;

  return (
    <div>
      {/* Error Message */}
      {visibleError && (
        <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg">
          <p className="text-sm text-red-600">{visibleError}</p>
        </div>
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
        >
          <Label>Email</Label>

          <Input placeholder="Enter your email" className="bg-card! text-foreground!" />

          <FieldError>
            {({ validationDetails }) => {
              if (validationDetails.valueMissing) {
                return "Email is required";
              }

              if (validationDetails.typeMismatch) {
                return "Enter a valid email";
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
                className="text-sm text-right text-secondary dark:text-[#FFA500] underline"
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