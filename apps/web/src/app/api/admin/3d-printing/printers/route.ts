import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintPrinterModel } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const DEFAULT_PRINTERS = [
  {
    name: 'Bambu Lab X1-Carbon #1',
    printer_model: 'Bambu Lab X1-Carbon',
    build_volume_mm: { x: 256, y: 256, z: 256 },
    nozzle_diameter_mm: 0.4,
    supported_materials: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon'],
    hourly_rate_paise: 25000,
    is_active: true,
    status: 'idle',
  },
  {
    name: 'Bambu Lab P1S #2',
    printer_model: 'Bambu Lab P1S',
    build_volume_mm: { x: 256, y: 256, z: 256 },
    nozzle_diameter_mm: 0.4,
    supported_materials: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
    hourly_rate_paise: 22000,
    is_active: true,
    status: 'idle',
  },
  {
    name: 'Elegoo Neptune 4 Max (Large Format)',
    printer_model: 'Elegoo Neptune 4 Max',
    build_volume_mm: { x: 420, y: 420, z: 480 },
    nozzle_diameter_mm: 0.4,
    supported_materials: ['PLA', 'PETG'],
    hourly_rate_paise: 30000,
    is_active: true,
    status: 'idle',
  },
];

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await connectToDatabase();
  let printers = await PrintPrinterModel.find().sort({ created_at: -1 });

  // Seed default printers if empty
  if (printers.length === 0) {
    await PrintPrinterModel.insertMany(DEFAULT_PRINTERS);
    printers = await PrintPrinterModel.find().sort({ created_at: -1 });
  }

  return NextResponse.json({ printers });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    await connectToDatabase();

    const printer = await PrintPrinterModel.create({
      name: body.name,
      printer_model: body.model || body.name,
      build_volume_mm: body.build_volume_mm,
      nozzle_diameter_mm: body.nozzle_diameter_mm || 0.4,
      supported_materials: body.supported_materials || ['PLA', 'PETG'],
      hourly_rate_paise: body.hourly_rate_paise || 25000,
      is_active: body.is_active !== undefined ? body.is_active : true,
      status: body.status || 'idle',
    });

    return NextResponse.json({ success: true, printer });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error creating printer' },
      { status: 500 }
    );
  }
}
