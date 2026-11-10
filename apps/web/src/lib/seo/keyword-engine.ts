import fs from 'fs';
import path from 'path';
import type { KeywordRecord, KeywordStats, ClusterMapping, SearchIntent, KeywordPriority } from './types';

// Authoritative mapping of categories and research clusters to canonical URLs
export const CLUSTER_CANONICAL_MAP: Record<string, { canonicalUrl: string; primaryKeyword: string }> = {
  // ─── Backward-Compatible Research Clusters ────────────────────────────────
  'Motors and motion': {
    canonicalUrl: '/category/motors',
    primaryKeyword: 'robotics motors and drivers',
  },
  'Robotics kits': {
    canonicalUrl: '/category/gamified-robots',
    primaryKeyword: 'robotics kits India',
  },
  'Sensors': {
    canonicalUrl: '/category/sensors',
    primaryKeyword: 'robotics sensors and sensor arrays',
  },
  'Arduino boards and kits': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'Arduino robotics kits India',
  },
  'Electronic components': {
    canonicalUrl: '/category/fasteners',
    primaryKeyword: 'electronic components and fasteners',
  },
  'STEM and education': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'STEM learning kits India',
  },
  'Motor drivers and control': {
    canonicalUrl: '/category/motors',
    primaryKeyword: 'motor driver modules',
  },
  'Wireless and IoT': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'wireless robotics modules',
  },
  'ESP32 and development boards': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'ESP32 development boards robotics',
  },
  'Competition robotics': {
    canonicalUrl: '/category/gamified-robots',
    primaryKeyword: 'competition line follower robot kit',
  },
  'Tools and accessories': {
    canonicalUrl: '/category/fasteners',
    primaryKeyword: 'robotics tools and hardware',
  },
  'Projects and use cases': {
    canonicalUrl: '/guides',
    primaryKeyword: 'robotics projects components',
  },
  'Robotics mechanical parts': {
    canonicalUrl: '/category/fasteners',
    primaryKeyword: 'robotics chassis and mechanical parts',
  },
  'Embedded and prototyping': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'robotics prototyping boards',
  },
  'India and regional': {
    canonicalUrl: '/',
    primaryKeyword: 'robotics store India',
  },
  'Institutional and bulk orders': {
    canonicalUrl: '/bulk-enquiry',
    primaryKeyword: 'bulk robotics components school lab',
  },
  'Power and batteries': {
    canonicalUrl: '/category/batteries',
    primaryKeyword: 'LiPo batteries robotics India',
  },
  'Boards and controllers': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'robotics microcontroller boards',
  },
  'Drone and automation': {
    canonicalUrl: '/category/drones',
    primaryKeyword: 'drone kits and carbon frames',
  },
  'Communication and identification': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'wireless communication modules',
  },
  'Displays and indicators': {
    canonicalUrl: '/category/sensors',
    primaryKeyword: 'OLED LCD display modules robotics',
  },
  'Switches and input devices': {
    canonicalUrl: '/category/fasteners',
    primaryKeyword: 'tactile switches and robotics inputs',
  },
  'Electronics learning and lab': {
    canonicalUrl: '/bulk-enquiry',
    primaryKeyword: 'electronics lab equipment schools',
  },
  'Power electronics': {
    canonicalUrl: '/category/batteries',
    primaryKeyword: 'voltage regulators and BMS modules',
  },
  'Diwali and festive offers': {
    canonicalUrl: '/offers',
    primaryKeyword: 'diwali robotics offers India',
  },

  // ─── Master 14 Categories from TTRC_India_SEO_Keywords.xlsx ──────────────
  'Competition Robots': {
    canonicalUrl: '/category/gamified-robots',
    primaryKeyword: 'competition line follower robot kit India',
  },
  'Motors & Drivers': {
    canonicalUrl: '/category/motors',
    primaryKeyword: 'robotics motors and motor drivers India',
  },
  'Batteries & Power': {
    canonicalUrl: '/category/batteries',
    primaryKeyword: 'LiPo batteries 18650 BMS robotics India',
  },
  'Fasteners & Hardware': {
    canonicalUrl: '/category/fasteners',
    primaryKeyword: 'screws nuts standoffs robotics fasteners India',
  },
  'Microcontrollers & Boards': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'ESP32 Arduino development boards robotics India',
  },
  'Drones': {
    canonicalUrl: '/category/drones',
    primaryKeyword: 'drone kits carbon frames ESC flight controller India',
  },
  'Wires & Connectors': {
    canonicalUrl: '/category/wires-connectors',
    primaryKeyword: 'XT60 JST jumper wires robotics connectors India',
  },
  'Tools': {
    canonicalUrl: '/category/fasteners',
    primaryKeyword: 'soldering iron robotics tools hardware India',
  },
  'STEM & Education': {
    canonicalUrl: '/category/stem-kits',
    primaryKeyword: 'STEM learning ATL lab robotics kits India',
  },
  'Platform Search': {
    canonicalUrl: '/search',
    primaryKeyword: 'buy robotics components India online alternative',
  },
  'Regional & Hinglish': {
    canonicalUrl: '/',
    primaryKeyword: 'robotics store Tamil Nadu Coimbatore Chennai Bangalore',
  },
  'Brand & Store': {
    canonicalUrl: '/',
    primaryKeyword: 'TTRC Store Tamizh Tech robotics electronics India',
  },
  'Events & How-To': {
    canonicalUrl: '/guides',
    primaryKeyword: 'line follower robot rules PID tuning techfest robotics India',
  },
};

let cachedKeywords: KeywordRecord[] | null = null;
let cachedStats: KeywordStats | null = null;
let cachedMasterKeywords: KeywordRecord[] | null = null;
let cachedMasterStats: KeywordStats | null = null;

export function resolveCsvPath(): string {
  // 1. Direct relative path from this file (src/lib/seo/ -> data/)
  const relativeFromSource = path.resolve(__dirname, '../../data/ttrc_store_india_keyword_research_500_plus.csv');
  if (fs.existsSync(relativeFromSource)) return relativeFromSource;

  // 2. Process cwd paths (workspace root or apps/web)
  const cwdCandidate1 = path.resolve(process.cwd(), 'apps/web/data/ttrc_store_india_keyword_research_500_plus.csv');
  if (fs.existsSync(cwdCandidate1)) return cwdCandidate1;

  const cwdCandidate2 = path.resolve(process.cwd(), 'data/ttrc_store_india_keyword_research_500_plus.csv');
  if (fs.existsSync(cwdCandidate2)) return cwdCandidate2;

  return relativeFromSource;
}

export function resolveMasterJsonPath(): string {
  const relativeFromSource = path.resolve(__dirname, '../../data/ttrc_india_seo_keywords_master.json');
  if (fs.existsSync(relativeFromSource)) return relativeFromSource;

  const cwdCandidate1 = path.resolve(process.cwd(), 'apps/web/data/ttrc_india_seo_keywords_master.json');
  if (fs.existsSync(cwdCandidate1)) return cwdCandidate1;

  const cwdCandidate2 = path.resolve(process.cwd(), 'data/ttrc_india_seo_keywords_master.json');
  if (fs.existsSync(cwdCandidate2)) return cwdCandidate2;

  return relativeFromSource;
}

function parseCsvTokens(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur.trim());
  return cells;
}

/**
 * Loads baseline keywords from CSV (backward-compatible with unit tests and original 25 clusters).
 */
export function loadAndParseKeywords(): KeywordRecord[] {
  if (cachedKeywords) return cachedKeywords;

  const csvPath = resolveCsvPath();
  if (!fs.existsSync(csvPath)) {
    console.warn(`[KeywordEngine] CSV not found at: ${csvPath}`);
    return [];
  }

  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const records: KeywordRecord[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvTokens(lines[i]);
    if (cols.length < 5 || !cols[1]) continue;

    const no = parseInt(cols[0], 10) || i;
    const keyword = cols[1];
    const cluster = cols[2] || 'Uncategorized';
    const intent = (cols[3] as SearchIntent) || 'Commercial / transactional';
    const suggestedPage = cols[4] || '';
    const priority = (cols[5] as KeywordPriority) || 'Research';
    const volume = cols[6] || 'Not yet verified';
    const normalizedKeyword = keyword.trim().toLowerCase();

    let targetUrl = CLUSTER_CANONICAL_MAP[cluster]?.canonicalUrl || '/search';

    if (intent === 'Informational / AEO' || priority === 'Content') {
      if (normalizedKeyword.includes('line follower') || normalizedKeyword.includes('lfr')) {
        targetUrl = '/guides/line-follower-robot-components';
      } else if (normalizedKeyword.includes('motor driver') || normalizedKeyword.includes('tb6612') || normalizedKeyword.includes('l298n')) {
        targetUrl = '/guides/motor-driver-selection-guide';
      } else if (normalizedKeyword.includes('choose') || normalizedKeyword.includes('which robot kit') || normalizedKeyword.includes('starter kit')) {
        targetUrl = '/guides/how-to-choose-robotics-kit';
      } else if (normalizedKeyword.includes('sensor') || normalizedKeyword.includes('ultrasonic') || normalizedKeyword.includes('ir sensor')) {
        targetUrl = '/guides/robotics-sensors-guide';
      }
    }

    records.push({
      no,
      keyword,
      cluster,
      category: cluster,
      intent,
      suggestedPage,
      priority,
      volume,
      normalizedKeyword,
      targetUrl,
    });
    seen.add(normalizedKeyword);
  }

  cachedKeywords = records;
  return records;
}

/**
 * Loads the complete master keyword intelligence dataset from TTRC_India_SEO_Keywords.xlsx
 * containing 11,855 unique terms mapped across 14 categories and 7 search intents.
 */
export function loadMasterKeywords(): KeywordRecord[] {
  if (cachedMasterKeywords) return cachedMasterKeywords;

  const jsonPath = resolveMasterJsonPath();
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const items: Array<{
        keyword: string;
        category: string;
        intent: SearchIntent;
        normalizedKeyword: string;
      }> = JSON.parse(raw);

      const records: KeywordRecord[] = items.map((item, index) => {
        const no = index + 1;
        const cluster = item.category;
        const normalized = item.normalizedKeyword || item.keyword.toLowerCase().trim();

        // Map priority
        let priority: KeywordPriority = 'Research';
        if (item.intent === 'Head term' || item.intent === 'Transactional' || item.intent === 'Brand') {
          priority = 'High';
        } else if (item.intent === 'Informational') {
          priority = 'Content';
        } else if (item.intent === 'Comparison') {
          priority = 'Marketplace';
        } else if (item.intent === 'Local') {
          priority = 'Local';
        } else if (item.intent === 'Commercial') {
          priority = 'High';
        }

        // Map canonical target URL
        let targetUrl = CLUSTER_CANONICAL_MAP[cluster]?.canonicalUrl || '/search';
        if (item.intent === 'Informational' || cluster === 'Events & How-To') {
          if (normalized.includes('line follower') || normalized.includes('lfr') || normalized.includes('pid')) {
            targetUrl = '/guides/line-follower-robot-components';
          } else if (normalized.includes('motor driver') || normalized.includes('tb6612') || normalized.includes('l298n')) {
            targetUrl = '/guides/motor-driver-selection-guide';
          } else if (normalized.includes('starter kit') || normalized.includes('which robot kit') || normalized.includes('how to choose')) {
            targetUrl = '/guides/how-to-choose-robotics-kit';
          } else if (normalized.includes('sensor')) {
            targetUrl = '/guides/robotics-sensors-guide';
          } else {
            targetUrl = '/guides';
          }
        } else if (normalized.includes('wholesale') || normalized.includes('bulk') || normalized.includes('school lab') || normalized.includes('atl lab')) {
          targetUrl = '/bulk-enquiry';
        } else if (normalized.includes('diwali') || normalized.includes('coupon') || normalized.includes('festive offer')) {
          targetUrl = '/offers';
        }

        return {
          no,
          keyword: item.keyword,
          cluster,
          category: item.category,
          intent: item.intent,
          suggestedPage: cluster,
          priority,
          volume: 'India Verified',
          normalizedKeyword: normalized,
          targetUrl,
        };
      });

      cachedMasterKeywords = records;
      return records;
    } catch (e) {
      console.error('[KeywordEngine] Error loading master JSON:', e);
    }
  }

  // Fallback to baseline CSV
  return loadAndParseKeywords();
}

export function getKeywordStats(): KeywordStats {
  if (cachedStats) return cachedStats;

  const records = loadAndParseKeywords();
  const clusterCounts: Record<string, number> = {};
  const intentCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  const uniqueKeys = new Set<string>();
  let duplicates = 0;

  for (const r of records) {
    if (uniqueKeys.has(r.normalizedKeyword)) {
      duplicates++;
    } else {
      uniqueKeys.add(r.normalizedKeyword);
    }
    clusterCounts[r.cluster] = (clusterCounts[r.cluster] || 0) + 1;
    intentCounts[r.intent] = (intentCounts[r.intent] || 0) + 1;
    priorityCounts[r.priority] = (priorityCounts[r.priority] || 0) + 1;
  }

  cachedStats = {
    totalRows: records.length,
    uniqueKeywords: uniqueKeys.size,
    duplicates,
    clusterCounts,
    intentCounts,
    priorityCounts,
  };

  return cachedStats;
}

export function getMasterKeywordStats(): KeywordStats {
  if (cachedMasterStats) return cachedMasterStats;

  const records = loadMasterKeywords();
  const clusterCounts: Record<string, number> = {};
  const intentCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  const uniqueKeys = new Set<string>();
  let duplicates = 0;

  for (const r of records) {
    if (uniqueKeys.has(r.normalizedKeyword)) {
      duplicates++;
    } else {
      uniqueKeys.add(r.normalizedKeyword);
    }
    clusterCounts[r.cluster] = (clusterCounts[r.cluster] || 0) + 1;
    intentCounts[r.intent] = (intentCounts[r.intent] || 0) + 1;
    priorityCounts[r.priority] = (priorityCounts[r.priority] || 0) + 1;
  }

  cachedMasterStats = {
    totalRows: records.length,
    uniqueKeywords: uniqueKeys.size,
    duplicates,
    clusterCounts,
    intentCounts,
    priorityCounts,
  };

  return cachedMasterStats;
}

export function getKeywordsForCluster(clusterName: string): KeywordRecord[] {
  const records = loadMasterKeywords();
  return records.filter((r) => r.cluster.toLowerCase() === clusterName.toLowerCase());
}

export function getClusterMappingForRoute(pathname: string): {
  cluster: string;
  canonicalUrl: string;
  primaryKeyword: string;
} | undefined {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const entry = Object.entries(CLUSTER_CANONICAL_MAP).find(([, val]) => val.canonicalUrl === cleanPath);
  if (!entry) return undefined;
  return {
    cluster: entry[0],
    canonicalUrl: entry[1].canonicalUrl,
    primaryKeyword: entry[1].primaryKeyword,
  };
}

export function getKeywordsForRoute(pathname: string): {
  primaryKeyword?: string;
  cluster?: string;
  keywords: KeywordRecord[];
} {
  const records = loadMasterKeywords();
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  const matchEntry = Object.entries(CLUSTER_CANONICAL_MAP).find(
    ([, val]) => val.canonicalUrl === cleanPath
  );

  const matchedKeywords = records.filter((r) => r.targetUrl === cleanPath);

  return {
    primaryKeyword: matchEntry ? matchEntry[1].primaryKeyword : undefined,
    cluster: matchEntry ? matchEntry[0] : undefined,
    keywords: matchedKeywords,
  };
}

export function searchKeywords(query: string, limit = 50): KeywordRecord[] {
  const records = loadMasterKeywords();
  const q = query.trim().toLowerCase();
  if (!q) return records.slice(0, limit);

  return records
    .filter((r) => r.normalizedKeyword.includes(q) || r.cluster.toLowerCase().includes(q))
    .slice(0, limit);
}

export function getClusterMappings(): ClusterMapping[] {
  const records = loadAndParseKeywords();
  const clusters = Array.from(new Set(records.map((r) => r.cluster)));

  return clusters.map((c) => {
    const clusterKeywords = records.filter((r) => r.cluster === c);
    const mapInfo = CLUSTER_CANONICAL_MAP[c] || {
      canonicalUrl: '/search',
      primaryKeyword: c,
    };

    const secondaryKeywords = clusterKeywords
      .filter((k) => k.priority === 'High' || k.priority === 'Content')
      .slice(0, 5)
      .map((k) => k.keyword);

    return {
      cluster: c,
      canonicalUrl: mapInfo.canonicalUrl,
      primaryKeyword: mapInfo.primaryKeyword,
      secondaryKeywords,
      totalKeywords: clusterKeywords.length,
      highPriorityCount: clusterKeywords.filter((k) => k.priority === 'High').length,
      contentCount: clusterKeywords.filter((k) => k.priority === 'Content').length,
      researchCount: clusterKeywords.filter((k) => k.priority === 'Research').length,
    };
  });
}

export function getMasterClusterMappings(): ClusterMapping[] {
  const records = loadMasterKeywords();
  const categories = [
    'Competition Robots',
    'Motors & Drivers',
    'Sensors',
    'Batteries & Power',
    'Fasteners & Hardware',
    'Microcontrollers & Boards',
    'Drones',
    'Wires & Connectors',
    'Tools',
    'STEM & Education',
    'Platform Search',
    'Regional & Hinglish',
    'Brand & Store',
    'Events & How-To',
  ];

  return categories.map((cat) => {
    const catKeywords = records.filter((r) => r.cluster === cat || r.category === cat);
    const mapInfo = CLUSTER_CANONICAL_MAP[cat] || {
      canonicalUrl: '/search',
      primaryKeyword: cat,
    };

    const secondaryKeywords = catKeywords
      .filter((k) => k.intent === 'Head term' || k.intent === 'Transactional')
      .slice(0, 6)
      .map((k) => k.keyword);

    return {
      cluster: cat,
      canonicalUrl: mapInfo.canonicalUrl,
      primaryKeyword: mapInfo.primaryKeyword,
      secondaryKeywords,
      totalKeywords: catKeywords.length,
      highPriorityCount: catKeywords.filter((k) => k.priority === 'High').length,
      contentCount: catKeywords.filter((k) => k.priority === 'Content').length,
      researchCount: catKeywords.filter((k) => k.priority === 'Research').length,
      headTermCount: catKeywords.filter((k) => k.intent === 'Head term').length,
      transactionalCount: catKeywords.filter((k) => k.intent === 'Transactional').length,
      commercialCount: catKeywords.filter((k) => k.intent === 'Commercial').length,
      informationalCount: catKeywords.filter((k) => k.intent === 'Informational').length,
      localCount: catKeywords.filter((k) => k.intent === 'Local').length,
      brandCount: catKeywords.filter((k) => k.intent === 'Brand').length,
      comparisonCount: catKeywords.filter((k) => k.intent === 'Comparison').length,
    };
  });
}

// ─── Channel-Specific SEO Generation Tools ──────────────────────────────────

/**
 * Generates an Amazon/Flipkart backend search term string within the strict 250-byte limit.
 * Rules: space-separated, deduplicated, no punctuation, max length 250 bytes.
 */
export function getAmazonFlipkartBackendTerms(category?: string, maxBytes = 250): {
  terms: string;
  byteLength: number;
  wordCount: number;
} {
  const records = loadMasterKeywords();
  const pool = category && category !== 'all'
    ? records.filter((r) => r.category === category || r.cluster === category)
    : records;

  const targetKws = pool.filter((r) => r.intent === 'Head term' || r.intent === 'Transactional');

  const words: string[] = [];
  const stopWords = new Set(['and', 'or', 'in', 'for', 'with', 'a', 'an', 'the', 'of', 'to', 'at']);

  for (const item of targetKws) {
    const rawWords = item.keyword.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    for (const w of rawWords) {
      if (w.length < 2 || stopWords.has(w) || words.includes(w)) continue;
      const testString = [...words, w].join(' ');
      const byteLen = Buffer.byteLength(testString, 'utf8');
      if (byteLen <= maxBytes) {
        words.push(w);
      } else {
        break;
      }
    }
  }

  const terms = words.join(' ');
  return {
    terms,
    byteLength: Buffer.byteLength(terms, 'utf8'),
    wordCount: words.length,
  };
}

/**
 * Returns IndiaMART B2B, wholesale, supplier, and bulk procurement search terms.
 */
export function getIndiaMartWholesaleKeywords(category?: string): KeywordRecord[] {
  const records = loadMasterKeywords();
  const pool = category && category !== 'all'
    ? records.filter((r) => r.category === category || r.cluster === category)
    : records;

  return pool.filter((r) => {
    const k = r.normalizedKeyword;
    return (
      k.includes('wholesale') ||
      k.includes('bulk') ||
      k.includes('supplier') ||
      k.includes('dealer') ||
      k.includes('distributor') ||
      k.includes('school lab') ||
      k.includes('atl lab') ||
      k.includes('institution')
    );
  });
}

/**
 * Returns Local SEO search terms for Google Business Profile across major Indian tech hubs.
 */
export function getLocalGbpKeywords(city?: string): KeywordRecord[] {
  const records = loadMasterKeywords();
  const pool = records.filter((r) => r.intent === 'Local' || r.category === 'Regional & Hinglish');
  if (!city || city === 'all') return pool;

  const targetCity = city.toLowerCase();
  return pool.filter((r) => r.normalizedKeyword.includes(targetCity));
}

/**
 * Returns Blog, YouTube, and Answer Engine Optimization (AEO) content ideas.
 */
export function getBlogAndYouTubeContentIdeas(category?: string): KeywordRecord[] {
  const records = loadMasterKeywords();
  const pool = category && category !== 'all'
    ? records.filter((r) => r.category === category || r.cluster === category)
    : records;

  return pool.filter((r) => {
    if (r.category === 'Events & How-To') return true;
    if (r.intent !== 'Informational') return false;
    const k = r.normalizedKeyword;
    return (
      k.includes('how to') ||
      k.includes('what is') ||
      k.includes('rules') ||
      k.includes('pid') ||
      k.includes('tuning') ||
      k.includes('guide') ||
      k.includes('tutorial') ||
      k.includes('difference between') ||
      k.includes('why')
    );
  });
}

/**
 * Returns competitor and marketplace comparison keywords (Amazon, Flipkart, Robu, ThinkRobotics, etc.).
 */
export function getPlatformComparisonKeywords(platform?: string): KeywordRecord[] {
  const records = loadMasterKeywords();
  const pool = records.filter((r) => r.category === 'Platform Search' || r.intent === 'Comparison');
  if (!platform || platform === 'all') return pool;

  const targetPlatform = platform.toLowerCase();
  return pool.filter((r) => r.normalizedKeyword.includes(targetPlatform));
}
