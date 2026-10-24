export type SearchIntent =
  | 'Commercial / transactional'
  | 'Commercial / informational'
  | 'Informational / AEO'
  | 'Commercial'
  | 'Transactional'
  | 'Informational / commercial'
  | 'B2B / transactional';

export type KeywordPriority = 'High' | 'Content' | 'Research';

export interface KeywordRecord {
  no: number;
  keyword: string;
  cluster: string;
  intent: SearchIntent;
  suggestedPage: string;
  priority: KeywordPriority;
  volume: string;
  normalizedKeyword: string;
  targetUrl: string;
}

export interface ClusterMapping {
  cluster: string;
  canonicalUrl: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  totalKeywords: number;
  highPriorityCount: number;
  contentCount: number;
  researchCount: number;
}

export interface KeywordStats {
  totalRows: number;
  uniqueKeywords: number;
  duplicates: number;
  clusterCounts: Record<string, number>;
  intentCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
}
