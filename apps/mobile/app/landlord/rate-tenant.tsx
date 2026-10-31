import { View, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ErrorDialog from 'components/display/ErrorDialog'

import { useColors } from 'hooks/useTheme'
import { useSubmitTenantReview, useTenantReviews } from '@/hooks/ratings'

import {
  TENANT_REVIEW_MAX_COMMENT_LENGTH,
  validateTenantReview,
  type TenantReviewErrors,
} from '@repo/utils'

import { IconStar, IconStarFilled } from '@tabler/icons-react-native'

import { Button, FieldError, Label, TextArea, TextField } from 'heroui-native'

const STAR_SIZE = 45

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/** A landlord rates a tenant for one finished stay; saving again edits the same rating. */
export default function RateTenant() {
  const params = useLocalSearchParams<{
    tenancyId?: string | string[]
    tenantId?: string | string[]
    tenantName?: string | string[]
    apartmentName?: string | string[]
  }>()
  const tenancyId = firstParam(params.tenancyId)
  const tenantId = firstParam(params.tenantId)
  const tenantName = firstParam(params.tenantName) ?? 'this tenant'
  const apartmentName = firstParam(params.apartmentName) ?? 'this apartment'

  const { colors } = useColors()
  const router = useRouter()

  const { reviews, loading: reviewsLoading } = useTenantReviews(tenantId)
  const { submitTenantReview, isSubmitting } = useSubmitTenantReview()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<TenantReviewErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Seed the form once from the rating already saved for this stay (edit mode).
  const [isSeeded, setIsSeeded] = useState(false)
  const existing = reviews.find((review) => review.tenancyId === tenancyId)
  if (!isSeeded && !reviewsLoading) {
    setIsSeeded(true)
    if (existing) {
      setRating(existing.rating)
      setComment(existing.comment)
    }
  }

  const isEditing = existing !== undefined
  const isSubmitDisabled = !tenancyId || !tenantId || isSubmitting || reviewsLoading

  const handleSubmit = async () => {
    if (isSubmitDisabled || !tenancyId || !tenantId) return

    const found = validateTenantReview(rating, comment)
    setErrors(found)
    if (found.rating || found.comment) return

    try {
      await submitTenantReview({ tenantId, tenancyId, rating, comment })
      router.back()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not save your rating. Please try again.',
      )
    }
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title={isEditing ? 'Edit Tenant Rating' : 'Rate Tenant'} />}
      className="p-5"
    >
      <View className="gap-1">
        <Text className="text-xl font-nunitoBold text-accent">{tenantName}</Text>
        <Text className="text-foreground text-base font-nunitoSemiBold">{apartmentName}</Text>
        <Text className="text-muted text-sm font-inter mt-1">
          Landlords you share an application or lease with can see your rating.
        </Text>
      </View>

      <View className="items-center mt-8">
        <Text className="text-foreground text-lg font-nunitoSemiBold">Overall Rating</Text>
        <Text className="text-accent text-5xl font-nunitoBold mt-2 leading-tight">
          {rating.toFixed(1)}
        </Text>

        <View className="flex-row items-center justify-center gap-3 my-5">
          {[1, 2, 3, 4, 5].map((value) => {
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
                <StarIcon
                  size={STAR_SIZE}
                  color={rating >= value ? colors.rating : colors.gray300}
                />
              </TouchableOpacity>
            )
          })}
        </View>

        <View className="flex-row items-center gap-5">
          <Text className="text-muted text-sm font-inter">1 - Poor</Text>
          <Text className="text-muted text-sm font-inter">5 - Excellent</Text>
        </View>

        {errors.rating && <Text className="text-danger text-xs mt-1">{errors.rating}</Text>}
      </View>

      <View className="mt-8">
        <TextField isInvalid={!!errors.comment}>
          <Label>Comment (optional)</Label>
          <TextArea
            placeholder="Paid on time, kept the unit tidy, easy to communicate with…"
            value={comment}
            onChangeText={(text) => {
              setComment(text)
              if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }))
            }}
            multiline
            numberOfLines={4}
            className="p-3"
          />
          <Text className="text-muted text-xs font-inter text-right mt-1">
            {comment.trim().length}/{TENANT_REVIEW_MAX_COMMENT_LENGTH}
          </Text>
          {errors.comment && <FieldError>{errors.comment}</FieldError>}
        </TextField>
      </View>

      <Button className="mt-10" onPress={handleSubmit} isDisabled={isSubmitDisabled}>
        <Button.Label>
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit Rating'}
        </Button.Label>
      </Button>

      <ErrorDialog
        isOpen={submitError !== null}
        onClose={() => setSubmitError(null)}
        message={submitError}
      />
    </ScreenWrapper>
  )
}
