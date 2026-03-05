"use client"

import { useState } from "react"

import { Button, Input } from "@heroui/react"

import {
  Eye,
  EyeClosed,
} from "lucide-react"

interface PasswordFieldProps {
  label: string
  name: string
  value?: string
  onChange?: (value: string) => void
  variant?: "bordered" | "underlined" | "flat" | "faded" | undefined
  errorMessage?: string
  labelPlacement?: "inside" | "outside" | "outside-left" | "outside-top" | undefined
  isRequired?: boolean
}

export default function PasswordField({ 
  label, 
  name, 
  value,
  onChange,
  variant = "bordered",
  errorMessage = "Please enter a valid password",
  labelPlacement = "inside",
  isRequired = false,
}: PasswordFieldProps) {

  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Input
      isRequired={isRequired}
      errorMessage={errorMessage}
      label={label}
      labelPlacement={labelPlacement}
      name={name}
      value={value}
      onValueChange={onChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      type={isVisible ? "text" : "password"}
      variant={variant}
      classNames={{
        inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
      }}
      endContent={
        isFocused && (
          <Button
            isIconOnly
            variant="light"
            radius="full"
          >
            {
              isVisible ? (
                <EyeClosed 
                  className="text-gray-500"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input from losing focus
                    setIsVisible(false)
                  }}
                />
              ) : (
                <Eye 
                  className="text-gray-500"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input from losing focus
                    setIsVisible(true)
                  }}
                />
              )
            }
          </Button>
        )
      }
    />
  );
}