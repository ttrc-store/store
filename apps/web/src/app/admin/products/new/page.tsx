'use client';

import * as React from 'react';
import { createProductAction } from '@/actions/admin';
import { EnterpriseProductForm } from '../_components/enterprise-product-form';

export default function NewProductPage() {
  return (
    <div className="py-6">
      <EnterpriseProductForm
        isEditMode={false}
        onSubmitAction={createProductAction}
      />
    </div>
  );
}
