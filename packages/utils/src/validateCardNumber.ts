export function formatCardNumber(value: string): string {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 19)
  return digitsOnly.replace(/(.{4})/g, '$1 ').trim()
}

export function luhnCheck(cardNumber: string): boolean {
  if (cardNumber.length < 13 || cardNumber.length > 19) return false
  let sum = 0
  let shouldDouble = false
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10)
    if (Number.isNaN(digit)) return false
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

export function validateCardNumber(value: string): {
  formatted: string
  isValid: boolean
} {
  const formatted = formatCardNumber(value)
  const digitsOnly = formatted.replace(/\s/g, '')
  const isValid = luhnCheck(digitsOnly)
  return { formatted, isValid }
}

export function formatExpiryDate(value: string): string {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 4)
  return digitsOnly.length >= 3
    ? digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2)
    : digitsOnly
}

export function isValidExpiryDate(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  const month = parseInt(match[1], 10)
  const year = parseInt(match[2], 10) + 2000
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expiry = new Date(year, month)
  return expiry > now
}

export type CardFormErrors = {
  cardNumber?: string
  expiryDate?: string
  cardholderName?: string
  cvv?: string
}

export function validateCardInfo(card: {
  cardNumber: string
  expiryDate: string
  cardholderName: string
  cvv: string
}): CardFormErrors {
  const errors: CardFormErrors = {}

  const cardDigits = card.cardNumber.replace(/\s/g, '')
  if (!cardDigits) {
    errors.cardNumber = 'Card number is required'
  } else if (!luhnCheck(cardDigits)) {
    errors.cardNumber = 'Invalid card number'
  }

  if (!card.expiryDate.trim()) {
    errors.expiryDate = 'Expiry date is required'
  } else if (!isValidExpiryDate(card.expiryDate)) {
    errors.expiryDate = 'Invalid or expired date'
  }

  if (!card.cardholderName.trim()) {
    errors.cardholderName = 'Cardholder name is required'
  }

  const cvvDigits = card.cvv.replace(/\D/g, '')
  if (!cvvDigits) {
    errors.cvv = 'CVV is required'
  } else if (cvvDigits.length !== 3) {
    errors.cvv = 'CVV must be 3 digits'
  }

  return errors
}
