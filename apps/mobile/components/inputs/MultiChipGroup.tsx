import { TouchableOpacity, View, Text } from "react-native";

export default function MultiChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            className={`py-2 px-4 rounded-full border ${
              active ? 'bg-primary border-primary' : 'bg-white border-[#D8D8D8]'
            }`}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}
          >
            <Text
              className={`font-[Poppins_500Medium] text-[13px] ${
                active ? 'text-white' : 'text-[#555555]'
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}