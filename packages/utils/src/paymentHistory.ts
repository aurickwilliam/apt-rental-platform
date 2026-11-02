// What a tenant's Payment History shows, shared by web and mobile.
//
// Every checkout attempt saves a payment row, so backing out of a checkout or
// abandoning one leaves a `failed` row. Those stay on record but are not
// history, so they are hidden unless the tenant picks the Failed filter.
// Pending rows live in the verify and receipt flow, so they are always hidden.
// Rejected cash (a landlord's decision) is a real outcome and stays visible.
export function filterPaymentHistory<T extends { status: string }>(payments: T[], showFailed: boolean): T[] {
  return payments.filter((payment) => {
    const status = payment.status.toLowerCase()
    if (status === 'pending') return false
    if (status === 'failed' && !showFailed) return false
    return true
  })
}
