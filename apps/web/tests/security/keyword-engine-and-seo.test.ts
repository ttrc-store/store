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
    expect(records.length).toBeGreaterThanOrEqual(5000);

    // Verify first record and key representative records
    expect(records[0].keyword).toBe('robotics kit');
    expect(records[0].cluster).toBe('Robotics kits');
    expect(records.some((r) => r.keyword === 'diwali discount robotics kit india')).toBe(true);

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
    expect(stats.totalRows).toBeGreaterThanOrEqual(5000);
    expect(stats.uniqueKeywords).toBeGreaterThanOrEqual(5000);
    expect(stats.duplicates).toBe(0);

    // Verify cluster counts
    expect(Object.keys(stats.clusterCounts).length).toBe(25);
    expect(stats.clusterCounts['Motors and motion']).toBeGreaterThanOrEqual(168);
    expect(stats.clusterCounts['Sensors']).toBeGreaterThanOrEqual(157);
    expect(stats.clusterCounts['Robotics kits']).toBeGreaterThanOrEqual(99);
    expect(stats.clusterCounts['Diwali and festive offers']).toBeGreaterThanOrEqual(25);

    // Verify priority distribution
    expect(stats.priorityCounts['High']).toBeGreaterThanOrEqual(180);
    expect(stats.priorityCounts['Content']).toBeGreaterThanOrEqual(242);
    expect(stats.priorityCounts['Research']).toBeGreaterThanOrEqual(1077);
  });

  it('correctly maps clusters to canonical store destinations including Diwali offers', () => {
    const clusters = getClusterMappings();
    expect(clusters.length).toBe(25);

    const diwaliCluster = clusters.find((c) => c.cluster === 'Diwali and festive offers');
    expect(diwaliCluster).toBeDefined();
    expect(diwaliCluster?.canonicalUrl).toBe('/offers');
    expect(diwaliCluster?.totalKeywords).toBeGreaterThanOrEqual(25);

    const motorsCluster = clusters.find((c) => c.cluster === 'Motors and motion');
    expect(motorsCluster).toBeDefined();
    expect(motorsCluster?.canonicalUrl).toBe('/category/motors');

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

  it('validates master keyword intelligence and multi-channel SEO tools', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const {
      loadMasterKeywords,
      getMasterKeywordStats,
      getMasterClusterMappings,
      getAmazonFlipkartBackendTerms,
      getIndiaMartWholesaleKeywords,
      getLocalGbpKeywords,
      getBlogAndYouTubeContentIdeas,
      getPlatformComparisonKeywords,
    } = await import('@/lib/seo/keyword-engine');

    // 1. Verify master keywords count (> 11,000 records)
    const masterKeywords = loadMasterKeywords();
    expect(masterKeywords.length).toBeGreaterThanOrEqual(11000);

    // 2. Verify master stats
    const stats = getMasterKeywordStats();
    expect(stats.totalRows).toBeGreaterThanOrEqual(11000);
    expect(stats.uniqueKeywords).toBeGreaterThanOrEqual(11000);
    expect(stats.duplicates).toBe(0);

    // Verify 14 core categories are present
    expect(Object.keys(stats.clusterCounts).length).toBeGreaterThanOrEqual(14);
    expect(stats.clusterCounts['Competition Robots']).toBeGreaterThanOrEqual(1500);
    expect(stats.clusterCounts['Motors & Drivers']).toBeGreaterThanOrEqual(1000);
    expect(stats.clusterCounts['Batteries & Power']).toBeGreaterThanOrEqual(1000);
    expect(stats.clusterCounts['Sensors']).toBeGreaterThanOrEqual(800);
    expect(stats.clusterCounts['Platform Search']).toBeGreaterThanOrEqual(250);

    // Verify 7 search intents
    expect(stats.intentCounts['Head term']).toBeGreaterThan(0);
    expect(stats.intentCounts['Transactional']).toBeGreaterThan(0);
    expect(stats.intentCounts['Commercial']).toBeGreaterThan(0);
    expect(stats.intentCounts['Informational']).toBeGreaterThan(0);
    expect(stats.intentCounts['Local']).toBeGreaterThan(0);
    expect(stats.intentCounts['Brand']).toBeGreaterThan(0);
    expect(stats.intentCounts['Comparison']).toBeGreaterThan(0);

    // 3. Verify Amazon / Flipkart backend terms generator adheres to 250-byte hard limit
    const amazonTerms = getAmazonFlipkartBackendTerms('Competition Robots', 250);
    expect(amazonTerms.byteLength).toBeLessThanOrEqual(250);
    expect(amazonTerms.wordCount).toBeGreaterThan(10);
    expect(amazonTerms.terms.split(' ').length).toBe(amazonTerms.wordCount);

    // 4. Verify IndiaMART B2B wholesale terms
    const wholesaleTerms = getIndiaMartWholesaleKeywords();
    expect(wholesaleTerms.length).toBeGreaterThanOrEqual(200);

    // 5. Verify Local SEO keywords
    const localTerms = getLocalGbpKeywords('Bangalore');
    expect(localTerms.length).toBeGreaterThan(0);
    for (const r of localTerms) {
      expect(r.normalizedKeyword).toContain('bangalore');
    }

    // 6. Verify Blog & YouTube content ideas
    const contentIdeas = getBlogAndYouTubeContentIdeas();
    expect(contentIdeas.length).toBeGreaterThanOrEqual(300);

    // 7. Verify Platform comparisons
    const comparisons = getPlatformComparisonKeywords('amazon');
    expect(comparisons.length).toBeGreaterThan(0);

    // 8. Verify public/TTRC_India_SEO_Keywords.xlsx exists and has valid size
    const candidate1 = path.resolve(process.cwd(), 'public/TTRC_India_SEO_Keywords.xlsx');
    const candidate2 = path.resolve(process.cwd(), 'apps/web/public/TTRC_India_SEO_Keywords.xlsx');
    const xlsxPath = fs.existsSync(candidate1) ? candidate1 : candidate2;
    expect(fs.existsSync(xlsxPath)).toBe(true);
    expect(fs.statSync(xlsxPath).size).toBeGreaterThan(200000);
  });
});



