'use client';

import * as React from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
  Layers,
  Power,
} from 'lucide-react';
import {
  getAdminCategoriesAction,
  createAdminCategoryAction,
  updateAdminCategoryAction,
  deleteAdminCategoryAction,
  AdminCategoryItem,
} from '@/actions/admin-categories';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<AdminCategoryItem | null>(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const [form, setForm] = React.useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCategoriesAction();
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const openCreateModal = (parentDefaultId = '') => {
    setEditingCategory(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      parentId: parentDefaultId,
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: AdminCategoryItem) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || undefined,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editingCategory) {
        const res = await updateAdminCategoryAction(editingCategory.id, payload);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess(res.message || 'Category updated.');
          setTimeout(() => {
            setIsModalOpen(false);
            loadCategories();
          }, 800);
        }
      } else {
        const res = await createAdminCategoryAction(payload);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess(res.message || 'Category created.');
          setTimeout(() => {
            setIsModalOpen(false);
            loadCategories();
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (cat: AdminCategoryItem) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const res = await deleteAdminCategoryAction(cat.id);
      if (res.error) {
        alert(res.error);
      } else {
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  // Group top-level categories and subcategories
  const mainCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => Boolean(c.parentId));

  const totalProductsCount = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="text-[#E3132A]" size={26} />
            Category Management ({categories.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative MongoDB catalog taxonomy, parent-child hierarchies, and kit tabs.
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Main Category
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Main Categories</p>
          <p className="font-heading text-2xl font-black text-slate-900 mt-1">{mainCategories.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subcategories</p>
          <p className="font-heading text-2xl font-black text-slate-900 mt-1">{subCategories.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Catalog Linkages</p>
          <p className="font-heading text-2xl font-black text-[#E3132A] mt-1">{totalProductsCount} products</p>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-[#E3132A]" size={32} />
          <p className="text-xs font-medium">Loading catalog categories from MongoDB Atlas...</p>
        </div>
      ) : mainCategories.length === 0 ? (
        <div className="py-16 text-center space-y-3 px-4 rounded-2xl bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-[#E3132A]">
            <FolderTree size={20} />
          </div>
          <h3 className="font-heading font-bold text-sm text-slate-900">No Categories Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Add Main Category&quot; to initialize your first product category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainCategories.map((cat) => {
            const children = subCategories.filter(
              (sub) => sub.parentId === cat.id || sub.parentId === cat.slug
            );

            return (
              <div
                key={cat.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FDECEE] border border-red-200 text-[#E3132A] shrink-0">
                      <FolderTree size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading font-extrabold text-base text-slate-900">{cat.name}</h2>
                        {!cat.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">/category/{cat.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                      {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
                    </span>
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs text-slate-600">{cat.description}</p>
                )}

                {/* Subcategories list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Subcategories ({children.length})
                    </p>
                    <button
                      onClick={() => openCreateModal(cat.id)}
                      className="text-[11px] font-bold text-[#E3132A] hover:underline cursor-pointer"
                    >
                      + Add Subcategory
                    </button>
                  </div>

                  {children.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">
                      No subcategories configured under this category.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {children.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight size={14} className="text-[#E3132A]" />
                            <span className="text-slate-800 font-medium">{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sub.slug})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {sub.productCount} items
                            </span>
                            <button
                              onClick={() => openEditModal(sub)}
                              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                              title="Edit Subcategory"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(sub)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Delete Subcategory"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT CATEGORY ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="font-heading font-black text-xl text-slate-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure catalog hierarchy and URL slug.</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gamified Robots"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      name: val,
                      slug: editingCategory ? form.slug : slugify(val),
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#E3132A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="gamified-robots"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-[#E3132A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#E3132A]"
                >
                  <option value="">None (Top-Level Category)</option>
                  {mainCategories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selecting a parent converts this into a subcategory under that category.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief description for SEO and category headers"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#E3132A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#E3132A]"
                  />
                </div>

                <div className="pt-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 accent-[#E3132A]"
                    />
                    <span className="font-bold text-slate-700">Active in Storefront</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitLoading && <Loader2 size={14} className="animate-spin" />}
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
