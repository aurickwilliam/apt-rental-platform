import { useCallback, useState } from 'react'
import { Keyboard, Text, TouchableOpacity, View } from 'react-native'
import { BottomSheet, Button, useToast } from 'heroui-native'
import { BottomSheetFooter, BottomSheetScrollView, type BottomSheetFooterProps } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconStar, IconStarFilled } from '@tabler/icons-react-native'

import { validateTenantReview, type TenantReviewErrors } from '@repo/utils'

import { useColors } from '@/hooks/useTheme'
import { useSubmitTenantReview } from '@/hooks/ratings'

import RatingCommentField from './RatingCommentField'

const STAR_SIZE = 40
const RATING_VALUES = [1, 2, 3, 4, 5]

export interface RateTenantStay {
  tenancyId: string
  apartmentName: string
}

interface RateTenantSheetProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  tenantName: string
  /** The stay being rated; kept while the sheet animates closed. */
  stay: RateTenantStay | null
  /** The landlord's saved rating for this stay, when there is one (saving then edits it). */
  savedRating: { rating: number; comment: string } | null
  /** True while the landlord's saved ratings are loading, so a save cannot replace one unseen. */
  isLoadingSaved: boolean
  loadFailed: boolean
  onRetry: () => void
}

/** A landlord rates a tenant for one finished stay; saving again edits the same rating. */
export default function RateTenantSheet({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  stay,
  savedRating,
  isLoadingSaved,
  loadFailed,
  onRetry,
}: RateTenantSheetProps) {
  const { colors } = useColors()
  const insets = useSafeAreaInsets()
  const { toast } = useToast()
  const { submitTenantReview, isSubmitting } = useSubmitTenantReview()

  const [rating, setRating] = useState(savedRating?.rating ?? 0)
  const [comment, setComment] = useState(savedRating?.comment ?? '')
  const [errors, setErrors] = useState<TenantReviewErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // The sheet stays mounted while closed (HeroUI snaps it open on a closed → open
  // transition), so each opening reseeds the draft from the saved rating.
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setRating(savedRating?.rating ?? 0)
      setComment(savedRating?.comment ?? '')
      setErrors({})
      setSubmitError(null)
    }
  }

  // Without the saved rating a second save would silently replace it, so a failed load blocks saving.
  const isSubmitDisabled = !stay || isSubmitting || isLoadingSaved || loadFailed
  const isEditing = savedRating !== null

  const close = () => {
    if (isSubmitting) return
    Keyboard.dismiss()
    onClose()
  }

  const handleSubmit = useCallback(async () => {
    if (isSubmitDisabled || !stay) return

    const found = validateTenantReview(rating, comment)
    setErrors(found)
    if (found.rating || found.comment) return

    setSubmitError(null)
    try {
      await submitTenantReview({ tenantId, tenancyId: stay.tenancyId, rating, comment })
      Keyboard.dismiss()
      toast.show({ variant: 'success', label: isEditing ? 'Rating updated' : 'Rating saved' })
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save your rating. Please try again.')
    }
  }, [comment, isEditing, isSubmitDisabled, onClose, rating, stay, submitTenantReview, tenantId, toast])

  // The submit button stays pinned to the bottom of the sheet, above the home indicator.
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View className="px-5 py-3 border-t border-border bg-overlay">
          <Button onPress={handleSubmit} isDisabled={isSubmitDisabled}>
            <Button.Label>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit Rating'}</Button.Label>
          </Button>
        </View>
      </BottomSheetFooter>
    ),
    [handleSubmit, insets.bottom, isEditing, isSubmitDisabled, isSubmitting],
  )

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          // The taller snap point is where the sheet rises to when the keyboard opens.
          snapPoints={['72%', '92%']}
          topInset={insets.top}
          enableDynamicSizing={false}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture
          footerComponent={renderFooter}
        >
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            enableFooterMarginAdjustment
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View className="gap-5">
              <View className="gap-1">
                <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
                  {isEditing ? 'Edit your rating' : `Rate ${tenantName}`}
                </BottomSheet.Title>
                <BottomSheet.Description className="font-inter text-sm text-muted">
                  {stay?.apartmentName ?? 'This stay'}. The tenant and the landlords they have applied to or rented
                  from can see your rating and comment.
                </BottomSheet.Description>
              </View>

              <View className="items-center gap-2">
                <View className="flex-row items-center justify-center gap-3">
                  {RATING_VALUES.map((value) => {
                    const StarIcon = rating >= value ? IconStarFilled : IconStar
                    return (
                      <TouchableOpacity
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={`Rate ${value} ${value === 1 ? 'star' : 'stars'}`}
                        onPress={() => {
                          setRating(value)
                          if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }))
                        }}
                        activeOpacity={0.7}
                      >
                        <StarIcon size={STAR_SIZE} color={rating >= value ? colors.rating : colors.gray300} />
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <View className="flex-row items-center gap-5">
                  <Text className="text-muted text-xs font-inter">1 - Poor</Text>
                  <Text className="text-muted text-xs font-inter">5 - Excellent</Text>
                </View>
                {errors.rating && <Text className="text-danger text-xs">{errors.rating}</Text>}
              </View>

              <RatingCommentField
                value={comment}
                onChangeText={(text) => {
                  setComment(text)
                  if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }))
                }}
                error={errors.comment}
              />

              {loadFailed && (
                <View className="gap-2">
                  <Text className="text-danger text-sm font-inter">
                    We could not load your saved rating, so saving is paused to avoid replacing it.
                  </Text>
                  <Button size="sm" variant="secondary" onPress={onRetry}>
                    <Button.Label>Try again</Button.Label>
                  </Button>
                </View>
              )}

              {submitError && <Text className="text-danger text-sm font-inter">{submitError}</Text>}
            </View>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
