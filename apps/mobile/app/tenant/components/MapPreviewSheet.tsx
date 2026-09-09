import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheet, Button, PressableFeedback } from 'heroui-native';
import {
  IconBed,
  IconBath,
  IconMaximize,
  IconStarFilled,
  IconShieldCheckFilled,
  IconPhoto,
} from '@tabler/icons-react-native';
import { formatPesoDisplay } from '@repo/utils';
import { useColors } from '@/hooks/useTheme';
import type { MapApartment } from '@/service/apartments/mapSearchService';

interface Props {
  apartment: MapApartment | null;
  onClose: () => void;
  onPress: () => void;
}

export default function MapPreviewSheet({ apartment, onClose, onPress }: Props) {
  const { colors } = useColors();
  const isOpen = apartment != null;

  const thumbnail = apartment?.coverThumbUrl
    ? { uri: apartment.coverThumbUrl }
    : apartment?.coverUrl
      ? { uri: apartment.coverUrl }
      : null;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Content
          snapPoints={['38%']}
          enablePanDownToClose
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full pt-0 px-4"
          handleIndicatorClassName="bg-[#D0D0D0] w-10"
          backgroundClassName="bg-surface rounded-t-3xl"
        >
          {apartment ? (
            <PressableFeedback
              onPress={onPress}
              className="h-full flex-col gap-2"
            >
              {/* Thumbnail with verified chip — top-right when verified, nothing otherwise */}
              <View className="w-full h-40 rounded-2xl overflow-hidden bg-surface-secondary shrink-0">
                {thumbnail ? (
                  <Image
                    source={thumbnail}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <IconPhoto
                      size={28}
                      color={colors.gray400}
                    />
                  </View>
                )}

                {apartment.is_verified && (
                  <View
                    className="bg-success-light p-1 absolute top-1.5 right-1.5 rounded-full flex-row items-center gap-1"
                    style={{ paddingHorizontal: 8, elevation: 3 }}
                  >
                    <IconShieldCheckFilled size={14} color={colors.success} />
                    <Text className="text-success font-nunitoSemiBold text-xs">Verified</Text>
                  </View>
                )}
              </View>

              {/* Details — compact */}
              <View className="flex-1 justify-between">
                {/* Title */}
                <View>
                  <Text
                    numberOfLines={1}
                    className="text-foreground font-nunitoBold text-xl"
                  >
                    {apartment.name}
                  </Text>

                  {/* Location + rating */}
                  <View className="flex-row items-center gap-1">
                    <Text
                      numberOfLines={1}
                      className="text-muted font-interMedium text-sm"
                    >
                      {apartment.barangay}, {apartment.city}
                    </Text>

                    <Text className="text-muted text-sm">·</Text>

                    <IconStarFilled size={13} color={colors.secondary} />
                    <Text className="text-foreground font-inter text-sm">
                      {apartment.average_rating?.toFixed(1) ?? '0.0'}
                    </Text>
                  </View>
                </View>

                {/* Specs — compact */}
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-1">
                    <IconBed size={16} color={colors.gray500} />
                    <Text className="text-muted text-sm">
                      {apartment.no_bedrooms} Bedroom{apartment.no_bedrooms > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <IconBath size={16} color={colors.gray500} />
                    <Text className="text-muted text-sm">
                      {apartment.no_bathrooms} Bathroom{apartment.no_bathrooms > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <IconMaximize size={16} color={colors.gray500} />
                    <Text className="text-muted text-sm">
                      {apartment.area_sqm} sqm
                    </Text>
                  </View>
                </View>

                {/* Price + View more */}
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-accent font-nunitoBold text-xl shrink">
                    {formatPesoDisplay(apartment.monthly_rent)}
                    <Text className="text-muted font-interMedium text-sm"> / month</Text>
                  </Text>
                  <Button
                    size="sm"
                    variant='ghost'
                    onPress={(e: unknown) => {
                      (e as { stopPropagation?: () => void })?.stopPropagation?.();
                      onPress();
                    }}
                    className="shrink-0"
                    accessibilityLabel="View apartment details"
                  >
                    <Button.Label className="text-primary">View more</Button.Label>
                  </Button>
                </View>
              </View>
            </PressableFeedback>
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
