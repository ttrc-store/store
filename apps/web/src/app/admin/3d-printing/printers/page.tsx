'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Plus, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AdminPrinterFleetPage() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [buildX, setBuildX] = useState(256);
  const [buildY, setBuildY] = useState(256);
  const [buildZ, setBuildZ] = useState(256);
  const [nozzle, setNozzle] = useState(0.4);
  const [hourlyRate, setHourlyRate] = useState(250); // ₹250
  const [submitting, setSubmitting] = useState(false);

  const fetchPrinters = async () => {
    try {
      const res = await fetch('/api/admin/3d-printing/printers');
      if (res.ok) {
        const data = await res.json();
        setPrinters(data.printers || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/3d-printing/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          model: model || name,
          build_volume_mm: { x: buildX, y: buildY, z: buildZ },
          nozzle_diameter_mm: nozzle,
          hourly_rate_paise: hourlyRate * 100,
        }),
      });
      if (!res.ok) throw new Error('Failed to register printer');
      setShowAddModal(false);
      setName('');
      setModel('');
      await fetchPrinters();
    } catch (err: any) {
      alert(err.message || 'Error saving printer');
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
            <h1 className="text-xl font-extrabold text-slate-900">Printer Fleet Profiles</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Register physical FDM machines, build volume limits, and hourly rate calculations.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Printer</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#E3132A] animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((p) => (
            <div key={p._id.toString()} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'idle' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {p.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mb-4">
                  Model: <span className="text-slate-800 font-semibold">{p.printer_model || p.name}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Build Volume:</span>
                    <strong className="text-slate-900 font-mono">
                      {p.build_volume_mm.x} &times; {p.build_volume_mm.y} &times; {p.build_volume_mm.z} mm
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Nozzle Size:</span>
                    <strong className="text-slate-900">{p.nozzle_diameter_mm} mm</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hourly Rate:</span>
                    <strong className="text-slate-900">₹{(p.hourly_rate_paise / 100).toFixed(2)}/hr</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold block text-slate-700 mb-1">Supported Polymers:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.supported_materials.map((m: string) => (
                      <span key={m} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Printer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Register New 3D Printer</h3>
            <form onSubmit={handleAddPrinter} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Machine Identifier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bambu Lab X1C Unit 3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Printer Model</label>
                <input
                  type="text"
                  placeholder="e.g. Bambu Lab X1-Carbon"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">X (mm)</label>
                  <input
                    type="number"
                    value={buildX}
                    onChange={(e) => setBuildX(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Y (mm)</label>
                  <input
                    type="number"
                    value={buildY}
                    onChange={(e) => setBuildY(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Z (mm)</label>
                  <input
                    type="number"
                    value={buildZ}
                    onChange={(e) => setBuildZ(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Nozzle (mm)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={nozzle}
                    onChange={(e) => setNozzle(parseFloat(e.target.value) || 0.4)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                  />
                </div>
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
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
