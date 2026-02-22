import { useState } from 'react';

const usePasswordValidation = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    passwordsMatch: password === confirmPassword && password !== '',
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  };
};

export { usePasswordValidation };