import type { PaymentHistoryItem } from './components/PaymentHistoryCard'

// Dummy data for payment history
const paymentHistory: Record<string, Record<string, PaymentHistoryItem[]>> = {
  2025: {
    May: [
      { id: '1', date: '2025-05-15', month: 'May', amount: 50.0, status: 'Paid', apartmentName: 'Apartment A', landlordName: 'John Doe', method: 'GCash' },
      { id: '2', date: '2025-04-10', month: 'April', amount: 30.0, status: 'Paid', apartmentName: 'Apartment A', landlordName: 'John Doe', method: 'Bank Transfer' },
      { id: '3', date: '2025-03-05', month: 'March', amount: 20.0, status: 'Partial', apartmentName: 'Apartment A', landlordName: 'John Doe', method: 'Cash' },
    ],
    February: [
      { id: '4', date: '2025-02-20', month: 'February', amount: 40.0, status: 'Paid', apartmentName: 'Apartment B', landlordName: 'Maria Santos', method: 'Cash' },
    ],
  },
  2024: {
    December: [
      { id: '5', date: '2024-12-25', month: 'December', amount: 60.0, status: 'Paid', apartmentName: 'Apartment C', landlordName: 'Carlos Reyes', method: 'GCash' },
    ],
    November: [
      { id: '6', date: '2024-11-15', month: 'November', amount: 35.0, status: 'Unpaid', apartmentName: 'Apartment D', landlordName: 'Ana Cruz', method: 'Bank Transfer' },
    ],
  },
  2023: {
    October: [
      { id: '7', date: '2023-10-10', month: 'October', amount: 45.0, status: 'Paid', apartmentName: 'Apartment E', landlordName: 'Pedro Lim', method: 'Cash' },
    ],
  },
}

export function getPaymentById(id: string): PaymentHistoryItem | null {
  for (const months of Object.values(paymentHistory)) {
    for (const payments of Object.values(months)) {
      const found = payments.find((payment) => payment.id === id)
      if (found) return found
    }
  }
  return null
}

export default paymentHistory
