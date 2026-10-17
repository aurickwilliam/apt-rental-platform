import { Keyboard } from "react-native";
import { SearchField, useBottomSheetAwareHandlers } from "heroui-native";

interface PropertySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PropertySearch({
  value,
  onChange,
}: PropertySearchProps) {
  const handlers = useBottomSheetAwareHandlers();
  return (
    <SearchField value={value} onChange={onChange}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input
          accessibilityLabel="Search properties"
          placeholder="Search properties…"
          autoCorrect={false}
          autoFocus={false}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          {...handlers}
        />
        <SearchField.ClearButton accessibilityLabel="Clear property search" />
      </SearchField.Group>
    </SearchField>
  );
}
