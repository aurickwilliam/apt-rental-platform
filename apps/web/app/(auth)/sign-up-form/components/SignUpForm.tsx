"use client";

import { Form, Button, Input, Select, SelectItem, NumberInput } from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";

import { PROVINCES } from "@repo/constants";

import {
  Minus,
  CircleCheck,
} from "lucide-react";

export default function SignUpForm() {
  const { role, email } = useAuth();

  // Gender Options
  const GENDER_OPTIONS = [
    "Male",
    "Female",
    "Others",
  ]

  return (
    <Form className="flex flex-col gap-5 my-10">

      {/* Personal Information */}
      <h2 className="text-2xl font-semibold mb-3">
        Personal Information
      </h2>

      <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Email Address */}
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
          defaultValue={email}
          disabled
        />

        {/* First Name*/}
        <Input
          isRequired
          label="First Name"
          size='lg'
          placeholder='Enter your first name'
          labelPlacement="outside"
          name="firstName"
          type="text"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* Last Name */}
        <Input
          isRequired
          label="Last Name"
          size='lg'
          placeholder='Enter your last name'
          labelPlacement="outside"
          name="lastName"
          type="text"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* Middle Name */}
        <Input
          label="Middle Name"
          size='lg'
          placeholder='Enter your middle name (optional)'
          labelPlacement="outside"
          name="middleName"
          type="text"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* Age */}
        <NumberInput
          isRequired
          label="Age"
          size='lg'
          placeholder='Enter your age'
          labelPlacement="outside"
          name="age"
          variant='bordered'
          hideStepper
          minValue={0}
          maxValue={120}
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* Gender */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium">
            Gender <span className="text-danger">*</span>
          </label>

          <Select
            disableAnimation
            isRequired
            size='lg'
            placeholder='Select your gender'
            name="gender"
            variant='bordered'
            classNames={{
              base: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
          >
            {GENDER_OPTIONS.map((gender) => (
              <SelectItem key={gender} className="data-[hover=true]:bg-light-blue!">
                {gender}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Address Information */}
      <h2 className="text-2xl font-semibold mb-3 mt-10">
        Address Information
      </h2>

      <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Street Address */}
        <Input
          isRequired
          label="Street Address"
          size='lg'
          placeholder='Enter your street address'
          labelPlacement="outside"
          name="streetAddress"
          type="text"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* Barangay */}
        <Input
          isRequired
          label="Barangay"
          size='lg'
          placeholder='Enter your barangay'
          labelPlacement="outside"
          name="barangay"
          type="text"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* City */}
        <Input
          isRequired
          label="City"
          size='lg'
          placeholder='Enter your city'
          labelPlacement="outside"
          name="city"
          type="text"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        {/* State/Province */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium">
            State/Province <span className="text-danger">*</span>
          </label>
          <Select
            isRequired
            placeholder='Select your state/province'
            name="stateProvince"
            variant='bordered'
            size='lg'
            classNames={{
              trigger: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            className="w-full"
          >
            {PROVINCES.map((province) => (
              <SelectItem key={province} className="data-[hover=true]:bg-light-blue!">
                {province}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Postal Code */}
        <NumberInput
          isRequired
          label="Postal Code"
          size='lg'
          placeholder='Enter your postal code'
          labelPlacement="outside"
          name="postalCode"
          variant='bordered'
          hideStepper
          maxValue={9999}
          minValue={1000}
          formatOptions={{ useGrouping: false }}
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />
      </div>

      {/* Password */}
      <h2 className="text-2xl font-semibold mb-3 mt-10">
        Set Your Password
      </h2>

      <div className="w-full grid grid-cols-2 gap-5 md:grid-cols-2">
        <PasswordField
          isRequired
          label="Password"
          size='lg'
          placeholder='Create a password'
          labelPlacement="outside"
          name="password"
          variant='bordered'
        />

        <PasswordField
          isRequired
          label="Confirm Password"
          size='lg'
          placeholder='Confirm your password'
          labelPlacement="outside"
          name="confirmPassword"
          variant='bordered'
        />

        {/* Requirements Password */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CircleCheck size={24} className="text-green-500" />
            <p className="text-sm text-gray-600">
              At least 8 characters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CircleCheck size={24} className="text-green-500" />
            <p className="text-sm text-gray-600">
              Contains uppercase and lowercase letters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CircleCheck size={24} className="text-green-500" />
            <p className="text-sm text-gray-600">
              Includes at least one number
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CircleCheck size={24} className="text-green-500" />
            <p className="text-sm text-gray-600">
              Contains at least one special character
            </p>
          </div>

           <div className="flex items-center gap-2">
            <Minus size={24} className="text-gray-400" />
            <p className="text-sm text-gray-600">
              Does not contain your personal information
            </p>
           </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        color="primary"
        className='w-full mt-5 md:max-w-[300px] md:self-end'
        size='lg'
        radius="full"
        type='submit'
      >
        Sign Up
      </Button>
    </Form>
  );
}
