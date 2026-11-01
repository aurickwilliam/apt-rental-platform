import { Text } from 'react-native'
import { FieldError, Label, TextArea, TextField, useBottomSheetAwareHandlers } from 'heroui-native'

import { TENANT_REVIEW_MAX_COMMENT_LENGTH } from '@repo/utils'

interface RatingCommentFieldProps {
  value: string
  onChangeText: (text: string) => void
  error?: string
}

/**
 * The optional comment box of the rating sheet. It is its own component because the
 * sheet-aware handlers read the bottom sheet's context, so they must be called from a
 * child of the sheet; called from the sheet's owner they do nothing and the keyboard
 * would cover the field.
 */
export default function RatingCommentField({ value, onChangeText, error }: RatingCommentFieldProps) {
  const handlers = useBottomSheetAwareHandlers()

  return (
    <TextField isInvalid={!!error}>
      <Label>Comment (optional)</Label>
      <TextArea
        placeholder="Paid on time, kept the unit tidy, easy to communicate with…"
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={4}
        className="p-3"
        {...handlers}
      />
      <Text className="text-muted text-xs font-inter text-right mt-1">
        {value.trim().length}/{TENANT_REVIEW_MAX_COMMENT_LENGTH}
      </Text>
      {error && <FieldError>{error}</FieldError>}
    </TextField>
  )
}
