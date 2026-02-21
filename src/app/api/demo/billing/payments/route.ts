import { NextResponse } from 'next/server'

// Mock payment data for demo
const mockPayments = [
  {
    id: 'pay_1',
    dodoPaymentId: 'dp_1abc234567890def',
    amount: 4500, // $45.00 in cents
    currency: 'USD',
    status: 'completed',
    plan: 'creator',
    billingPeriod: 'monthly',
    creditsGranted: 5000,
    createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    paidAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice-1.pdf'
  },
  {
    id: 'pay_2',
    dodoPaymentId: 'dp_2def567890123abc',
    amount: 1000, // $10.00 in cents
    currency: 'USD',
    status: 'completed',
    plan: 'starter',
    billingPeriod: 'one-time',
    creditsGranted: 1000,
    createdAt: Date.now() - (14 * 24 * 60 * 60 * 1000), // 14 days ago
    paidAt: Date.now() - (14 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice-2.pdf'
  },
  {
    id: 'pay_3',
    dodoPaymentId: 'dp_3ghi890123456def',
    amount: 4500, // $45.00 in cents
    currency: 'USD',
    status: 'completed',
    plan: 'creator',
    billingPeriod: 'monthly',
    creditsGranted: 5000,
    createdAt: Date.now() - (37 * 24 * 60 * 60 * 1000), // 37 days ago (last month)
    paidAt: Date.now() - (37 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice-3.pdf'
  },
  {
    id: 'pay_4',
    dodoPaymentId: 'dp_4jkl123456789abc',
    amount: 2500, // $25.00 in cents
    currency: 'USD',
    status: 'completed',
    plan: 'pro',
    billingPeriod: 'one-time',
    creditsGranted: 2500,
    createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
    paidAt: Date.now() - (45 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice-4.pdf'
  },
  {
    id: 'pay_5',
    dodoPaymentId: 'dp_5mno456789012def',
    amount: 4500, // $45.00 in cents
    currency: 'USD',
    status: 'completed',
    plan: 'creator',
    billingPeriod: 'monthly',
    creditsGranted: 5000,
    createdAt: Date.now() - (67 * 24 * 60 * 60 * 1000), // 67 days ago
    paidAt: Date.now() - (67 * 24 * 60 * 60 * 1000),
    invoiceUrl: 'https://example.com/invoice-5.pdf'
  }
]

export async function GET() {
  try {
    // Sort by most recent first
    const sortedPayments = mockPayments.sort((a, b) => b.paidAt - a.paidAt)

    return NextResponse.json({
      success: true,
      payments: sortedPayments,
      total: sortedPayments.length
    })

  } catch (error) {
    console.error('Demo billing payments error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch payments',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}