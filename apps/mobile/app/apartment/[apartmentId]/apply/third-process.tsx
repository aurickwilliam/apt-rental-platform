import { View, Text, TouchableOpacity } from 'react-native'
import { useEffect, useRef, useState } from 'react'
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

import { IconCircleCheckFilled, IconShieldCheck } from '@tabler/icons-react-native';

import { useApplicationFormStore, type PassportSelections } from '@/stores/useApplicationFormStore'
import { usePassportDocuments } from '@/hooks/passport';
import { passportDocsForSlot, type PassportDocumentRow } from '@/service/passport/passportService';
import { useColors } from '@/hooks/useTheme';

import { requiresProofOfIncome } from '@repo/constants'

type FormErrors = {
  govId?: string
  proofOfIncome?: string
  proofOfBilling?: string
}

type Slot = keyof PassportSelections;

const APPLY_SLOTS: Slot[] = ['govId', 'proofOfIncome', 'proofOfBilling', 'nbiClearance'];

function PassportSlotPicker({
  slot,
  docs,
  selectedPath,
  onSelect,
}: {
  slot: Slot;
  docs: PassportDocumentRow[];
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}) {
  const { colors } = useColors();
  const matches = passportDocsForSlot(docs, slot);

  if (matches.length === 0) return null;

  return (
    <View className="gap-2 mt-3">
      <Text className="text-sm font-nunitoSemiBold text-muted">
        Use from passport
      </Text>
      {matches.slice(0, 3).map((doc) => {
        const selected = selectedPath === doc.storage_path;
        return (
          <TouchableOpacity
            key={doc.id}
            activeOpacity={0.7}
            onPress={() => onSelect(selected ? null : doc.storage_path)}
            className={`flex-row items-center gap-3 rounded-2xl border p-3 ${
              selected ? 'border-primary bg-primary-light' : 'border-border bg-surface'
            }`}
          >
            <IconCircleCheckFilled
              size={22}
              color={selected ? colors.primary : colors.gray300}
            />
            <View className="flex-1 gap-0.5">
              <Text className="text-foreground text-sm font-nunitoSemiBold" numberOfLines={1}>
                {doc.doc_type}
              </Text>
              {doc.is_verified ? (
                <View className="flex-row items-center gap-1">
                  <IconShieldCheck size={12} color={colors.success} />
                  <Text className="text-success text-xs font-nunitoSemiBold">
                    Verified
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ThirdProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { colors } = useColors();

  const {
    tenantInformation,
    documents,
    passportSelections,
    updateImageDocument,
    updateFileDocument,
    setPassportSelection,
  } = useApplicationFormStore();

  const { documents: passportDocs, loading: passportLoading } = usePassportDocuments();
  const didPrefill = useRef(false);

  // Auto-attach: pre-select the best passport match for empty slots once
  // the wallet loads. Fresh uploads always take precedence at submit.
  useEffect(() => {
    if (passportLoading || didPrefill.current) return;
    didPrefill.current = true;
    APPLY_SLOTS.forEach((slot) => {
      const hasFresh =
        slot === 'govId' || slot === 'proofOfBilling'
          ? documents[slot].length > 0
          : documents[slot] !== null;
      if (hasFresh || passportSelections[slot]) return;
      const best = passportDocsForSlot(passportDocs, slot)[0];
      if (best) setPassportSelection(slot, best.storage_path);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passportLoading]);

  const [errors, setErrors] = useState<FormErrors>({})

  const scrollRef = useRef<KeyboardAwareScrollView>(null)
  const contentRef = useRef<View>(null)
  const groupOffsets = useRef<Partial<Record<string, number>>>({})
  const fieldPositions = useRef<Partial<Record<keyof FormErrors, number>>>({})

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }))

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (documents.govId.length === 0 && !passportSelections.govId)
      newErrors.govId = 'Please upload a valid government-issued ID.'

    if (
      requiresProofOfIncome(tenantInformation.employmentType) &&
      !documents.proofOfIncome &&
      !passportSelections.proofOfIncome
    ) {
      newErrors.proofOfIncome =
        "Please upload proof of income.";
    }

    if (documents.proofOfBilling.length === 0 && !passportSelections.proofOfBilling)
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
        <View
          className="flex gap-3"
          onLayout={(e) => {
            groupOffsets.current.main = e.nativeEvent.layout.y
          }}
        >
          <View
            onLayout={(e) => {
              fieldPositions.current.govId =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
          >
            <UploadImageField
              images={documents.govId}
              onAdd={(asset) => {
                updateImageDocument(
                  "govId",
                  Array.isArray(asset) ? asset : [asset],
                );
                setPassportSelection("govId", null);
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
            <PassportSlotPicker
              slot="govId"
              docs={passportDocs}
              selectedPath={passportSelections.govId}
              onSelect={(path) => {
                setPassportSelection("govId", path);
                if (path) clearError("govId");
              }}
            />
          </View>

          <Separator className="my-4" />

          <View
            onLayout={(e) => {
              fieldPositions.current.proofOfIncome =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
          >
            <UploadFileField
              label="Proof of Income:"
              placeholder="Upload COE, payslip, or ITR"
              value={documents.proofOfIncome}
              onChange={(asset) => {
                updateFileDocument("proofOfIncome", asset);
                if (asset) {
                  setPassportSelection("proofOfIncome", null);
                  clearError("proofOfIncome");
                }
              }}
              required={requiresProofOfIncome(tenantInformation.employmentType)}
              error={errors.proofOfIncome}
            />
            <PassportSlotPicker
              slot="proofOfIncome"
              docs={passportDocs}
              selectedPath={passportSelections.proofOfIncome}
              onSelect={(path) => {
                setPassportSelection("proofOfIncome", path);
                if (path) clearError("proofOfIncome");
              }}
            />
          </View>

          <Separator className="my-4" />

          <View
            onLayout={(e) => {
              fieldPositions.current.proofOfBilling =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
          >
            <UploadImageField
              images={documents.proofOfBilling}
              onAdd={(asset) => {
                updateImageDocument(
                  "proofOfBilling",
                  Array.isArray(asset) ? asset : [asset],
                );
                setPassportSelection("proofOfBilling", null);
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
            <PassportSlotPicker
              slot="proofOfBilling"
              docs={passportDocs}
              selectedPath={passportSelections.proofOfBilling}
              onSelect={(path) => {
                setPassportSelection("proofOfBilling", path);
                if (path) clearError("proofOfBilling");
              }}
            />
          </View>

          <Separator className="my-4" />

          <UploadFileField
            label="NBI Clearance:"
            placeholder="Upload your NBI clearance"
            value={documents.nbiClearance}
            onChange={(asset) => {
              updateFileDocument("nbiClearance", asset);
              if (asset) setPassportSelection("nbiClearance", null);
            }}
          />
          <PassportSlotPicker
            slot="nbiClearance"
            docs={passportDocs}
            selectedPath={passportSelections.nbiClearance}
            onSelect={(path) => setPassportSelection("nbiClearance", path)}
          />

          {passportDocs.length === 0 && !passportLoading ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/document-id')}
            >
              <Text className="text-sm font-inter text-center" style={{ color: colors.gray500 }}>
                Tip: save IDs, payslips, and clearances in your{' '}
                <Text className="font-nunitoSemiBold" style={{ color: colors.primary }}>
                  passport
                </Text>{' '}
                to attach them in one tap next time.
              </Text>
            </TouchableOpacity>
          ) : null}
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
