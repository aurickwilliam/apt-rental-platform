import { useState } from 'react';

import { getPasswordRequirements } from '@repo/constants';

const usePasswordValidation = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordRequirements = getPasswordRequirements(password, confirmPassword);

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
