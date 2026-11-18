import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb/client';
import {
  PrintRequestModel,
  PrintFileModel,
  PrintPrinterModel,
} from '@/lib/mongodb/models';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const SubmitRequestSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  originalFilename: z.string().min(1),
  format: z.enum(['STL', 'STEP', 'STP']),
  originalUnit: z.enum(['mm', 'cm', 'inch']).default('mm'),
  configuration: z.object({
    technology: z.literal('FDM').default('FDM'),
    material: z.enum(['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon']),
    color: z.string().default('Black'),
    layer_height: z.union([
      z.literal(0.1),
      z.literal(0.16),
      z.literal(0.2),
      z.literal(0.28),
    ]).default(0.2),
    infill_percentage: z.number().min(10).max(100).default(20),
    infill_pattern: z.enum(['grid', 'gyroid', 'cubic', 'honeycomb']).default('grid'),
    supports: z.enum(['auto', 'none', 'admin_decision']).default('admin_decision'),
    quantity: z.number().int().min(1).max(1000).default(1),
    finish: z.enum(['standard', 'sanded', 'acetone_smooth']).default('standard'),
    purpose: z
      .enum(['prototype', 'functional', 'educational', 'production', 'other'])
      .default('prototype'),
  }),
  analysis: z.object({
    normalized_dimensions_mm: z.object({
      x: z.number().min(0),
      y: z.number().min(0),
      z: z.number().min(0),
    }),
    volume_cm3: z.number().nullable(),
    surface_area_cm2: z.number().min(0),
    triangle_count: z.number().int().min(0),
    is_watertight: z.boolean(),
    is_manifold: z.boolean(),
    shell_count: z.number().int().default(1),
    degenerate_triangles: z.number().int().default(0),
    warnings: z.array(z.string()).default([]),
  }),
  customer: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    city: z.string().min(2, 'City is required'),
    company: z.string().optional(),
    delivery_address: z.string().optional(),
    additional_requirements: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = SubmitRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Safety rule: Acetone smoothing only allowed for ABS and ASA
    if (
      data.configuration.finish === 'acetone_smooth' &&
      data.configuration.material !== 'ABS' &&
      data.configuration.material !== 'ASA'
    ) {
      return NextResponse.json(
        {
          error:
            'Acetone vapor smoothing is only compatible with ABS or ASA materials. Please choose standard or sanded finish for other filaments.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify file exists
    const fileRecord = await PrintFileModel.findOne({ file_id: data.fileId });
    if (!fileRecord) {
      return NextResponse.json(
        { error: 'Associated CAD file not found. Please re-upload your 3D model.' },
        { status: 404 }
      );
    }

    // Match compatible registered printers based on bounding box
    const { x, y, z } = data.analysis.normalized_dimensions_mm;
    const registeredPrinters = await PrintPrinterModel.find({ is_active: true });
    const compatiblePrinters: string[] = [];

    for (const printer of registeredPrinters) {
      const vol = printer.build_volume_mm;
      const margin = 5; // 5mm clearance margin
      if (
        (x <= vol.x - margin && y <= vol.y - margin && z <= vol.z - margin) ||
        (y <= vol.x - margin && x <= vol.y - margin && z <= vol.z - margin)
      ) {
        if (printer.supported_materials.includes(data.configuration.material)) {
          compatiblePrinters.push(printer._id.toString());
        }
      }
    }

    // Generate unique request number
    const year = new Date().getFullYear();
    const count = await PrintRequestModel.countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    const requestNumber = `TTRC-3DP-${year}-${seq}`;

    const currentUser = await getCurrentUser();

    const newRequest = await PrintRequestModel.create({
      request_number: requestNumber,
      user_id: currentUser?.id,
      customer: {
        ...data.customer,
        is_verified: !!currentUser?.emailVerified,
      },
      file: {
        file_id: data.fileId,
        format: data.format,
        original_filename: data.originalFilename,
        file_size: fileRecord.size,
        storage_path: fileRecord.storage_path,
        sha256: fileRecord.sha256,
        original_unit: data.originalUnit,
      },
      configuration: data.configuration,
      analysis: data.analysis,
      compatible_printers: compatiblePrinters,
      quotation_status: 'PENDING_REVIEW',
      production_status: 'NOT_STARTED',
      status_history: [
        {
          machine: 'quotation',
          from_status: 'DRAFT',
          to_status: 'PENDING_REVIEW',
          changed_by: currentUser?.email || data.customer.email,
          timestamp: new Date(),
          notes: 'Customer submitted CAD model for engineering quotation.',
        },
      ],
    });

    // Link request ID to file record
    fileRecord.request_id = newRequest._id.toString();
    await fileRecord.save();

    try {
      revalidatePath('/admin/3d-printing');
      revalidatePath('/admin/3d-printing/requests');
      revalidatePath('/admin');
    } catch {
      // Safe fallback if called outside static generation store
    }

    return NextResponse.json({
      success: true,
      requestId: newRequest._id.toString(),
      requestNumber,
      trackingUrl: `/3d-printing/quote/${newRequest._id.toString()}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error processing 3D print request.' },
      { status: 500 }
    );
  }
}
