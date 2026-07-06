import { View, Text } from 'react-native'

import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DropdownField from '@/components/inputs/DropdownField'
import DetailField from '@/components/display/DetailField'
import UploadImageField from '@/components/inputs/UploadImageField'
import SuccessDialog from '@/components/display/SuccessDialog'
import ErrorDialog from '@/components/display/ErrorDialog'

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
import {
  useSubmitMaintenanceRequest,
  MaintenanceCategorySlug,
  useMaintenanceRequestUrgencyStyles
} from '@/hooks/maintenance-requests'

type MaintenanceDetails = {
  category: string;
  title: string;
  message: string;
  urgency: typeof MAINTENANCE_URGENCY[number]['value'] | '';
}

type MaintenanceErrors = Partial<Record<keyof MaintenanceDetails, string>>;

export default function RequestMaintenance() {
  const { colors } = useColors();
  const router = useRouter();
  const {
    apartmentId,
    apartmentName,
    apartmentAddress,
    landlordName
  } = useLocalSearchParams<{
    apartmentId: string,
    apartmentName?: string,
    apartmentAddress?: string,
    landlordName?: string
  }>();
  const { submitRequest, isSubmitting, error } = useSubmitMaintenanceRequest();
  const urgencyStyles = useMaintenanceRequestUrgencyStyles();

  const [maintenanceDetails, setMaintenanceDetails] = useState<MaintenanceDetails>({
    category: '',
    title: '',
    message: '',
    urgency: '',
  });

  const [errors, setErrors] = useState<MaintenanceErrors>({});
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [imageError, setImageError] = useState<string | undefined>(undefined);

  // For Dialogs
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddImages = (
    added: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]
  ) => {
    setImageError(undefined);
    setImages((prev) => {
      const incoming = Array.isArray(added) ? added : [added];
      const existingUris = new Set(prev.map((img) => img.uri));
      const merged = [...prev, ...incoming.filter((img) => !existingUris.has(img.uri))];
      return merged;
    });
  };

  const handleRemoveImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const updateField = <K extends keyof MaintenanceDetails>(field: K, value: MaintenanceDetails[K]) => {
    setMaintenanceDetails((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: MaintenanceErrors = {};

    if (!maintenanceDetails.title.trim()) {
      nextErrors.title = 'Title is required';
    }
    if (!maintenanceDetails.category) {
      nextErrors.category = 'Category is required';
    }
    if (!maintenanceDetails.message.trim()) {
      nextErrors.message = 'Description is required';
    }
    if (!maintenanceDetails.urgency) {
      nextErrors.urgency = 'Please select an urgency level';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!apartmentId) return;

    const categoryEntry = MAINTENANCE_CATEGORIES.find(
      (c) => c.label === maintenanceDetails.category
    );
    if (!categoryEntry) {
      setErrors((prev) => ({ ...prev, category: 'Invalid category selected' }));
      return;
    }

    try {
      await submitRequest({
        apartmentId,
        title: maintenanceDetails.title.trim(),
        category: categoryEntry.value as MaintenanceCategorySlug,
        urgency: maintenanceDetails.urgency as 'low' | 'medium' | 'high',
        message: maintenanceDetails.message.trim(),
        imageUris: images.map((img) => img.uri),
      });

      setSuccessOpen(true);
    } catch {
      setErrorMessage(error ?? 'Something went wrong. Please try again.');
      setErrorOpen(true);
    }
  };

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
            {apartmentName}
          </Text>
        </View>

        <Text className='text-foreground font-interMedium'>
          {apartmentAddress}
        </Text>
      </View>

      {/* Landlord Name */}
      <View className='mt-3'>
        <DetailField
          label='Landlord'
          value={landlordName}
        />
      </View>

      <Separator className='my-5' />

      {/* Maintenance Issue Form */}
      <View className='flex gap-3'>
        <Text className='text-foreground text-lg font-interMedium'>
          Maintenance Details
        </Text>

        <TextField isRequired isInvalid={!!errors.title}>
          <Label>Issue Title:</Label>
          <Input
            placeholder='Enter a short title for the issue...'
            value={maintenanceDetails.title}
            onChangeText={(value) => updateField('title', value)}
          />
          {errors.title && (
            <FieldError>{errors.title}</FieldError>
          )}
        </TextField>

        <DropdownField
          label={'Issue Category:'}
          bottomSheetLabel={'Select Issue Category'}
          options={MAINTENANCE_CATEGORIES.map(category => category.label)}
          value={maintenanceDetails.category}
          onSelect={(value) => updateField('category', value ? value : '')}
          placeholder='Select a Category'
          error={errors.category}
          required
        />

        <TextField isRequired isInvalid={!!errors.message}>
          <Label>Issue Description:</Label>
          <TextArea
            className='p-3'
            placeholder='Describe the issue in detail...'
            value={maintenanceDetails.message}
            onChangeText={(value) => updateField('message', value)}
          />
          {errors.message && (
            <FieldError>{errors.message}</FieldError>
          )}
        </TextField>

        <View className='flex gap-3'>
          <Text className='text-text text-base font-interMedium'>
            How urgent is this issue? <Text className='text-danger'>*</Text>
          </Text>

          <View className='flex-row gap-2'>
            {MAINTENANCE_URGENCY.map((option) => {
              const selected = maintenanceDetails.urgency === option.value;
              const style = urgencyStyles[option.value];
              return (
                <Chip
                  key={option.value}
                  variant="soft"
                  animation="disable-all"
                  style={{
                    backgroundColor: selected
                      ? style.textColor
                      : style.backgroundColor
                  }}
                  onPress={() => updateField('urgency', option.value)}
                >
                  {selected && (
                    <Check size={14} color={colors.white} />
                  )}
                  <Chip.Label
                    style={{
                      color: selected
                        ? colors.white
                        : style.textColor
                    }}
                  >
                    {option.label}
                  </Chip.Label>
                </Chip>
              );
            })}
          </View>

          {errors.urgency && (
            <Text className='text-danger font-inter'>
              {errors.urgency}
            </Text>
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

      <Button className='mt-10' onPress={handleSubmit} isDisabled={isSubmitting}>
        <Button.Label>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button.Label>
      </Button>

      <SuccessDialog
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          router.back();
        }}
        message="Your maintenance request has been sent to your landlord."
      />

      <ErrorDialog
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </ScreenWrapper>
  )
}
