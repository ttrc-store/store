'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { invalidateCatalogCache } from '@/lib/mongodb/catalog';
import { connectToDatabase } from '@/lib/mongodb/client';
import { CategoryModel, ProductModel, AuditLogModel, ICategory } from '@/lib/mongodb/models';
import { requireAdmin } from '@/lib/auth-helpers';

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  parentName?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

const CategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Category slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function getAdminCategoriesAction(): Promise<{
  categories?: AdminCategoryItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const categories = await CategoryModel.find().sort({ sort_order: 1, created_at: -1 }).lean();

    // Map parent names
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c.name]));
    const slugMap = new Map(categories.map((c) => [c.slug, c.name]));

    const items: AdminCategoryItem[] = await Promise.all(
      categories.map(async (c) => {
        const catId = c._id.toString();
        const productCount = await ProductModel.countDocuments({
          $or: [{ category_id: c.slug }, { category_id: catId }],
          is_active: true,
        });

        let parentName: string | undefined = undefined;
        if (c.parent_id) {
          parentName = categoryMap.get(c.parent_id) || slugMap.get(c.parent_id);
        }

        return {
          id: catId,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.image_url,
          parentId: c.parent_id || null,
          parentName,
          sortOrder: c.sort_order ?? 0,
          isActive: c.is_active ?? true,
          productCount,
          createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '',
        };
      })
    );

    return { categories: items };
  } catch (err: any) {
    console.error('[Admin getAdminCategories error]', err);
    return { error: 'Failed to load store categories.' };
  }
}

export async function createAdminCategoryAction(rawInput: z.infer<typeof CategorySchema>) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = CategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { name, slug, description, imageUrl, parentId, sortOrder, isActive } = parsed.data;

  try {
    await connectToDatabase();

    const existing = await CategoryModel.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return { error: `Category with slug "${slug}" already exists.` };
    }

    const newCat = new CategoryModel({
      name,
      slug: slug.toLowerCase(),
      description: description || undefined,
      image_url: imageUrl || undefined,
      parent_id: parentId || undefined,
      sort_order: sortOrder,
      is_active: isActive,
    });
    const created = await newCat.save();

    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'category.created',
      entity: 'category',
      entity_id: created._id.toString(),
      metadata: {
        name,
        slug,
        parentId,
        actorEmail: auth.user.email,
      },
    });

    invalidateCatalogCache();
    revalidatePath('/admin/categories');
    revalidatePath('/category');
    revalidatePath('/');

    return { success: true, id: created._id.toString(), message: `Category "${name}" created successfully.` };
  } catch (err: any) {
    console.error('[Admin createAdminCategory error]', err);
    return { error: err.message || 'Failed to create category.' };
  }
}

export async function updateAdminCategoryAction(
  categoryId: string,
  rawInput: z.infer<typeof CategorySchema>
) {
  if (!categoryId) return { error: 'Category ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = CategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { name, slug, description, imageUrl, parentId, sortOrder, isActive } = parsed.data;

  try {
    await connectToDatabase();

    // Check slug collision
    const existing = await CategoryModel.findOne({
      slug: slug.toLowerCase(),
      _id: { $ne: categoryId },
    });
    if (existing) {
      return { error: `Another category is already using slug "${slug}".` };
    }

    // Prevent circular parenting
    if (parentId && parentId === categoryId) {
      return { error: 'A category cannot be its own parent.' };
    }

    const updated = await CategoryModel.findByIdAndUpdate(
      categoryId,
      {
        $set: {
          name,
          slug: slug.toLowerCase(),
          description: description || undefined,
          image_url: imageUrl || undefined,
          parent_id: parentId || null,
          sort_order: sortOrder,
          is_active: isActive,
        },
      },
      { new: true }
    );

    if (!updated) {
      return { error: 'Category not found.' };
    }

    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'category.updated',
      entity: 'category',
      entity_id: categoryId,
      metadata: {
        name,
        slug,
        parentId,
        isActive,
        actorEmail: auth.user.email,
      },
    });

    invalidateCatalogCache();
    revalidatePath('/admin/categories');
    revalidatePath('/category');
    revalidatePath('/');

    return { success: true, message: `Category "${name}" updated successfully.` };
  } catch (err: any) {
    console.error('[Admin updateAdminCategory error]', err);
    return { error: err.message || 'Failed to update category.' };
  }
}

export async function deleteAdminCategoryAction(categoryId: string) {
  if (!categoryId) return { error: 'Category ID is required' };

  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  try {
    await connectToDatabase();

    const category = await CategoryModel.findById(categoryId);
    if (!category) return { error: 'Category not found.' };

    // Dependency check: prevent deleting category if products belong to it
    const productCount = await ProductModel.countDocuments({
      $or: [{ category_id: category.slug }, { category_id: categoryId }],
    });

    if (productCount > 0) {
      return {
        error: `Cannot delete "${category.name}" because ${productCount} product(s) are assigned to it. Please reassign or delete those products first, or deactivate this category instead.`,
        canDeactivate: true,
      };
    }

    // Check if subcategories exist
    const subCount = await CategoryModel.countDocuments({
      $or: [{ parent_id: categoryId }, { parent_id: category.slug }],
    });

    if (subCount > 0) {
      return {
        error: `Cannot delete "${category.name}" because it has ${subCount} subcategory(s). Please remove or reassign subcategories first.`,
      };
    }

    await CategoryModel.findByIdAndDelete(categoryId);

    await AuditLogModel.create({
      actor_id: auth.user.id,
      action: 'category.deleted',
      entity: 'category',
      entity_id: categoryId,
      metadata: {
        name: category.name,
        slug: category.slug,
        actorEmail: auth.user.email,
      },
    });

    invalidateCatalogCache();
    revalidatePath('/admin/categories');
    revalidatePath('/category');
    revalidatePath('/');

    return { success: true, message: `Category "${category.name}" deleted successfully.` };
  } catch (err: any) {
    console.error('[Admin deleteAdminCategory error]', err);
    return { error: err.message || 'Failed to delete category.' };
  }
}
