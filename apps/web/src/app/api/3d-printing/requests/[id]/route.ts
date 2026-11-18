import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel, PrintQuoteModel } from '@/lib/mongodb/models';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const request = await PrintRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let activeQuote = null;
    if (request.active_quote_id) {
      activeQuote = await PrintQuoteModel.findById(request.active_quote_id);
    } else {
      // Find latest quote for this request
      activeQuote = await PrintQuoteModel.findOne({ request_id: id }).sort({ version: -1 });
    }

    return NextResponse.json({
      request,
      quote: activeQuote,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error fetching request details' },
      { status: 500 }
    );
  }
}

