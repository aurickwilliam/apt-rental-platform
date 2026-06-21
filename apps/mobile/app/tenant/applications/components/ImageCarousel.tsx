import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useState } from "react";
import ImageViewing from "react-native-image-viewing";

type ApartmentImage = {
  id: string;
  url: string;
  is_cover: boolean;
};

type Props = {
  images: ApartmentImage[];
};

const CARD_WIDTH = 260;
const IMAGE_HEIGHT = 220;

export default function ImageCarousel({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const sortedImages = [...images].sort(
    (a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0),
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12),
    );
    setActiveIndex(index);
  };

  const handleImagePress = (index: number) => {
    setImageIndex(index);
    setIsImageViewerOpen(true);
  };

  if (sortedImages.length === 0) return null;

  return (
    <View className="mt-4">
      <FlatList
        data={sortedImages}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 mb-2"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item, index }) => (
          <TouchableOpacity
            className="overflow-hidden rounded-3xl"
            activeOpacity={0.7}
            onPress={() => handleImagePress(index)}
          >
            <Image
              source={{ uri: item.url }}
              style={{ width: CARD_WIDTH, height: IMAGE_HEIGHT }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />

      {sortedImages.length > 1 && (
        <View className="flex flex-row justify-center gap-1.5">
          {sortedImages.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeIndex ? "#6366f1" : "#d1d5db",
              }}
            />
          ))}
        </View>
      )}

      <ImageViewing
        images={sortedImages.map((img) => ({ uri: img.url }))}
        imageIndex={imageIndex}
        visible={isImageViewerOpen}
        onRequestClose={() => setIsImageViewerOpen(false)}
        presentationStyle="overFullScreen"
        backgroundColor="rgb(0, 0, 0, 0.8)"
        FooterComponent={({ imageIndex: idx }) => (
          <View className="p-10 items-center">
            <Text className="text-white font-interMedium">
              {idx + 1} / {sortedImages.length}
            </Text>
          </View>
        )}
      />
    </View>
  );
}