import { ScrollView, Text, View } from "react-native";

import { type AIChatMessage } from "hooks/chat";
import ApartmentCard from "components/cards/ApartmentCard";

import { SuggestionChipFlex } from "./SuggestionChip";

const LISTING_CARD_WIDTH = 200;

interface MessageBubbleProps {
  message: AIChatMessage;
  onQuickReplyPress: (text: string) => void;
  onListingPress: (apartmentId: string) => void;
  isFavorite: (apartmentId: string) => boolean;
  onToggleFavorite: (apartmentId: string) => void;
}

// The tenant's messages sit in a soft bubble on the right; Ava's replies read
// as plain full-width text, so the answer and its listings get the room.
export default function MessageBubble({
  message,
  onQuickReplyPress,
  onListingPress,
  isFavorite,
  onToggleFavorite,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <View className="mb-6 items-end">
        <View className="max-w-[85%] rounded-3xl bg-surface-tertiary px-4 py-2.5">
          <Text className="text-base font-inter leading-6 text-foreground">
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6" accessibilityLabel={`Ava: ${message.text}`}>
      <Text className="text-base font-inter leading-7 text-foreground" selectable>
        {message.text}
      </Text>

      {/* Real listings found with the filters Ava understood */}
      {message.listings && message.listings.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-4"
          contentContainerClassName="gap-3 px-4"
          accessibilityLabel="Matching apartments"
        >
          {message.listings.map((listing) => (
            <ApartmentCard
              key={listing.id}
              {...listing}
              fixedWidth={LISTING_CARD_WIDTH}
              isFavorite={isFavorite(listing.id)}
              onPress={() => onListingPress(listing.id)}
              onPressFavorite={() => onToggleFavorite(listing.id)}
            />
          ))}
        </ScrollView>
      )}

      {message.quickReplies && message.quickReplies.length > 0 && (
        <View className="mt-3">
          <SuggestionChipFlex
            suggestions={message.quickReplies}
            onSelect={onQuickReplyPress}
          />
        </View>
      )}
    </View>
  );
}
