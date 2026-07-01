import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { Image } from 'expo-image'
import ImageViewing from 'react-native-image-viewing'
import { useState } from 'react'

import {
  Bath,
  BedDouble,
  House,
  Maximize,
  Armchair,
  Calendar,
  Users,
  Building,
  ShieldCheck,
} from 'lucide-react-native'

import { useColors } from 'hooks/useTheme'

import { formatAddress, formatCurrency } from '@repo/utils'

type ApartmentImage = {
  id: string
  url: string
  is_cover: boolean
}

type Props = {
  name: string
  street_address: string
  barangay: string
  city: string
  province?: string | null
  zip_code?: string | null
  monthly_rent: number
  type: string
  lease_duration: string
  no_bedrooms: number
  no_bathrooms: number
  furnished_type: string
  floor_level: string
  max_occupants: number
  area_sqm: number
  apartment_images: ApartmentImage[]
  is_verified: boolean
}

export default function PropertyOverview({
  name,
  street_address,
  barangay,
  city,
  province,
  zip_code,
  monthly_rent,
  type,
  lease_duration,
  no_bedrooms,
  no_bathrooms,
  furnished_type,
  floor_level,
  max_occupants,
  area_sqm,
  apartment_images,
  is_verified
}: Props) {
  const { colors } = useColors()

  const [imageIndex, setImageIndex] = useState(0)
  const [isImageViewVisible, setIsImageViewVisible] = useState(false)

  const images = [...apartment_images].sort(
    (a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0),
  )

  const handleImagePress = (index: number) => {
    setImageIndex(index)
    setIsImageViewVisible(true)
  }

  return (
    <View className="flex gap-5">
      {/* Image Carousel */}
      {images.length > 0 && (
        <View>
          <FlatList
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-2"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                className="rounded-2xl overflow-hidden w-36 h-52"
                activeOpacity={0.7}
                onPress={() => handleImagePress(index)}
              >
                <Image
                  source={{ uri: item.url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Name & Address */}
      <View className="flex gap-1">
        <Text className="text-accent text-2xl font-nunito">{name}</Text>
        <Text className="text-foreground font-inter">
          {formatAddress({
            street_address,
            barangay,
            city,
            province: province ?? null,
            zip_code: zip_code ?? null,
          })}
        </Text>
      </View>

      {/* Monthly Rent */}
      <View className='flex-row'>
        <Text className="text-accent text-lg font-interMedium flex-1">
          {formatCurrency(monthly_rent)}
          <Text className="text-gray-500 font-inter text-base">/month</Text>
        </Text>

        {is_verified && (
          <View className="flex-row items-center gap-1">
            <ShieldCheck size={20} color={colors.success} />
            <Text
              className="text-base font-interMedium"
              style={{ color: colors.success }}>
              Verified
            </Text>
          </View>
        )}
      </View>

      {/* Specs Grid */}
      <View className="flex-row flex-wrap">
        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <House size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">{type}</Text>
        </View>

        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <Calendar size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">{lease_duration}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <BedDouble size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">
            {no_bedrooms} Bedroom{no_bedrooms !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <Bath size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">
            {no_bathrooms} Bathroom{no_bathrooms !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <Armchair size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">{furnished_type}</Text>
        </View>

        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <Building size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">{floor_level}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <Users size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">
            Max {max_occupants} Occupant{max_occupants !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row w-1/2 gap-2 items-center justify-start">
          <Maximize size={24} color={colors.gray500} />
          <Text className="text-foreground text-base">{area_sqm} Sqm</Text>
        </View>
      </View>

      {/* Image Lightbox */}
      <ImageViewing
        images={images.map((img) => ({ uri: img.url }))}
        imageIndex={imageIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        presentationStyle="overFullScreen"
        backgroundColor="rgb(0, 0, 0, 0.8)"
        FooterComponent={({ imageIndex: idx }) => (
          <View className="p-10 items-center">
            <Text className="text-white font-interMedium">
              {idx + 1} / {images.length}
            </Text>
          </View>
        )}
      />
    </View>
  )
}
