"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useAuth } from './AuthContext';

import { Form, Input, Link, Button } from '@heroui/react'

export default function AuthForm() {
  const { type, role } = useAuth();
  const router = useRouter();

  const [submittedData, setSubmittedData] = useState({});

  const onSubmit = (e: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    setSubmittedData(data);

    if (type === 'sign-up') {
      const email = encodeURIComponent(data.email as string);
      router.push(`/sign-up-form?role=${role}&email=${email}`);
    } else {
      // Handle sign-in logic here
      console.log(submittedData);
    }
  };

  return (
    <div>
      {/* Form */}
      <Form className='mt-16 flex flex-col gap-5' onSubmit={onSubmit}>
        <Input
          isRequired
          label="Email"
          size='lg'
          placeholder='Enter your email'
          labelPlacement="outside"
          name="email"
          type="email"
          variant='bordered'
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
        >
          {type === 'sign-up' ? 'Sign Up' : 'Sign In'}
        </Button>
      </Form>
    </div>
  );
}
