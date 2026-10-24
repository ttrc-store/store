import fs from 'fs';
import path from 'path';
import type { KeywordRecord, KeywordStats, ClusterMapping, SearchIntent, KeywordPriority } from './types';

// Authoritative mapping of research clusters to existing and planned canonical URLs
export const CLUSTER_CANONICAL_MAP: Record<string, { canonicalUrl: string; primaryKeyword: string }> = {
  'Motors and motion': {
    canonicalUrl: '/category/motors',
    primaryKeyword: 'robotics motors and drivers',
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
  'Robotics kits': {
    canonicalUrl: '/category/gamified-robots',
    primaryKeyword: 'robotics kits India',
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
};

let cachedKeywords: KeywordRecord[] | null = null;
let cachedStats: KeywordStats | null = null;

export function resolveCsvPath(): string {
  // 1. Direct relative path from this file (src/lib/seo/ -> data/)
  const relativeFromSource = path.resolve(__dirname, '../../data/ttrc_store_india_keyword_research_500_plus.csv');
  if (fs.existsSync(relativeFromSource)) return relativeFromSource;

  // 2. Process cwd paths (workspace root or apps/web)
  const cwdCandidate1 = path.resolve(process.cwd(), 'apps/web/data/ttrc_store_india_keyword_research_500_plus.csv');
  if (fs.existsSync(cwdCandidate1)) return cwdCandidate1;

  const cwdCandidate2 = path.resolve(process.cwd(), 'data/ttrc_store_india_keyword_research_500_plus.csv');
  if (fs.existsSync(cwdCandidate2)) return cwdCandidate2;

  // 3. Fallback relative to workspace root
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

    // Determine target URL from cluster mapping or guide mapping
    let targetUrl = CLUSTER_CANONICAL_MAP[cluster]?.canonicalUrl || '/search';
    
    // Map specific high-value informational questions to guides
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

export function getKeywordsForCluster(clusterName: string): KeywordRecord[] {
  const records = loadAndParseKeywords();
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
  const records = loadAndParseKeywords();
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // Find matching cluster mapping
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
  const records = loadAndParseKeywords();
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
