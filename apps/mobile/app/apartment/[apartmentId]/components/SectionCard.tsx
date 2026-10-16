import type { ReactNode } from 'react';
import { View } from 'react-native';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  appearance?: 'plain' | 'card';
}

// Shared section shell; only explicitly selected sections use card treatment.
export default function SectionCard({ children, className = '', appearance = 'plain' }: SectionCardProps) {
  return (
    <View
      className={`mx-5 ${appearance === 'card' ? 'bg-surface rounded-3xl border border-border p-5' : 'py-5 border-b border-border'} ${className}`}
    >
      {children}
    </View>
  );
}
