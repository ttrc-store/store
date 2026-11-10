export type SearchIntent =
  | 'Head term'
  | 'Transactional'
  | 'Commercial'
  | 'Informational'
  | 'Local'
  | 'Brand'
  | 'Comparison'
  | 'Commercial / transactional'
  | 'Commercial / informational'
  | 'Informational / AEO'
  | 'Informational / commercial'
  | 'B2B / transactional';

export type KeywordPriority = 'High' | 'Content' | 'Research' | 'Marketplace' | 'Local';

export interface KeywordRecord {
  no: number;
  keyword: string;
  cluster: string;
  category?: string;
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
  headTermCount?: number;
  transactionalCount?: number;
  commercialCount?: number;
  informationalCount?: number;
  localCount?: number;
  brandCount?: number;
  comparisonCount?: number;
}

export interface KeywordStats {
  totalRows: number;
  uniqueKeywords: number;
  duplicates: number;
  clusterCounts: Record<string, number>;
  intentCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
}

