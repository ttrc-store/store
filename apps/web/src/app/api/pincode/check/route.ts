import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PincodeModel } from '@/lib/mongodb/models';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode')?.trim() || '';

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: 'Please enter a valid 6-digit Indian delivery pincode.' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // 1. Check custom database rules in MongoDB
    const dbPincode = await PincodeModel.findOne({ pincode }).lean();

    if (dbPincode) {
      return NextResponse.json({
        pincode,
        isServiceable: dbPincode.is_serviceable,
        city: dbPincode.city,
        state: dbPincode.state,
        estimatedDays: dbPincode.state === 'Tamil Nadu' ? '1 – 2 Business Days' : '3 – 5 Business Days',
        courierName: 'Delhivery / BlueDart',
        codAvailable: dbPincode.is_cod_available,
      });
    }

    // 2. Authoritative pan-India postal zone resolution (Origin: Tamil Nadu)
    const prefix = pincode.substring(0, 2);
    const prefixNum = parseInt(prefix, 10);

    let state = 'India';
    let city = 'Major Hub';
    let estimatedDays = '3 – 5 Business Days';
    let courierName = 'Shiprocket / Delhivery';

    if (prefixNum >= 60 && prefixNum <= 64) {
      state = 'Tamil Nadu';
      city = prefixNum === 64 ? 'Coimbatore Region' : prefixNum === 60 ? 'Chennai Metro' : 'Tamil Nadu';
      estimatedDays = '1 – 2 Business Days (Express Dispatch)';
      courierName = 'BlueDart Air / ST Courier';
    } else if (prefixNum >= 56 && prefixNum <= 59) {
      state = 'Karnataka';
      city = prefixNum === 56 ? 'Bengaluru Metro' : 'Karnataka';
      estimatedDays = '2 – 3 Business Days';
    } else if (prefixNum >= 67 && prefixNum <= 69) {
      state = 'Kerala';
      city = 'Kerala Region';
      estimatedDays = '2 – 3 Business Days';
    } else if (prefixNum >= 50 && prefixNum <= 53) {
      state = prefixNum <= 50 ? 'Telangana' : 'Andhra Pradesh';
      city = prefixNum === 50 ? 'Hyderabad Metro' : 'Andhra Pradesh';
      estimatedDays = '2 – 4 Business Days';
    } else if (prefixNum >= 40 && prefixNum <= 44) {
      state = 'Maharashtra';
      city = prefixNum === 40 ? 'Mumbai Metro' : 'Maharashtra';
      estimatedDays = '3 – 4 Business Days';
    } else if (prefixNum >= 11 && prefixNum <= 13) {
      state = prefixNum === 11 ? 'Delhi NCR' : 'Haryana';
      city = 'Delhi NCR';
      estimatedDays = '3 – 4 Business Days';
    }

    return NextResponse.json({
      pincode,
      isServiceable: true,
      city,
      state,
      estimatedDays,
      courierName,
      codAvailable: true,
    });
  } catch (err: any) {
    console.error('[Pincode Check API Error]', err);
    return NextResponse.json(
      { error: 'Failed to verify pincode serviceability.' },
      { status: 500 }
    );
  }
}
