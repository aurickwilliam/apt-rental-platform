import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import {
  Button,
  Input,
  Label,
  ListGroup,
  TextField,
  Switch,
} from 'heroui-native'
import { IconTrash } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DropdownField from '@/components/inputs/DropdownField'
import ConfirmDialog from '@/components/display/ConfirmDialog'
import ErrorDialog from '@/components/display/ErrorDialog'
import SuccessDialog from '@/components/display/SuccessDialog'

import { useProfile } from '@/hooks/auth'
import {
  useCreatePayoutDestination,
  useDeletePayoutDestination,
  usePayoutDestinations,
  useUpdatePayoutDestination,
} from '@/hooks/payments'
import { usePHMobileValidation } from '@repo/hooks'
import {
  PAYOUT_ACCOUNT_NUMBER_LENGTH,
  PAYOUT_DESTINATION_LABELS,
  PAYOUT_DESTINATION_TYPES,
  type PayoutDestinationType,
} from '@repo/constants'

type FormErrors = {
  type?: string
  accountName?: string
  accountNumber?: string
}

export default function PayoutAccountForm() {
  const router = useRouter()
  const { destinationId } = useLocalSearchParams<{ destinationId: string }>()
  const isEditMode = destinationId !== 'new'

  const { profile } = useProfile()
  const destinationsQuery = usePayoutDestinations()
  const existing = destinationsQuery.data?.find((row) => row.id === destinationId)

  const [type, setType] = useState<PayoutDestinationType>('gcash')
  const [accountName, setAccountName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const mobile = usePHMobileValidation()

  const createDestination = useCreatePayoutDestination()
  const updateDestination = useUpdatePayoutDestination()
  const deleteDestination = useDeletePayoutDestination()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Prefill once the row arrives in edit mode.
  useEffect(() => {
    if (!isEditMode || !existing) return
    setType(existing.type as PayoutDestinationType)
    setAccountName(existing.account_name)
    setIsDefault(existing.is_default)
    if (mobile.value !== existing.account_number) {
      mobile.onChange(existing.account_number)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existing?.id])

  const validateForm = (): boolean => {
    const next: FormErrors = {}
    if (!PAYOUT_DESTINATION_TYPES.includes(type)) next.type = 'Select a payout type.'
    if (!accountName.trim() || accountName.trim().length < 2) {
      next.accountName = 'Enter the account holder name.'
    }
    if (!mobile.validate().isValid) {
      next.accountNumber = mobile.validation.errorMessage ?? 'Enter a valid PH mobile number.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    if (!profile?.id) return

    const params = {
      type,
      accountNumber: mobile.formatTo('09XXXXXXXXX') ?? mobile.value,
      accountName: accountName.trim(),
      isDefault,
    }

    try {
      if (isEditMode && existing) {
        await updateDestination.mutateAsync({ ...params, destinationId: existing.id, userId: profile.id })
      } else {
        await createDestination.mutateAsync({ ...params, userId: profile.id })
      }
      setSuccessMessage(
        isDefault
          ? 'Saved. Future payouts will be sent to this account.'
          : 'Payout account saved.'
      )
    } catch (err) {
      console.error('PayoutAccountForm: save error', err)
      setErrorMessage(
        (err as { message?: string }).message ??
          'Could not save your payout account. Please try again.'
      )
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    try {
      await deleteDestination.mutateAsync(existing.id)
      setDeleteDialogOpen(false)
      router.back()
    } catch (err) {
      setDeleteDialogOpen(false)
      setErrorMessage(
        (err as { message?: string }).message ??
          'Could not delete this payout account. Please try again.'
      )
    }
  }

  const saving = createDestination.isPending || updateDestination.isPending

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title={isEditMode ? 'Edit Payout Account' : 'Add Payout Account'} />
      }
    >
      <DropdownField
        label='Type:'
        placeholder='Select GCash or Maya'
        bottomSheetLabel='Select payout type'
        options={PAYOUT_DESTINATION_TYPES.map((value) => PAYOUT_DESTINATION_LABELS[value])}
        value={PAYOUT_DESTINATION_LABELS[type]}
        onSelect={(value) => {
          const match = PAYOUT_DESTINATION_TYPES.find((t) => PAYOUT_DESTINATION_LABELS[t] === value)
          if (match) setType(match)
        }}
        error={errors.type}
      />

      <TextField isRequired className='mt-4'>
        <Label>Account Name:</Label>
        <Input
          placeholder='Name registered to the e-wallet'
          value={accountName}
          onChangeText={(text) => setAccountName(text)}
          autoCapitalize='words'
        />
      </TextField>
      {errors.accountName && (
        <Text className='text-sm text-danger mt-1'>{errors.accountName}</Text>
      )}

      <TextField isRequired className='mt-4'>
        <Label>Mobile Number:</Label>
        <Input
          placeholder='09XXXXXXXXX'
          value={mobile.value}
          onChangeText={(text) => {
            mobile.onChange(text)
            if (errors.accountNumber) setErrors((prev) => ({ ...prev, accountNumber: undefined }))
          }}
          keyboardType='phone-pad'
          maxLength={PAYOUT_ACCOUNT_NUMBER_LENGTH}
        />
      </TextField>
      {(errors.accountNumber || (!mobile.validation.isValid && mobile.value.length > 0)) && (
        <Text className='text-sm text-danger mt-1'>
          {errors.accountNumber ?? mobile.validation.errorMessage}
        </Text>
      )}

      <ListGroup className='shadow-none border border-border mt-5'>
        <ListGroup.Item>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className='font-nunitoSemiBold'>
              Set as default
            </ListGroup.ItemTitle>
            <ListGroup.ItemDescription>
              Payouts are sent to your default account.
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <Switch isSelected={isDefault} onSelectedChange={() => setIsDefault(!isDefault)} />
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>

      <Button className='mt-6' onPress={handleSave} isDisabled={saving}>
        <Button.Label>{saving ? 'Saving…' : 'Save'}</Button.Label>
      </Button>

      {isEditMode && (
        <Button
          variant='danger'
          className='mt-3'
          onPress={() => setDeleteDialogOpen(true)}
        >
          <IconTrash size={18} color='#FFFFFF' />
          <Button.Label>Delete</Button.Label>
        </Button>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title='Delete payout account'
        description='This account will no longer receive payouts. Continue?'
        confirmLabel='Delete'
        confirmVariant='danger'
        onConfirm={handleDelete}
        isConfirmDisabled={deleteDestination.isPending}
      />

      <ErrorDialog
        isOpen={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        message={errorMessage}
      />

      <SuccessDialog
        isOpen={successMessage !== null}
        onClose={() => {
          setSuccessMessage(null)
          router.back()
        }}
        message={successMessage}
      />
    </ScreenWrapper>
  )
}
