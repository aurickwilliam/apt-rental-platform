import { View, Text, ScrollView } from 'react-native'
import { useState } from 'react'

import {
  Button,
  Description,
  Dialog,
  Label,
  Radio,
  RadioGroup,
  TextArea,
  TextField,
} from 'heroui-native'

import {
  USER_REPORT_DETAILS_MAX_LENGTH,
  USER_REPORT_REASONS,
  type UserReportReason,
} from '@/service/chat/conversationActionsService'

// Keeps the reason list scrollable on short screens while the buttons stay visible.
const REASON_LIST_MAX_HEIGHT = 320;

interface ReportUserDialogProps {
  isOpen: boolean;
  name: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (reason: UserReportReason, details: string) => void;
}

function isReportReason(value: string): value is UserReportReason {
  return USER_REPORT_REASONS.some((reason) => reason.value === value);
}

/** Reason + optional details for reporting someone from a conversation. */
export default function ReportUserDialog({
  isOpen,
  name,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: ReportUserDialogProps) {
  const [reason, setReason] = useState<UserReportReason | null>(null);
  const [details, setDetails] = useState('');

  const needsDetails = reason === 'other';
  const canSubmit =
    reason !== null && (!needsDetails || details.trim().length > 0) && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    setReason(null);
    setDetails('');
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant='ghost' className='absolute top-4 right-4' />
          <View className='mb-4 gap-1.5 pr-8'>
            <Dialog.Title className='font-nunitoBold'>Report {name}</Dialog.Title>
            <Dialog.Description>
              Our team reviews every report. {name} won&apos;t know who reported them.
            </Dialog.Description>
          </View>

          <ScrollView style={{ maxHeight: REASON_LIST_MAX_HEIGHT }} keyboardShouldPersistTaps='handled'>
            <RadioGroup
              value={reason ?? undefined}
              onValueChange={(value) => { if (isReportReason(value)) setReason(value); }}
              className='gap-2'
              isDisabled={isSubmitting}
            >
              {USER_REPORT_REASONS.map((option) => (
                <RadioGroup.Item
                  key={option.value}
                  value={option.value}
                  accessibilityLabel={`${option.label}. ${option.description}`}
                  className={`flex-row items-center justify-between p-3 rounded-2xl ${
                    option.value === reason ? 'bg-accent/10' : 'bg-surface'
                  }`}
                >
                  <View className='flex-1 pr-3'>
                    <Label className='font-inter'>{option.label}</Label>
                    <Description className='font-inter'>{option.description}</Description>
                  </View>
                  <Radio>
                    <Radio.Indicator className='border border-border shadow-none rounded-full' />
                  </Radio>
                </RadioGroup.Item>
              ))}
            </RadioGroup>
          </ScrollView>

          <TextField isDisabled={isSubmitting} className='mt-4'>
            <Label>{needsDetails ? 'What happened? *' : 'Details (optional)'}</Label>
            <TextArea
              placeholder='Add anything that helps us understand'
              value={details}
              onChangeText={setDetails}
              maxLength={USER_REPORT_DETAILS_MAX_LENGTH}
              numberOfLines={3}
              className='p-3'
              accessibilityLabel='Report details'
            />
          </TextField>

          {errorMessage ? (
            <Text className='text-sm text-danger mt-2' accessibilityLiveRegion='polite'>
              {errorMessage}
            </Text>
          ) : null}

          <View className='flex-row gap-3 mt-4'>
            <Button variant='tertiary' size='sm' className='flex-1' onPress={handleClose} isDisabled={isSubmitting}>
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              variant='danger'
              size='sm'
              className='flex-1'
              isDisabled={!canSubmit}
              onPress={() => { if (reason) onSubmit(reason, details); }}
            >
              <Button.Label>{isSubmitting ? 'Sending…' : 'Report'}</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
