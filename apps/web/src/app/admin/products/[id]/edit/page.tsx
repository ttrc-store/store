'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { updateProductAction, getAdminProductByIdAction } from '@/actions/admin';
import { EnterpriseProductForm } from '../../_components/enterprise-product-form';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [product, setProduct] = React.useState<any>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        const res = await getAdminProductByIdAction(productId);
        if (res.product && isMounted) {
          setProduct(res.product);
        } else if (res.error && isMounted) {
          setErrorMsg(res.error);
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg('Failed to load product details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
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
        <Loader2 className="animate-spin text-purple-600" size={32} />
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
        onSubmitAction={handleUpdate}
      />
    </div>
  );
}
