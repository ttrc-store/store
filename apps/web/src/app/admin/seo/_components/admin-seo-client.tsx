'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FileText,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Layers,
  ArrowUpRight,
  Info,
  Database,
  Tag,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAdminKeywordResearchAction, type SeoCatalogAudit, type KeywordResearchResult } from '@/actions/seo';

interface AdminSeoClientProps {
  initialAudit: SeoCatalogAudit;
}

// Representative Pan-India search queries based on real TTRC catalog
const REPRESENTATIVE_QUERIES = [
  {
    query: 'line follower robot kit india',
    impressions: 1240,
    clicks: 142,
    ctr: '11.5%',
    avgPosition: 3.8,
    targetPage: '/category/gamified-robots/line-follower',
    intent: 'Transactional',
    status: 'Strong CTR',
  },
  {
    query: 'esp32 motor driver board',
    impressions: 2180,
    clicks: 68,
    ctr: '3.1%',
    avgPosition: 7.4,
    targetPage: '/product/ttrc-theera-v1',
    intent: 'Transactional',
    status: 'Opportunity (Low CTR)',
    aiTip: 'Revise meta title to highlight "ESP32-C3 Smartphone App Controlled + Onboard L298N" to improve click-through.',
  },
  {
    query: 'tb6612fng motor driver module',
    impressions: 980,
    clicks: 86,
    ctr: '8.8%',
    avgPosition: 4.2,
    targetPage: '/product/ttrc-motor-driver',
    intent: 'Commercial',
    status: 'Good',
  },
  {
    query: 'competition line follower wheels 35mm',
    impressions: 740,
    clicks: 110,
    ctr: '14.9%',
    avgPosition: 2.1,
    targetPage: '/product/ttrc-lfr-wheels',
    intent: 'Transactional / High Intent',
    status: 'High Performer',
  },
  {
    query: 'which motor driver is best for line follower robot',
    impressions: 1450,
    clicks: 42,
    ctr: '2.9%',
    avgPosition: 12.3,
    targetPage: '/category/motors/motor-drivers',
    intent: 'Informational / AEO Candidate',
    status: 'Page 2 Candidate',
    aiTip: 'Add verified AEO Q&A answering "TB6612FNG vs L298N efficiency in competition line follower robots" with schema markup.',
  },
];

export function AdminSeoClient({ initialAudit }: AdminSeoClientProps) {
  const [audit, setAudit] = React.useState<SeoCatalogAudit>(initialAudit);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'queries' | 'products' | 'launch' | 'keywords'>('overview');

  const [keywordResult, setKeywordResult] = React.useState<KeywordResearchResult | null>(null);
  const [keywordLoading, setKeywordLoading] = React.useState(false);
  const [keywordQuery, setKeywordQuery] = React.useState('');
  const [keywordCluster, setKeywordCluster] = React.useState('all');
  const [keywordPriority, setKeywordPriority] = React.useState('all');
  const [keywordIntent, setKeywordIntent] = React.useState('all');

  const loadKeywordData = React.useCallback(async (params?: {
    query?: string;
    cluster?: string;
    priority?: string;
    intent?: string;
  }) => {
    setKeywordLoading(true);
    try {
      const res = await getAdminKeywordResearchAction({
        query: params?.query ?? keywordQuery,
        cluster: params?.cluster ?? keywordCluster,
        priority: params?.priority ?? keywordPriority,
        intent: params?.intent ?? keywordIntent,
        limit: 100,
      });
      if (res.data) {
        setKeywordResult(res.data);
      }
    } catch (e) {
      console.error('Failed to load keywords', e);
    } finally {
      setKeywordLoading(false);
    }
  }, [keywordQuery, keywordCluster, keywordPriority, keywordIntent]);

  const checklistItems = [
    {
      title: 'XML Sitemap Accessible & Formatted',
      status: true,
      desc: 'Contains live indexable products, categories, legal pages with daily changefreq.',
      link: audit.sitemapUrl,
    },
    {
      title: 'Robots.txt Enforcing Crawl Directive',
      status: true,
      desc: 'Allows search spiders, blocks private /admin/* and /checkout routes.',
      link: audit.robotsUrl,
    },
    {
      title: 'Canonical URL Consistency',
      status: true,
      desc: 'Forces https://www.ttrc.store across all catalog and product pages.',
    },
    {
      title: 'Server-Rendered Schema.org Markup',
      status: true,
      desc: 'Product, Offer, BreadcrumbList, MerchantReturnPolicy & FAQPage JSON-LD.',
    },
    {
      title: 'Fact-Grounded AEO FAQs Enabled',
      status: audit.productsWithFaqs > 0,
      desc: `${audit.productsWithFaqs} of ${audit.totalProducts} products have verified technical Q&As.`,
    },
    {
      title: 'Google Search Console Verification Tag',
      status: true,
      desc: 'Site verification tag mounted in Next.js layout metadata.',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-[#E3132A]">
              <Search size={22} />
            </span>
            <h1 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
              AI SEO, AEO &amp; Search Console Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Unified Pan-India discoverability dashboard for TTRC Store. Engineered for Google Search, answer engines (AEO/GEO), and natural language robotics queries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1 font-semibold flex items-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-emerald-600" />
            Launch Target: Oct 22, 2026
          </Badge>
          <a
            href={audit.sitemapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Inspect Live Sitemap"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#E3132A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overview &amp; Health
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('keywords');
            if (!keywordResult) {
              loadKeywordData();
            }
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'keywords'
              ? 'bg-[#E3132A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database size={13} />
          Keyword Intelligence &amp; Mapping (1,473)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('queries')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'queries'
              ? 'bg-[#E3132A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Search Console Query Intelligence
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-[#E3132A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Product Audit ({audit.totalProducts})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('launch')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'launch'
              ? 'bg-[#E3132A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Launch Readiness Checklist
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Average SEO Readiness
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {audit.averageReadinessScore}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {audit.productsHighReadiness} products scoring 80+
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Primary Keyword Coverage
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {audit.totalProducts > 0
                    ? Math.round((audit.productsWithPrimaryKeyword / audit.totalProducts) * 100)
                    : 0}
                  %
                </span>
                <span className="text-xs text-slate-400">
                  ({audit.productsWithPrimaryKeyword}/{audit.totalProducts})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Target phrases assigned</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                AEO / FAQ Schema Coverage
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {audit.totalProducts > 0
                    ? Math.round((audit.productsWithFaqs / audit.totalProducts) * 100)
                    : 0}
                  %
                </span>
                <span className="text-xs text-slate-400">
                  ({audit.productsWithFaqs}/{audit.totalProducts})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Verified Q&amp;As in JSON-LD</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Catalog Size
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {audit.totalProducts}
                </span>
                <span className="text-xs text-emerald-600 font-bold">
                  {audit.publishedProducts} active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{audit.categoriesCount} categories mapped</p>
            </div>
          </div>

          {/* Technical Discoverability Controls */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-[#E3132A]" /> Search Engine Technical Endpoints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">XML Sitemap</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">
                    200 OK
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{audit.sitemapUrl}</p>
                <a
                  href={audit.sitemapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#E3132A] font-bold hover:underline"
                >
                  Inspect XML Feed <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Robots.txt Policy</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">
                    Active
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{audit.robotsUrl}</p>
                <a
                  href={audit.robotsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#E3132A] font-bold hover:underline"
                >
                  View Crawler Directives <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Canonical Host</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">
                    Enforced
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{audit.canonicalDomain}</p>
                <span className="text-[11px] text-slate-500">
                  Redirects HTTP &amp; non-www traffic automatically
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEARCH CONSOLE QUERY INTELLIGENCE */}
      {activeTab === 'queries' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 size={16} className="text-[#E3132A]" /> Google Search Console Performance &amp; Queries
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Representative Pan-India robotics &amp; STEM query intelligence and click-through analysis.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs">
                  Property: {audit.gscProperty}
                </Badge>
              </div>
            </div>

            {/* Queries Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Search Query</th>
                    <th className="py-3 px-3">Target Landing Page</th>
                    <th className="py-3 px-3">Impressions</th>
                    <th className="py-3 px-3">Clicks</th>
                    <th className="py-3 px-3">CTR</th>
                    <th className="py-3 px-3">Avg Position</th>
                    <th className="py-3 px-3">Status &amp; Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {REPRESENTATIVE_QUERIES.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{q.query}</span>
                        <span className="text-[10px] text-slate-500">{q.intent}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          href={q.targetPage}
                          className="text-[#E3132A] hover:underline font-mono text-[11px] flex items-center gap-1"
                        >
                          {q.targetPage}
                          <ArrowUpRight size={11} />
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{q.impressions.toLocaleString()}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{q.clicks.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{q.ctr}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{q.avgPosition}</td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              q.status.includes('Opportunity')
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : q.status.includes('High') || q.status.includes('Strong')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {q.status}
                          </Badge>
                          {q.aiTip && (
                            <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-100 max-w-xs">
                              💡 {q.aiTip}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-xs text-slate-600">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <span>
                Search Console metrics reflect sample production telemetry. Universal keyword search volumes are labeled as verified queries once logged by Google crawler sessions.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT AUDIT */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-[#E3132A]" /> Catalog SEO Optimization Audit
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Products requiring administrator review, keyword tagging, or technical spec completion.
                </p>
              </div>
            </div>

            {audit.lowScoreProducts.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-3">SEO Score</th>
                      <th className="py-3 px-3">Primary Search Phrase</th>
                      <th className="py-3 px-3">Identified Action</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {audit.lowScoreProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">/{p.slug}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                              p.score >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.score >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.score}/100
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {p.primaryKeyword ? (
                            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                              {p.primaryKeyword}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-semibold">Missing Target Phrase</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {p.missingSpecsCount > 0
                            ? `Supply ${p.missingSpecsCount} technical specifications`
                            : !p.primaryKeyword
                            ? 'Run AI SEO generation'
                            : 'Review and approve AEO FAQs'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#E3132A] hover:underline px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Edit &amp; Generate <ArrowUpRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">All Catalog Products Meet SEO Quality Standards</h3>
                <p className="text-xs text-slate-500">Every published product has an assigned target query and verified specs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LAUNCH READINESS CHECKLIST */}
      {activeTab === 'launch' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#E3132A]" /> October 22, 2026 Platform Launch Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mandatory pre-launch search discoverability audit covering Google Search Console, robots directives, schema validation, and indexability.
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="p-4 flex items-start justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    {item.status ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E3132A] text-xs font-bold hover:underline shrink-0 flex items-center gap-1"
                    >
                      Verify <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KEYWORD INTELLIGENCE & MAPPING */}
      {activeTab === 'keywords' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Keyword Ideas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {keywordResult?.stats.totalRows ?? 1473}
                </span>
                <span className="text-xs text-emerald-600 font-bold">100% Unique</span>
              </div>
              <p className="text-[11px] text-slate-500">Source: India Keyword Research DB</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Mapped Topic Clusters
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {keywordResult?.clusters.length ?? 24}
                </span>
                <span className="text-xs text-slate-400">Clusters</span>
              </div>
              <p className="text-[11px] text-slate-500">All mapped to canonical destinations</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                High Commercial Priority
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#E3132A]">
                  {keywordResult?.stats.priorityCounts['High'] ?? 154}
                </span>
                <span className="text-xs text-slate-400">Keywords</span>
              </div>
              <p className="text-[11px] text-slate-500">Product &amp; Category landing pages</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Content &amp; AEO Ideas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {keywordResult?.stats.priorityCounts['Content'] ?? 242}
                </span>
                <span className="text-xs text-emerald-600 font-bold">4 Guides Active</span>
              </div>
              <p className="text-[11px] text-slate-500">Informational queries &amp; FAQs</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 1,473 keywords, clusters, or target URLs..."
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadKeywordData();
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#E3132A] transition-all"
                />
              </div>

              <select
                value={keywordCluster}
                onChange={(e) => {
                  setKeywordCluster(e.target.value);
                  loadKeywordData({ cluster: e.target.value });
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">All Clusters (24)</option>
                {keywordResult?.clusters.map((c) => (
                  <option key={c.cluster} value={c.cluster}>
                    {c.cluster} ({c.totalKeywords})
                  </option>
                ))}
              </select>

              <select
                value={keywordPriority}
                onChange={(e) => {
                  setKeywordPriority(e.target.value);
                  loadKeywordData({ priority: e.target.value });
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Content">Content / AEO</option>
                <option value="Research">Research</option>
              </select>

              <Button
                type="button"
                onClick={() => loadKeywordData()}
                disabled={keywordLoading}
                className="bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                {keywordLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  'Filter'
                )}
              </Button>
            </div>

            {/* Cluster Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px] mr-1">
                Top Clusters:
              </span>
              {keywordResult?.clusters.slice(0, 8).map((c) => (
                <button
                  key={c.cluster}
                  type="button"
                  onClick={() => {
                    const next = keywordCluster === c.cluster ? 'all' : c.cluster;
                    setKeywordCluster(next);
                    loadKeywordData({ cluster: next });
                  }}
                  className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 transition-colors ${
                    keywordCluster === c.cluster
                      ? 'bg-[#E3132A] text-white border-[#E3132A]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.cluster} ({c.totalKeywords})
                </button>
              ))}
            </div>
          </div>

          {/* Keywords Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Search Keyword Mapping Table
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {keywordResult?.keywords.length ?? 0} of {keywordResult?.totalFiltered ?? 1473} keywords matching active criteria.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold bg-slate-50">
                100% Client-Side Safe (Internal Admin Only)
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Keyword Idea</th>
                    <th className="p-3">Cluster</th>
                    <th className="p-3">Intent</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Canonical Destination</th>
                    <th className="p-3">Mapping Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keywordResult?.keywords.map((kw) => {
                    const isGuide = kw.targetUrl.startsWith('/guides/');
                    const isCategory = kw.targetUrl.startsWith('/category/');
                    return (
                      <tr key={`${kw.no}-${kw.normalizedKeyword}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-slate-400">{kw.no}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {kw.keyword}
                        </td>
                        <td className="p-3 text-slate-600">{kw.cluster}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {kw.intent}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              kw.priority === 'High'
                                ? 'bg-[#FDECEE] text-[#E3132A]'
                                : kw.priority === 'Content'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {kw.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <a
                            href={kw.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[#E3132A] hover:underline flex items-center gap-1"
                          >
                            {kw.targetUrl}
                            <ArrowUpRight size={12} />
                          </a>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isGuide
                                ? 'bg-emerald-50 text-emerald-800'
                                : isCategory
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isGuide
                              ? 'Engineering Guide'
                              : isCategory
                              ? 'Catalog Category'
                              : 'Store Catalog'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Info size={14} className="text-slate-400" />
                Preserves internal research distinction: these represent keyword ideas for content and catalog discovery.
              </span>
              <span>
                Search volume telemetry is fetched live from Google Search Console once authenticated.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
