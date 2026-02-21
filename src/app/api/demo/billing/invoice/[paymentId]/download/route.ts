import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const { paymentId } = params

    // Create a simple PDF content as demo
    // In a real app, this would generate a proper invoice PDF using DodoPay API
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 16 Tf
50 750 Td
(Invoice - Payment ID: ${paymentId}) Tj
0 -30 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -30 Td
(Amount: $45.00) Tj
0 -30 Td
(Credits: 5,000) Tj
0 -30 Td
(Status: Paid) Tj
0 -30 Td
(Plan: Creator Plan (Monthly)) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000015 00000 n
0000000062 00000 n
0000000118 00000 n
0000000280 00000 n
0000000538 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
615
%%EOF`

    // Convert string to buffer
    const buffer = Buffer.from(pdfContent, 'utf8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${paymentId}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Demo invoice download error:', error)
    return NextResponse.json(
      {
        error: 'Failed to download invoice',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}