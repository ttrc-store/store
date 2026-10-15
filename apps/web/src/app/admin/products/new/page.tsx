import * as React from 'react';
import { createProductAction } from '@/actions/admin';
import { getAdminCategoriesAction } from '@/actions/admin-categories';
import { EnterpriseProductForm } from '../_components/enterprise-product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const catRes = await getAdminCategoriesAction();
  const availableCategories = (catRes.categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div className="py-6">
      <EnterpriseProductForm
        isEditMode={false}
        availableCategories={availableCategories}
        onSubmitAction={createProductAction}
      />
    </div>
  );
}
