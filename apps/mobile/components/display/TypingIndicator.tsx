import { View, Text } from 'react-native';

export default function TypingIndicator() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#9CA3AF',
              opacity: 0.6 + i * 0.2,
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>typing…</Text>
    </View>
  );
}