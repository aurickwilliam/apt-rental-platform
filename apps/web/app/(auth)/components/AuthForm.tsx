"use client";

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useAuth } from './AuthContext';
import { signIn, type SignInFormState } from '../actions/sign-in';
import { checkEmailAvailability } from '../actions/check-email-availability';

import { Form, Input, Link, Button, TextField, FieldError, Label } from '@heroui/react'

const initialState: SignInFormState = {
  error: null,
};

export default function AuthForm() {
  const { type, role, email, setEmail } = useAuth();
  const router = useRouter();
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [state, formAction, isPending] = useActionState(signIn, initialState);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (type === 'sign-up') {
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
        setSignUpError('This email is already registered. Please sign in instead.');
        return;
      }

      const emailValue = encodeURIComponent(rawEmail);
      router.push(`/sign-up-form?role=${role}&email=${emailValue}`);
      return;
    }
  };

  return (
    <div>
      {/* Error Message */}
      {(state.error || signUpError) && (
        <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg">
          <p className="text-sm text-red-600">{state.error ?? signUpError}</p>
        </div>
      )}

      {/* Form */}
      <Form
        className={`${state.error || signUpError ? 'mt-4' : 'mt-8'} flex flex-col gap-4`}
        action={type === 'sign-in' ? formAction : undefined}
        onSubmit={onSubmit}
      >
        {/* Hidden field to pass the role to the server action */}
        <input type="hidden" name="role" value={role} />

        <TextField
          name="email"
          type="email"
          isRequired
          value={email}
          onChange={(value) => {
            setEmail(value);

            if (signUpError) {
              setSignUpError(null);
            }
          }}
          isDisabled={isPending || checkingEmail}
        >
          <Label>Email</Label>

          <Input placeholder="Enter your email"/>

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
                href="/(auth)/forgot-password" 
                className="text-sm text-right text-secondary underline"
              >
                Forgot Password?
              </Link>
            </>
          )
        }

        <Button
          className='w-full mt-5'
          size='lg'
          type='submit'
          isPending={isPending || checkingEmail}
          isDisabled={isPending || checkingEmail}
        >
          {isPending || checkingEmail
            ? (type === 'sign-up' ? 'Checking Email...' : 'Signing In...')
            : (type === 'sign-up' ? 'Sign Up' : 'Sign In')
          }
        </Button>
      </Form>
    </div>
  );
}
