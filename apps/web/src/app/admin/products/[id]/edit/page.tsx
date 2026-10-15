'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { updateProductAction, getAdminProductByIdAction } from '@/actions/admin';
import { getAdminCategoriesAction } from '@/actions/admin-categories';
import { EnterpriseProductForm } from '../../_components/enterprise-product-form';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [product, setProduct] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<
    Array<{ id: string; name: string; slug: string; parentId?: string | null; parentName?: string }>
  >([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          getAdminProductByIdAction(productId),
          getAdminCategoriesAction(),
        ]);
        if (catRes.categories && isMounted) {
          setCategories(
            catRes.categories.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              parentId: c.parentId || null,
              parentName: c.parentName || undefined,
            }))
          );
        }
        if (prodRes.product && isMounted) {
          setProduct(prodRes.product);
        } else if (prodRes.error && isMounted) {
          setErrorMsg(prodRes.error);
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg('Failed to load product details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleUpdate = async (data: any) => {
    return await updateProductAction(productId, data);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E3132A]" size={32} />
        <p className="text-xs text-slate-500 font-semibold">Loading product configuration...</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-white border border-red-200 text-center space-y-4">
        <AlertCircle size={36} className="mx-auto text-red-500" />
        <h2 className="font-heading text-lg font-bold text-slate-900">Unable to Load Product</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'Product not found in database.'}</p>
        <Link
          href="/admin/products"
          className="inline-block px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
        >
          Return to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <EnterpriseProductForm
        initialData={product}
        productId={productId}
        isEditMode={true}
        availableCategories={categories}
        onSubmitAction={handleUpdate}
      />
    </div>
  );
}
