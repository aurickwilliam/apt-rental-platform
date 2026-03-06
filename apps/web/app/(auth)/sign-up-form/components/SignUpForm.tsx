"use client";

import { useState } from "react";

import {
  Form, Button, Input, Select, SelectItem, NumberInput, InputOtp,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure,
} from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";

import { PROVINCES } from "@repo/constants";

import {
  Minus,
  CircleCheck,
  Phone,
} from "lucide-react";

interface SignUpFormData {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  age: number | undefined;
  gender: string;
  mobileNumber: string;
  streetAddress: string;
  barangay: string;
  city: string;
  stateProvince: string;
  postalCode: number | undefined;
  password: string;
  confirmPassword: string;
}

export default function SignUpForm() {
  const { role, email } = useAuth();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState<SignUpFormData>({
    email: email,
    firstName: "",
    lastName: "",
    middleName: "",
    age: undefined,
    gender: "",
    mobileNumber: "",
    streetAddress: "",
    barangay: "",
    city: "",
    stateProvince: "",
    postalCode: undefined,
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field: keyof SignUpFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Validate form fields and send OTP to email
    console.log("Form data:", formData);
    onOpen();
  };

  const handleVerifyOtp = (onClose: () => void) => {
    // TODO: Verify OTP with backend
    console.log("Verifying OTP:", otp);
    console.log("Submitting form data:", formData);
    onClose();
  };

  // Gender Options
  const GENDER_OPTIONS = [
    "Male",
    "Female",
    "Others",
  ]

  return (
    <>
    <Form onSubmit={handleSubmit} className="flex flex-col gap-5 my-10">

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
          value={formData.email}
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
          value={formData.firstName}
          onValueChange={handleChange("firstName")}
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
          value={formData.lastName}
          onValueChange={handleChange("lastName")}
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
          value={formData.middleName}
          onValueChange={handleChange("middleName")}
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
          value={formData.age}
          onValueChange={(val) => setFormData((prev) => ({ ...prev, age: val === undefined ? undefined : Number(val) }))}
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
            selectedKeys={formData.gender ? [formData.gender] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              handleChange("gender")(selected ? String(selected) : "");
            }}
          >
            {GENDER_OPTIONS.map((gender) => (
              <SelectItem key={gender} className="data-[hover=true]:bg-light-blue!">
                {gender}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Mobile Number */}
        <Input
          isRequired
          label="Mobile Number"
          size='lg'
          placeholder='Enter your mobile number'
          labelPlacement="outside"
          name="mobileNumber"
          type="tel"
          variant='bordered'
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
          value={formData.mobileNumber}
          onValueChange={handleChange("mobileNumber")}
        />
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
          value={formData.streetAddress}
          onValueChange={handleChange("streetAddress")}
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
          value={formData.barangay}
          onValueChange={handleChange("barangay")}
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
          value={formData.city}
          onValueChange={handleChange("city")}
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
            selectedKeys={formData.stateProvince ? [formData.stateProvince] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              handleChange("stateProvince")(selected ? String(selected) : "");
            }}
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
          value={formData.postalCode}
          onValueChange={(val) => setFormData((prev) => ({ ...prev, postalCode: val === undefined ? undefined : Number(val) }))}
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
          value={formData.password}
          onChange={handleChange("password")}
        />

        <PasswordField
          isRequired
          label="Confirm Password"
          size='lg'
          placeholder='Confirm your password'
          labelPlacement="outside"
          name="confirmPassword"
          variant='bordered'
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
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

    {/* OTP Verification Modal */}
    <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        isDismissable={false}
        isKeyboardDismissDisabled
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Verify Your Mobile Number
              </ModalHeader>
              <ModalBody className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Phone size={32} className="text-primary" />
                </div>
                <p className="text-center text-sm text-default-500">
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-foreground">mobile number</span>.
                  <br />
                  Please enter it below.
                </p>
                <InputOtp
                  length={4}
                  size="lg"
                  variant="bordered"
                  color="primary"
                  value={otp}
                  onValueChange={setOtp}
                  autoFocus
                />
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                <Button
                  color="primary"
                  radius="full"
                  size="lg"
                  className="w-full"
                  isDisabled={otp.length < 4}
                  onPress={() => handleVerifyOtp(onClose)}
                >
                  Verify &amp; Create Account
                </Button>
                <Button
                  variant="light"
                  radius="full"
                  size="lg"
                  className="w-full"
                  onPress={onClose}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
