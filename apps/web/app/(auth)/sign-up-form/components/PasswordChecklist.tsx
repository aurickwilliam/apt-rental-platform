import { Minus, CircleCheck, CircleX } from "lucide-react";

interface PasswordChecklistProps {
  password: string;
  confirmPassword: string;
}

function CheckIcon({ password, isValid }: { password: string; isValid: boolean }) {
  if (password.length === 0) return <Minus size={24} className="text-gray-400" />;
  return isValid
    ? <CircleCheck size={24} className="text-green-500" />
    : <CircleX size={24} className="text-red-500" />;
}

export default function PasswordChecklist({
  password,
  confirmPassword,
}: PasswordChecklistProps) {
  const checks = [
    {
      isValid: password.length >= 8,
      label: "At least 8 characters",
    },
    {
      isValid: /[A-Z]/.test(password) && /[a-z]/.test(password),
      label: "Contains uppercase and lowercase letters",
    },
    {
      isValid: /[0-9]/.test(password),
      label: "Includes at least one number",
    },
    {
      isValid: /[^A-Za-z0-9]/.test(password),
      label: "Contains at least one special character",
    },
  ];

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {checks.map(({ isValid, label }) => (
        <div key={label} className="flex items-center gap-2">
          <CheckIcon password={password} isValid={isValid} />
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      ))}

      <div className="flex items-center gap-2">
        {confirmPassword.length === 0 ? (
          <Minus size={24} className="text-gray-400" />
        ) : passwordsMatch ? (
          <CircleCheck size={24} className="text-green-500" />
        ) : (
          <CircleX size={24} className="text-red-500" />
        )}
        <p className="text-sm text-gray-600">Passwords match</p>
      </div>
    </div>
  );
}