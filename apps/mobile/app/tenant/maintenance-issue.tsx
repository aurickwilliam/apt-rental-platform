import { View, Text } from 'react-native'

import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DropdownField from '@/components/inputs/DropdownField'
import DetailField from '@/components/display/DetailField'
import UploadImageField from '@/components/inputs/UploadImageField'

import {
  Separator,
  TextField,
  Input,
  FieldError,
  Label,
  TextArea,
  Button,
  Chip,
} from 'heroui-native';

import { MAINTENANCE_CATEGORIES, MAINTENANCE_URGENCY } from '@repo/constants';

import { Building2, Check } from 'lucide-react-native'

import { useColors } from '@/hooks/useTheme'

type MaintenanceDetails = {
  category: string;
  title: string;
  message: string;
  urgency: typeof MAINTENANCE_URGENCY[number]['value'] | '';
}

const URGENCY_COLORS: Record<typeof MAINTENANCE_URGENCY[number]['value'], 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
};

export default function MaintenanceIssue() {
  const { colors } = useColors();
  // TODO: Get the apartment details and maintenance issue details from
  // TODO: the backend using the issue ID passed in the route params

  const [maintenanceDetails, setMaintenanceDetails] = useState<MaintenanceDetails>({
    category: '',
    title: '',
    message: '',
    urgency: '',
  });

  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [imageError, setImageError] = useState<string | undefined>(undefined);

  const handleAddImages = (
    added: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]
  ) => {
    setImageError(undefined);
    setImages((prev) => {
      const incoming = Array.isArray(added) ? added : [added];
      // de-dupe by uri in case the picker returns an already-selected asset
      const existingUris = new Set(prev.map((img) => img.uri));
      const merged = [...prev, ...incoming.filter((img) => !existingUris.has(img.uri))];
      return merged;
    });
  };

  const handleRemoveImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  // Dummy data for now
  const apartmentDetails = {
    name: "Charles Apartments",
    address: "123 Main St, Apt 4B",
    landlord: "John Doe",
  }

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      header={
        <StandardHeader title='Request Maintenance'/>
      }
    >
      {/* Apartment Details */}
      <View className="flex gap-1">
        <View className='flex-row items-center gap-2'>
          <Building2 size={24} color={colors.primary} />
          <Text
            className='text-accent text-xl font-interSemiBold'
            numberOfLines={1}
          >
            {apartmentDetails.name}
          </Text>
        </View>

        <Text className='text-foreground font-interMedium'>
          {apartmentDetails.address}
        </Text>
      </View>

      {/* Landlord Name */}
      <View className='mt-3'>
        <DetailField
          label='Landlord'
          value={apartmentDetails.landlord}
        />
      </View>

      <Separator className='my-5' />

      {/* Maintenance Issue Form */}
      <View className='flex gap-3'>
        {/* Title */}
        <Text className='text-foreground text-lg font-interMedium'>
          Maintenance Details
        </Text>

        <TextField isRequired>
          <Label>Issue Title:</Label>
          <Input
            placeholder='Enter a short title for the issue...'
            value={maintenanceDetails.title}
            onChangeText={(value) => setMaintenanceDetails({...maintenanceDetails, title: value})}
          />
          {maintenanceDetails.title === '' && (
            <FieldError>Title is required</FieldError>
          )}
        </TextField>

        <DropdownField
          label={'Issue Category:'}
          bottomSheetLabel={'Select Issue Category'}
          options={MAINTENANCE_CATEGORIES.map(category => category.label)}
          value={maintenanceDetails.category}
          onSelect={(value) => setMaintenanceDetails({...maintenanceDetails, category: value ? value : ''})}
          placeholder='Select a Category'
          required
        />

        <TextField isRequired>
          <Label>Issue Description:</Label>
          <TextArea
          className='p-3'
            placeholder='Describe the issue in detail...'
            value={maintenanceDetails.message}
            onChangeText={(value) => setMaintenanceDetails({...maintenanceDetails, message: value})}
          />
          {maintenanceDetails.message === '' && (
            <FieldError>Description is required</FieldError>
          )}
        </TextField>

        <View className='flex gap-3'>
          <Text className='text-text text-base font-interMedium'>
            How urgent is this issue? <Text className='text-danger'>*</Text>
          </Text>

          <View className='flex-row gap-2'>
            {MAINTENANCE_URGENCY.map((option) => {
              const selected = maintenanceDetails.urgency === option.value;
              return (
                <Chip
                  key={option.value}
                  variant={selected ? 'primary' : 'soft'}
                  color={URGENCY_COLORS[option.value]}
                  onPress={() => setMaintenanceDetails({...maintenanceDetails, urgency: option.value})}
                >
                  {selected && (
                    <Check
                      size={14}
                      color={URGENCY_COLORS[option.value] === 'danger'
                        ? colors.white
                        : colors.textPrimary
                      }
                    />
                  )}
                  <Chip.Label>{option.label}</Chip.Label>
                </Chip>
              );
            })}
          </View>

          {maintenanceDetails.urgency === '' && (
            <FieldError>Please select an urgency level</FieldError>
          )}
        </View>

        <View className='mt-3'>
          <UploadImageField
            label='Add Photos or Videos:'
            images={images}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            error={imageError}
          />
        </View>
      </View>

      <Button className='mt-10'>
        <Button.Label>
          Submit Request
        </Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
