import { Select, useSelect } from 'heroui-native';
import { TouchableOpacity, Text } from 'react-native';

import {
  IconCaretDownFilled,
  IconCaretUpFilled,
  type IconProps,
} from "@tabler/icons-react-native";

import { COLORS } from '@repo/constants';

interface DropdownButtonProps {
  bottomSheetLabel: string;
  options: string[];
  value?: string | null;
  onSelect: (value: string) => void;
  buttonClassName?: string;
  textClassName?: string;
  iconProps?: IconProps;
  openIcon?: React.ComponentType<IconProps>;
  closeIcon?: React.ComponentType<IconProps>;
}

// Inner component — must live inside <Select> to access context
function TriggerIcon({
  openIcon: OpenIcon = IconCaretUpFilled,
  closeIcon: CloseIcon = IconCaretDownFilled,
  iconProps = { size: 26, color: COLORS.text },
}: Pick<DropdownButtonProps, 'openIcon' | 'closeIcon' | 'iconProps'>) {
  const { isOpen } = useSelect();
  const Icon = isOpen ? OpenIcon : CloseIcon;
  return <Icon {...iconProps} />;
}

export default function DropdownButton({
  bottomSheetLabel,
  options,
  value,
  onSelect,
  buttonClassName,
  textClassName,
  iconProps = { size: 26, color: COLORS.text },
  openIcon = IconCaretUpFilled,
  closeIcon = IconCaretDownFilled,
}: DropdownButtonProps) {

  // HeroUI Select expects SelectOption ({ value, label })
  // Since options are plain strings, value === label
  const selectedOption = value
    ? { value, label: value }
    : undefined;

  const defaultButtonClassName =
    'bg-darkerWhite px-2 py-1 rounded-xl flex-row items-center justify-start self-start gap-1';
  const defaultTextClassName = 'text-text text-base font-interMedium';

  return (
    <Select
      presentation="bottom-sheet"
      value={selectedOption}
      onValueChange={(option) => {
        if (option && !Array.isArray(option)) {
          onSelect(option.value);
        }
      }}
    >
      {/* Custom trigger button */}
      <Select.Trigger variant="unstyled" asChild>
        <TouchableOpacity className={buttonClassName || defaultButtonClassName}>
          <Text className={textClassName || defaultTextClassName}>
            {value}
          </Text>
          <TriggerIcon
            openIcon={openIcon}
            closeIcon={closeIcon}
            iconProps={iconProps}
          />
        </TouchableOpacity>
      </Select.Trigger>

      <Select.Portal>
        <Select.Overlay />
        <Select.Content
          presentation="bottom-sheet"
          snapPoints={['50%', '75%']}
          contentContainerClassName="px-4 pt-4 pb-20"
        >
          <Select.ListLabel className="text-lg text-center text-text font-interMedium border-b border-grey-200 pb-3 mb-4">
            {bottomSheetLabel}
          </Select.ListLabel>

          {options.map((option) => (
            <Select.Item
              key={option}
              value={option}
              label={option}
              className="p-4 rounded-lg bg-darkerWhite mb-2"
            />
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}