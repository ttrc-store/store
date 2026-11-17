import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintMaterialModel } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const DEFAULT_MATERIALS = [
  {
    name: 'PLA',
    code: 'pla',
    density_g_cm3: 1.24,
    default_cost_per_gram_paise: 350,
    available_colors: ['Black', 'White', 'Signal Red', 'Grey', 'Blue', 'Yellow'],
    description: 'High rigidity, great detail, ideal for prototyping.',
    typical_applications: 'Enclosures, visual models, brackets',
    recommended_layer_heights: [0.10, 0.16, 0.20, 0.28],
    is_active: true,
    admin_only: false,
  },
  {
    name: 'PETG',
    code: 'petg',
    density_g_cm3: 1.27,
    default_cost_per_gram_paise: 420,
    available_colors: ['Black', 'White', 'Signal Red', 'Grey', 'Translucent'],
    description: 'Impact & chemical resistant, durable functional parts.',
    typical_applications: 'Drone arms, motor brackets, robot chassis',
    recommended_layer_heights: [0.16, 0.20, 0.28],
    is_active: true,
    admin_only: false,
  },
  {
    name: 'ABS',
    code: 'abs',
    density_g_cm3: 1.04,
    default_cost_per_gram_paise: 450,
    available_colors: ['Black', 'White', 'Grey', 'Signal Red'],
    description: 'High heat & impact resistance, acetone vapor smoothable.',
    typical_applications: 'Gears, heat-exposed motor covers',
    recommended_layer_heights: [0.16, 0.20],
    is_active: true,
    admin_only: false,
  },
  {
    name: 'ASA',
    code: 'asa',
    density_g_cm3: 1.07,
    default_cost_per_gram_paise: 550,
    available_colors: ['Black', 'White', 'Grey'],
    description: 'UV & weather resistant for outdoor robotics.',
    typical_applications: 'Solar mounts, rover chassis, outdoor sensor housings',
    recommended_layer_heights: [0.16, 0.20],
    is_active: true,
    admin_only: false,
  },
  {
    name: 'TPU 95A',
    code: 'tpu',
    density_g_cm3: 1.21,
    default_cost_per_gram_paise: 600,
    available_colors: ['Black', 'White', 'Signal Red'],
    description: 'Flexible elastomer for vibration damping and bumpers.',
    typical_applications: 'Tires, shock mounts, grippers',
    recommended_layer_heights: [0.16, 0.20],
    is_active: true,
    admin_only: false,
  },
  {
    name: 'Nylon PA12',
    code: 'nylon',
    density_g_cm3: 1.01,
    default_cost_per_gram_paise: 850,
    available_colors: ['Black', 'Natural White'],
    description: 'Superior wear resistance, low friction mechanical parts.',
    typical_applications: 'Gears, bearings, high-stress mechanisms',
    recommended_layer_heights: [0.16, 0.20],
    is_active: true,
    admin_only: false,
  },
];

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await connectToDatabase();
  let materials = await PrintMaterialModel.find().sort({ name: 1 });

  if (materials.length === 0) {
    await PrintMaterialModel.insertMany(DEFAULT_MATERIALS);
    materials = await PrintMaterialModel.find().sort({ name: 1 });
  }

  return NextResponse.json({ materials });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    await connectToDatabase();

    const material = await PrintMaterialModel.create({
      name: body.name,
      code: body.code.toLowerCase().trim(),
      density_g_cm3: body.density_g_cm3,
      default_cost_per_gram_paise: body.default_cost_per_gram_paise,
      available_colors: body.available_colors || ['Black', 'White'],
      description: body.description || '',
      typical_applications: body.typical_applications || '',
      recommended_layer_heights: body.recommended_layer_heights || [0.16, 0.20],
      is_active: body.is_active !== undefined ? body.is_active : true,
      admin_only: body.admin_only || false,
    });

    return NextResponse.json({ success: true, material });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error creating material' },
      { status: 500 }
    );
  }
}
