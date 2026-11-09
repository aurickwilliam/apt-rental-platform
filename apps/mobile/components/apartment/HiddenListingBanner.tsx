import { useState } from 'react'
import { View, Text } from 'react-native'

import { Button, Dialog, Label, TextArea, TextField, useToast } from 'heroui-native'
import { IconClockHour4, IconEyeOff } from '@tabler/icons-react-native'

import {
  LISTING_REVIEW_NOTE_MAX_LENGTH,
  getErrorMessage,
  getListingReviewBanner,
  validateListingReviewNote,
} from '@repo/utils'

import { useColors } from '@/hooks/useTheme'
import { useListingReview } from '@/hooks/apartments'

interface HiddenListingBannerProps {
  apartmentId: string | null
}

/**
 * Shown on a listing an admin hid: why, and a way to say it was fixed. Renders
 * nothing for a visible listing, so it is safe to place on every property screen.
 */
export default function HiddenListingBanner({ apartmentId }: HiddenListingBannerProps) {
  const { colors } = useColors()
  const { toast } = useToast()
  const { state, request } = useListingReview(apartmentId)
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const banner = state ? getListingReviewBanner(state) : 'none'
  if (!state || banner === 'none') return null

  const isPending = banner === 'pending'
  const isSending = request.isPending

  // The draft never outlives the dialog.
  const close = () => {
    if (isSending) return
    setIsOpen(false)
    setNote('')
    setError(null)
  }

  const send = () => {
    const problem = validateListingReviewNote(note)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    request.mutate(note, {
      onSuccess: () => {
        setIsOpen(false)
        setNote('')
        toast.show({ variant: 'success', label: 'Review requested. Our team will answer soon.' })
      },
      onError: (requestError) => {
        console.error('[listing-review] Failed to send request:', requestError)
        setError(getErrorMessage(requestError, 'Something went wrong. Try again.'))
      },
    })
  }

  return (
    <View
      className={`mb-4 rounded-2xl border p-4 gap-3 ${
        isPending ? 'border-warning/40 bg-warning/10' : 'border-danger/40 bg-danger/10'
      }`}
      accessibilityRole="alert"
    >
      <View className="flex-row items-start gap-3">
        {isPending ? (
          <IconClockHour4 size={22} color={colors.warningText} />
        ) : (
          <IconEyeOff size={22} color={colors.danger} />
        )}
        <View className="flex-1 gap-1">
          <Text className="text-base text-foreground font-nunitoBold">
            {isPending ? 'Review requested' : 'This listing is hidden from search'}
          </Text>
          {isPending ? (
            <>
              <Text className="text-sm text-muted font-inter">
                Our team will answer soon, and you will be notified.
              </Text>
              {state.request?.note ? (
                <Text className="text-sm text-foreground font-inter">Your note: {state.request.note}</Text>
              ) : null}
            </>
          ) : (
            <>
              {state.reason ? (
                <Text className="text-sm text-foreground font-inter">Reason: {state.reason}</Text>
              ) : null}
              {banner === 'declined' ? (
                <Text className="text-sm text-foreground font-inter">
                  Your last request was declined
                  {state.request?.decisionNote ? `: ${state.request.decisionNote}` : '.'}
                </Text>
              ) : null}
              <Text className="text-sm text-muted font-inter">
                Fix the issue, then ask our team to review it.
              </Text>
            </>
          )}
        </View>
      </View>

      {!isPending ? (
        <Button size="sm" onPress={() => setIsOpen(true)}>
          <Button.Label>{banner === 'declined' ? 'Request another review' : 'Request review'}</Button.Label>
        </Button>
      ) : null}

      <Dialog isOpen={isOpen} onOpenChange={(open) => { if (!open) close() }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
            <View className="mb-4 gap-1.5 pr-8">
              <Dialog.Title className="font-nunitoBold">Request a review</Dialog.Title>
              <Dialog.Description>
                Tell our team what you fixed. They will restore the listing or tell you what still needs work.
              </Dialog.Description>
            </View>

            <TextField isDisabled={isSending}>
              <Label>What did you fix?</Label>
              <TextArea
                placeholder="For example: I corrected the price and replaced the photos"
                value={note}
                onChangeText={setNote}
                maxLength={LISTING_REVIEW_NOTE_MAX_LENGTH}
                numberOfLines={4}
                className="p-3"
                accessibilityLabel="What did you fix?"
              />
            </TextField>

            {error ? (
              <Text className="text-sm text-danger mt-2" accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <View className="flex-row gap-3 mt-4">
              <Button variant="tertiary" size="sm" className="flex-1" onPress={close} isDisabled={isSending}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onPress={send}
                isDisabled={isSending || validateListingReviewNote(note) !== null}
              >
                <Button.Label>{isSending ? 'Sending…' : 'Send request'}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  )
}
