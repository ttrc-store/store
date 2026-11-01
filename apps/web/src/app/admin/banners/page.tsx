'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
  Video,
  ImageIcon,
  Eye,
  ExternalLink,
  Clock,
  ArrowUpDown,
  Tag,
  X,
  Play,
  RotateCw,
} from 'lucide-react';
import {
  getAllHeroBannersAction,
  createHeroBannerAction,
  updateHeroBannerAction,
  deleteHeroBannerAction,
  toggleHeroBannerActiveAction,
  HeroBannerDTO,
} from '@/actions/banners';

export default function AdminBannersPage() {
  const [banners, setBanners] = React.useState<HeroBannerDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBanner, setEditingBanner] = React.useState<HeroBannerDTO | null>(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [uploadingMedia, setUploadingMedia] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    title: '',
    type: 'image' as 'image' | 'video',
    mediaUrl: '',
    linkUrl: '',
    offerPrice: '',
    regularPrice: '',
    badge: '',
    rotationSeconds: 3,
    sortOrder: 1,
    isActive: true,
  });

  const loadBanners = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllHeroBannersAction();
      if (res.error) {
        setError(res.error);
      } else if (res.banners) {
        setBanners(res.banners);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      type: 'image',
      mediaUrl: '',
      linkUrl: '',
      offerPrice: '',
      regularPrice: '',
      badge: '',
      rotationSeconds: 3,
      sortOrder: banners.length + 1,
      isActive: true,
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: HeroBannerDTO) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      type: banner.type,
      mediaUrl: banner.mediaUrl,
      linkUrl: banner.linkUrl,
      offerPrice: banner.offerPrice || '',
      regularPrice: banner.regularPrice || '',
      badge: banner.badge || '',
      rotationSeconds: banner.rotationSeconds || 3,
      sortOrder: banner.sortOrder ?? 1,
      isActive: banner.isActive,
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload media file');
      }

      const isVideoFile = file.type.startsWith('video/');
      setFormData((prev) => ({
        ...prev,
        mediaUrl: data.url,
        type: isVideoFile ? 'video' : prev.type,
      }));
      setSuccess(`File uploaded successfully: ${file.name}`);
    } catch (err: any) {
      setError(err.message || 'Media upload failed');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.mediaUrl.trim()) {
      setError('Media image or video is required');
      return;
    }

    setSubmitLoading(true);
    setError('');
    try {
      if (editingBanner) {
        const res = await updateHeroBannerAction(editingBanner.id, {
          title: formData.title.trim(),
          type: formData.type,
          mediaUrl: formData.mediaUrl.trim(),
          linkUrl: formData.linkUrl.trim(),
          offerPrice: formData.offerPrice.trim() || undefined,
          regularPrice: formData.regularPrice.trim() || undefined,
          badge: formData.badge.trim() || undefined,
          rotationSeconds: Number(formData.rotationSeconds) || 3,
          sortOrder: Number(formData.sortOrder) || 1,
          isActive: formData.isActive,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setSuccess('Banner updated successfully!');
          setIsModalOpen(false);
          await loadBanners();
        }
      } else {
        const res = await createHeroBannerAction({
          title: formData.title.trim(),
          type: formData.type,
          mediaUrl: formData.mediaUrl.trim(),
          linkUrl: formData.linkUrl.trim(),
          offerPrice: formData.offerPrice.trim() || undefined,
          regularPrice: formData.regularPrice.trim() || undefined,
          badge: formData.badge.trim() || undefined,
          rotationSeconds: Number(formData.rotationSeconds) || 3,
          sortOrder: Number(formData.sortOrder) || 1,
          isActive: formData.isActive,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setSuccess('New banner published successfully!');
          setIsModalOpen(false);
          await loadBanners();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (banner: HeroBannerDTO) => {
    const nextState = !banner.isActive;
    // Optimistic update
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, isActive: nextState } : b))
    );

    try {
      const res = await toggleHeroBannerActiveAction(banner.id, nextState);
      if (res.error) {
        // Rollback
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !nextState } : b))
        );
        setError(res.error);
      } else {
        setSuccess(`Banner "${banner.title}" is now ${nextState ? 'Active' : 'Inactive'}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status');
      await loadBanners();
    }
  };

  const handleDelete = async (banner: HeroBannerDTO) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      return;
    }

    try {
      const res = await deleteHeroBannerAction(banner.id);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Banner "${banner.title}" deleted.`);
        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-1">
            <Sparkles size={12} />
            <span>Homepage Hero Posters &amp; Videos</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Banners &amp; Offers Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage promotional posters, video teasers, and discount cards shown on the homepage hero slider.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBanners}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
            title="Refresh list"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/30 transition hover:-translate-y-px"
          >
            <Plus size={15} />
            <span>Add New Banner / Video</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:text-red-900">
            <X size={13} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={15} className="shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')} className="p-1 hover:text-emerald-900">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Items</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{banners.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active on Home</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {banners.filter((b) => b.isActive).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Images</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {banners.filter((b) => b.type === 'image').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Videos</span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {banners.filter((b) => b.type === 'video').length}
          </div>
        </div>
      </div>

      {/* Banners Grid / Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50/60 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800">
            All Hero Banners &amp; Video Posters
          </div>
          <span className="text-xs text-slate-500">
            Reorder using Sort Order (1 = first to display)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-red-600" />
            <span className="text-xs font-semibold">Loading hero banners...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon size={36} className="mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-bold text-slate-700">No banners configured yet</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &quot;Add New Banner / Video&quot; above to upload your first promotional offer or product teaser.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((banner) => {
              const isVideo = banner.type === 'video';

              return (
                <div
                  key={banner.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  {/* Left: Media Preview & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Media Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {isVideo ? (
                        <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                          <video
                            src={banner.mediaUrl}
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play size={16} className="text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={banner.mediaUrl}
                          alt={banner.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                      <span
                        className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white ${
                          isVideo ? 'bg-purple-600' : 'bg-slate-900/80'
                        }`}
                      >
                        {isVideo ? 'Video' : 'Image'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{banner.sortOrder}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {banner.title}
                        </h3>
                        {banner.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {banner.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {banner.offerPrice && (
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <Tag size={12} className="text-red-600" />
                            {banner.offerPrice}
                            {banner.regularPrice && (
                              <span className="line-through text-slate-400 text-[10px] ml-1">
                                {banner.regularPrice}
                              </span>
                            )}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {banner.rotationSeconds || 3}s per slide
                        </span>

                        {banner.linkUrl && (
                          <Link
                            href={banner.linkUrl}
                            target="_blank"
                            className="text-red-600 hover:underline flex items-center gap-0.5 text-[11px]"
                          >
                            <span>Link</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          banner.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{banner.isActive ? 'Active on Home' : 'Hidden'}</span>
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(banner)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Edit banner"
                    >
                      <Edit2 size={16} />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(banner)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Delete banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingBanner ? 'Edit Banner / Video' : 'Add New Homepage Poster'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload image/video or paste a direct media URL.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Media Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, type: 'image' }))}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      formData.type === 'image'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ImageIcon size={15} />
                    <span>Image / Poster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, type: 'video' }))}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      formData.type === 'video'
                        ? 'border-purple-600 bg-purple-50 text-purple-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Video size={15} />
                    <span>Video Teaser (MP4 / WebM)</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title / Product Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. TTRC LF 6.0 Line Follower Robot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Media File Upload or URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Media Asset (Upload or URL) <span className="text-red-500">*</span>
                </label>

                {/* Upload Zone */}
                <div className="border-2 border-dashed border-slate-200 hover:border-red-400 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-red-50/20 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept={
                      formData.type === 'video'
                        ? 'video/mp4,video/webm,video/quicktime,video/ogg'
                        : 'image/png,image/jpeg,image/webp,image/gif'
                    }
                    onChange={handleFileUpload}
                    disabled={uploadingMedia}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploadingMedia ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading to media storage...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">
                        Click or drag to upload {formData.type === 'video' ? 'video' : 'image'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formData.type === 'video'
                          ? 'MP4, WebM, QuickTime up to 50MB'
                          : 'PNG, JPG, WebP recommended 1:1 square'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct URL Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, mediaUrl: e.target.value }))}
                    placeholder="Or enter direct media URL (/banners/... or https://...)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                {/* Live Preview Box */}
                {formData.mediaUrl && (
                  <div className="mt-2 p-2 bg-slate-50 border rounded-xl flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                      {formData.type === 'video' ? (
                        <video
                          src={formData.mediaUrl}
                          muted
                          playsInline
                          autoPlay
                          loop
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={formData.mediaUrl}
                          alt="Preview"
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 text-[11px] text-slate-600 truncate">
                      <span className="font-bold block text-slate-800">Media Selected:</span>
                      <span className="truncate block text-slate-500">{formData.mediaUrl}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Link URL (when user clicks poster)
                </label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, linkUrl: e.target.value }))}
                  placeholder="e.g. /product/ttrc-lfr-6-0 or /category/stem-kits"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Offer / Deal Price
                  </label>
                  <input
                    type="text"
                    value={formData.offerPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, offerPrice: e.target.value }))}
                    placeholder="e.g. ₹2,999"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regular / MRP Price
                  </label>
                  <input
                    type="text"
                    value={formData.regularPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, regularPrice: e.target.value }))}
                    placeholder="e.g. ₹3,799"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rotation Duration & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slide Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rotationSeconds}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, rotationSeconds: Number(e.target.value) || 3 }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, sortOrder: Number(e.target.value) || 1 }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
                  Display this banner on homepage hero slider
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || uploadingMedia}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Update Banner' : 'Publish Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
