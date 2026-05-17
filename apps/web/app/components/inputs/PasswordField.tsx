"use client";

import { useState } from "react";
import { TextField, Label, InputGroup, FieldError } from "@heroui/react";

import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  errorMessage?: string;
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
}

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  errorMessage = "Please enter a valid password",
  isRequired = false,
  placeholder = "Enter your password",
  className,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      name={name}
      value={value}
      isRequired={isRequired}
      onChange={onChange}
      className={className}
    >
      <Label>{label}</Label>

      <InputGroup className="rounded-xl border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
        <InputGroup.Input
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
        />

        <InputGroup.Suffix>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsVisible((v) => !v)}
            className="text-muted focus:outline-none cursor-pointer placeholder:text-gray-400"
            aria-label="Toggle password visibility"
          >
            {isVisible 
              ? <EyeOff size={18} className="text-gray-400" /> 
              : <Eye size={18} className="text-gray-400" />
            }
          </button>
        </InputGroup.Suffix>
      </InputGroup>

      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}