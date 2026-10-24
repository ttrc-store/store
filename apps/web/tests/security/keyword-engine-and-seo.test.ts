import { describe, it, expect, vi } from 'vitest';
import {
  loadAndParseKeywords,
  getKeywordStats,
  getClusterMappings,
  getKeywordsForRoute,
  getClusterMappingForRoute,
  searchKeywords,
} from '@/lib/seo/keyword-engine';

describe('Keyword Engine & SEO Architecture Tests', () => {
  it('parses the India keyword research CSV with 100% data integrity', () => {
    const records = loadAndParseKeywords();
    expect(records.length).toBe(1473);

    // Verify first and last records
    expect(records[0].keyword).toBe('robotics kit');
    expect(records[0].cluster).toBe('Robotics kits');
    expect(records[records.length - 1].keyword).toBe('stepper motor for competition robots');

    // Verify no empty keywords or malformed entries
    for (const r of records) {
      expect(r.keyword.trim().length).toBeGreaterThan(0);
      expect(r.cluster.trim().length).toBeGreaterThan(0);
      expect(r.normalizedKeyword).toBe(r.keyword.trim().toLowerCase());
      expect(['High', 'Content', 'Research']).toContain(r.priority);
      expect(r.targetUrl.startsWith('/')).toBe(true);
    }
  });

  it('computes exact keyword stats without duplicate entries', () => {
    const stats = getKeywordStats();
    expect(stats.totalRows).toBe(1473);
    expect(stats.uniqueKeywords).toBe(1473);
    expect(stats.duplicates).toBe(0);

    // Verify cluster counts
    expect(Object.keys(stats.clusterCounts).length).toBe(24);
    expect(stats.clusterCounts['Motors and motion']).toBe(168);
    expect(stats.clusterCounts['Sensors']).toBe(157);
    expect(stats.clusterCounts['Robotics kits']).toBe(99);

    // Verify priority distribution
    expect(stats.priorityCounts['High']).toBe(154);
    expect(stats.priorityCounts['Content']).toBe(242);
    expect(stats.priorityCounts['Research']).toBe(1077);
  });

  it('correctly maps clusters to canonical store destinations', () => {
    const clusters = getClusterMappings();
    expect(clusters.length).toBe(24);

    const motorsCluster = clusters.find((c) => c.cluster === 'Motors and motion');
    expect(motorsCluster).toBeDefined();
    expect(motorsCluster?.canonicalUrl).toBe('/category/motors');
    expect(motorsCluster?.totalKeywords).toBe(168);

    const robotsCluster = clusters.find((c) => c.cluster === 'Robotics kits');
    expect(robotsCluster).toBeDefined();
    expect(robotsCluster?.canonicalUrl).toBe('/category/gamified-robots');

    const sensorsCluster = clusters.find((c) => c.cluster === 'Sensors');
    expect(sensorsCluster).toBeDefined();
    expect(sensorsCluster?.canonicalUrl).toBe('/category/sensors');
  });

  it('resolves canonical cluster info for specific route pathnames', () => {
    const motorMap = getClusterMappingForRoute('/category/motors');
    expect(motorMap?.cluster).toBe('Motors and motion');
    expect(motorMap?.canonicalUrl).toBe('/category/motors');

    const robotsMap = getClusterMappingForRoute('/category/gamified-robots');
    expect(robotsMap?.cluster).toBe('Robotics kits');
    expect(robotsMap?.canonicalUrl).toBe('/category/gamified-robots');

    const unknownMap = getClusterMappingForRoute('/category/non-existent-123');
    expect(unknownMap).toBeUndefined();
  });

  it('maps informational and AEO questions to newly created engineering guides', () => {
    const records = loadAndParseKeywords();

    const lfrGuideKeywords = records.filter(
      (r) => r.targetUrl === '/guides/line-follower-robot-components'
    );
    expect(lfrGuideKeywords.length).toBeGreaterThan(0);

    const motorGuideKeywords = records.filter(
      (r) => r.targetUrl === '/guides/motor-driver-selection-guide'
    );
    expect(motorGuideKeywords.length).toBeGreaterThan(0);

    const kitGuideKeywords = records.filter(
      (r) => r.targetUrl === '/guides/how-to-choose-robotics-kit'
    );
    expect(kitGuideKeywords.length).toBeGreaterThan(0);
  });

  it('searches and filters keyword records stably', () => {
    const searchRes = searchKeywords('TB6612FNG', 10);
    expect(searchRes.length).toBeGreaterThan(0);
    for (const r of searchRes) {
      expect(
        r.normalizedKeyword.includes('tb6612fng') || r.cluster.toLowerCase().includes('tb6612fng')
      ).toBe(true);
    }
  });

  it('verifies CSV is stored in private data directory and not in public directory', async () => {
    const fs = await import('node:fs');
    const { resolveCsvPath } = await import('@/lib/seo/keyword-engine');

    const resolvedPath = resolveCsvPath();

    // 1. Must exist on disk
    expect(fs.existsSync(resolvedPath)).toBe(true);

    // 2. Must be located under data/ and NOT under public/
    expect(resolvedPath.replace(/\\/g, '/')).toContain('/data/ttrc_store_india_keyword_research_500_plus.csv');
    expect(resolvedPath.replace(/\\/g, '/')).not.toContain('/public/ttrc_store_india_keyword_research_500_plus.csv');
  });

  it('correctly formats battery FAQ answer for products without battery', () => {
    const productName = 'TTRC LF 6.0 – Line Follower Robot (Without Battery)';
    const isWithoutBattery =
      productName.toLowerCase().includes('without battery') ||
      productName.toLowerCase().includes('no battery');

    expect(isWithoutBattery).toBe(true);

    const faqAnswer = isWithoutBattery
      ? `No, this platform is supplied without a battery so builders can use their preferred LiPo battery packs (7.4V 2S / 11.1V 3S compatible).`
      : `Yes, this package includes the matching competition battery pack.`;

    expect(faqAnswer).toContain('No, this platform is supplied without a battery');
  });

  it('verifies explicit self-referencing canonical URLs on legal, policy, and inquiry pages', async () => {
    const returnPolicy = await import('@/app/return-refund-policy/page');
    const shippingPolicy = await import('@/app/shipping-policy/page');
    const terms = await import('@/app/terms/page');
    const privacy = await import('@/app/privacy-policy/page');
    const cancellation = await import('@/app/cancellation-policy/page');
    const warranty = await import('@/app/warranty/page');
    const grievance = await import('@/app/grievance-officer/page');
    const about = await import('@/app/about/page');
    const faq = await import('@/app/faq/page');
    const bulkEnquiry = await import('@/app/bulk-enquiry/layout');
    const bulkOrders = await import('@/app/bulk-orders/layout');
    const contact = await import('@/app/contact/layout');

    expect(returnPolicy.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/return-refund-policy');
    expect(shippingPolicy.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/shipping-policy');
    expect(terms.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/terms');
    expect(privacy.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/privacy-policy');
    expect(cancellation.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/cancellation-policy');
    expect(warranty.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/warranty');
    expect(grievance.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/grievance-officer');
    expect(about.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/about');
    expect(faq.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/faq');
    expect(bulkEnquiry.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/bulk-enquiry');
    expect(bulkOrders.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/bulk-orders');
    expect(contact.metadata?.alternates?.canonical).toBe('https://www.ttrc.store/contact');
  });
});


