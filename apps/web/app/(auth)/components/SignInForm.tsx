"use client";

import { useState } from 'react';

import PasswordField from '@/app/components/inputs/PasswordField';
import { useAuth } from './AuthContext';

import { Form, Input, Link, Button } from '@heroui/react'

export default function SignInForm() {
  const { type } = useAuth();

  const [submittedData, setSubmittedData] = useState({});

  const onSubmit = (e: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    setSubmittedData(data);

    console.log(submittedData);
  };

  return (
    <div>
      {/* Form */}
      <Form className='mt-16 flex flex-col gap-3' onSubmit={onSubmit}>
        <Input
          isRequired
          errorMessage="Please enter a valid email"
          label="Email"
          labelPlacement="inside"
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
                isRequired
                errorMessage="Please enter your password"
                label="Password"
                labelPlacement="inside"
                name="password"
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