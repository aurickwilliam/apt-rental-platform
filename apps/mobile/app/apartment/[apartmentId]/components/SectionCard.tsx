import type { ReactNode } from 'react';
import { View } from 'react-native';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  /** No card padding, so the content (e.g. a map) sets its own inset. */
  flush?: boolean;
}

// Shared card shell for the apartment page sections (DESIGN.md: mobile primary card).
export default function SectionCard({ children, className = '', flush = false }: SectionCardProps) {
  return (
    <View
      className={`mx-5 bg-surface rounded-3xl border border-border ${
        flush ? 'overflow-hidden' : 'p-5'
      } ${className}`}
    >
      {children}
    </View>
  );
}
