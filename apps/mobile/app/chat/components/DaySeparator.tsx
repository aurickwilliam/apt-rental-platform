import { Text } from 'react-native'

interface DaySeparatorProps {
  label: string;
}

/** Centered date divider between days in the thread, e.g. "Oct 20, 2026" (matches web). */
export default function DaySeparator({ label }: DaySeparatorProps) {
  return (
    <Text
      className="my-5 text-center text-[11px] font-inter text-gray-500"
      accessibilityRole="header"
    >
      {label}
    </Text>
  );
}
