import { View } from 'react-native'
import { useRef, useState } from 'react'
import type { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import UploadImageField from '@/components/inputs/UploadImageField';
import UploadFileField from '@/components/inputs/UploadFileField';

import {
  Button,
  Separator,
} from 'heroui-native';

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

type FormErrors = {
  govId?: string
  proofOfIncome?: string
  proofOfBilling?: string
}

export default function ThirdProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const {
    documents,
    updateImageDocument,
    updateFileDocument,
  } = useApplicationFormStore()

  const [errors, setErrors] = useState<FormErrors>({})

  const scrollRef = useRef<KeyboardAwareScrollView>(null)
  const contentRef = useRef<View>(null)
  const fieldPositions = useRef<Partial<Record<keyof FormErrors, number>>>({})

  const registerFieldRef = (field: keyof FormErrors) => (node: View | null) => {
    if (!node || !contentRef.current) return
    node.measureLayout(
      contentRef.current,
      (_x: number, y: number) => {
        fieldPositions.current[field] = y
      },
      () => {},
    )
  }

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }))

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (documents.govId.length === 0)
      newErrors.govId = 'Please upload a valid government-issued ID.'

    if (!documents.proofOfIncome)
      newErrors.proofOfIncome = 'Please upload proof of income.'

    if (documents.proofOfBilling.length === 0)
      newErrors.proofOfBilling = 'Please upload proof of billing.'

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      const fieldOrder: (keyof FormErrors)[] = [
        "govId",
        "proofOfIncome",
        "proofOfBilling",
      ];

      const firstInvalidField = fieldOrder.find((field) => newErrors[field]);
      const y = firstInvalidField
        ? fieldPositions.current[firstInvalidField]
        : undefined;
      if (y !== undefined) {
        scrollRef.current?.scrollToPosition(0, Math.max(y - 16, 0), true);
      }
    }

    return isValid
  }

  const handleNext = () => {
    if (!validate()) return
    router.push(`/apartment/${apartmentId}/apply/review-information`);
  }

  return (
    <ScreenWrapper scrollable ref={scrollRef}>
      <ApplicationHeader
        currentTitle="Upload Required Documents"
        nextTitle="Review Application"
        step={3}
      />

      <View className="p-5" ref={contentRef}>
        <View className="flex gap-3">
          <View ref={registerFieldRef("govId")}>
            <UploadImageField
              images={documents.govId}
              onAdd={(asset) => {
                updateImageDocument(
                  "govId",
                  Array.isArray(asset) ? asset : [asset],
                );
                clearError("govId");
              }}
              onRemove={(uri) =>
                updateImageDocument(
                  "govId",
                  documents.govId.filter((i) => i.uri !== uri),
                )
              }
              required
              single
              label="Valid Government-issued ID:"
              error={errors.govId}
            />
          </View>

          <Separator className="my-4" />

          <View ref={registerFieldRef("proofOfIncome")}>
            <UploadFileField
              label="Proof of Income:"
              placeholder="Upload COE, payslip, or ITR"
              value={documents.proofOfIncome}
              onChange={(asset) => {
                updateFileDocument("proofOfIncome", asset);
                if (asset) clearError("proofOfIncome");
              }}
              required
              error={errors.proofOfIncome}
            />
          </View>

          <Separator className="my-4" />

          <View ref={registerFieldRef("proofOfBilling")}>
            <UploadImageField
              images={documents.proofOfBilling}
              onAdd={(asset) => {
                updateImageDocument(
                  "proofOfBilling",
                  Array.isArray(asset) ? asset : [asset],
                );
                clearError("proofOfBilling");
              }}
              onRemove={(uri) =>
                updateImageDocument(
                  "proofOfBilling",
                  documents.proofOfBilling.filter((i) => i.uri !== uri),
                )
              }
              required
              single
              label="Proof of Billing:"
              error={errors.proofOfBilling}
            />
          </View>

          <Separator className="my-4" />

          <UploadFileField
            label="NBI Clearance:"
            placeholder="Upload your NBI clearance"
            value={documents.nbiClearance}
            onChange={(asset) => updateFileDocument("nbiClearance", asset)}
          />
        </View>

        {/* Back or Next Button */}
        <View className="flex-1 flex-row mt-16 gap-4">
          <Button
            onPress={() => router.back()}
            variant="tertiary"
            className="flex-1"
          >
            <Button.Label>Back</Button.Label>
          </Button>

          <Button onPress={handleNext} className="flex-1">
            <Button.Label>Next</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
