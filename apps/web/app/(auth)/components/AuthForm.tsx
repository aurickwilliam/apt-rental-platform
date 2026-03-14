"use client";

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useAuth } from './AuthContext';
import { signIn, type SignInFormState } from '../actions/sign-in';

import { Form, Input, Link, Button } from '@heroui/react'

const initialState: SignInFormState = {
  error: null,
};

export default function AuthForm() {
  const { type, role, email, setEmail } = useAuth();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(signIn, initialState);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (type === 'sign-up') {
      // For sign-up, we don't use the server action — just navigate to the sign-up form
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const emailValue = encodeURIComponent(data.email as string);
      router.push(`/sign-up-form?role=${role}&email=${emailValue}`);
      return;
    }

    // For sign-in, let the form action handle it (don't prevent default)
    // The hidden role field will be included in the FormData
  };

  return (
    <div>
      {/* Error Message */}
      {state.error && (
        <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger">{state.error}</p>
        </div>
      )}

      {/* Form */}
      <Form
        className={`${state.error ? 'mt-5' : 'mt-16'} flex flex-col gap-5`}
        action={type === 'sign-in' ? formAction : undefined}
        onSubmit={onSubmit}
      >
        {/* Hidden field to pass the role to the server action */}
        <input type="hidden" name="role" value={role} />

        <Input
          isRequired
          label="Email"
          size='lg'
          placeholder='Enter your email'
          labelPlacement="outside"
          name="email"
          type="email"
          variant='bordered'
          value={email}
          onValueChange={setEmail}
          isDisabled={isPending}
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {
          type === 'sign-in' && (
            <>
              <PasswordField
                name="password"
                label="Password"
                isRequired
                errorMessage="Please enter your password"
                labelPlacement="outside"
                placeholder='Enter your password'
                size='lg'
              />

              <Link href="/(auth)/forgot-password" className="text-sm text-right text-secondary underline">
                Forgot Password?
              </Link>
            </>
          )
        }

        <Button
          color="primary"
          className='w-full mt-5'
          size='lg'
          radius="full"
          type='submit'
          isLoading={isPending}
          isDisabled={isPending}
        >
          {isPending
            ? (type === 'sign-up' ? 'Signing Up...' : 'Signing In...')
            : (type === 'sign-up' ? 'Sign Up' : 'Sign In')
          }
        </Button>
      </Form>
    </div>
  );
}
