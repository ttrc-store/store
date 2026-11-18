'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, Plus, Loader2 } from 'lucide-react';

export default function AdminMaterialsCatalogPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [density, setDensity] = useState(1.24);
  const [costPerGram, setCostPerGram] = useState(3.5);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/admin/3d-printing/materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/3d-printing/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: code || name.toLowerCase().replace(/\s+/g, '-'),
          density_g_cm3: density,
          default_cost_per_gram_paise: Math.round(costPerGram * 100),
          description,
        }),
      });
      if (!res.ok) throw new Error('Failed to create material');
      setShowAddModal(false);
      setName('');
      setCode('');
      await fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Error saving material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/3d-printing"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">FDM Materials Catalog</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage supported filament polymers, densities, and baseline cost guidelines.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Material</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#E3132A] animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div key={m._id.toString()} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {m.code}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">{m.description || 'Industrial FDM filament.'}</p>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Density:</span>
                    <strong className="text-slate-900">{m.density_g_cm3} g/cm³</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Cost:</span>
                    <strong className="text-slate-900">₹{(m.default_cost_per_gram_paise / 100).toFixed(2)} / gram</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold block text-slate-700 mb-1">Filament Stock Colors:</span>
                  <div className="flex flex-wrap gap-1">
                    {m.available_colors && m.available_colors.map((c: string) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New FDM Filament</h3>
            <form onSubmit={handleAddMaterial} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Polymer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polycarbonate (PC)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Code Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. pc"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Density (g/cm³)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={density}
                    onChange={(e) => setDensity(parseFloat(e.target.value) || 1.2)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Cost/gram (₹)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={costPerGram}
                    onChange={(e) => setCostPerGram(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Engineering applications and mechanical traits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-[#E3132A] text-white rounded text-xs font-bold"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

