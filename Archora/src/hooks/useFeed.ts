import { useState, useCallback, useRef } from 'react';
import { inspoService } from '../services/inspoService';
import type { Template } from '../types';

export interface FeedFilter {
  buildingType?: string;
  trendingOrNew?: 'trending' | 'new';
  search?: string;
}

interface UseFeedResult {
  templates: Template[];
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  filter: FeedFilter;
  setFilter: (f: FeedFilter) => void;
  refresh: () => Promise<void>;
  fetchMore: () => Promise<void>;
}

const PAGE_SIZE = 20;

function applyClientFilter(templates: Template[], filter: FeedFilter): Template[] {
  let result = [...templates];

  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        t.authorDisplayName.toLowerCase().includes(q),
    );
  }

  if (filter.trendingOrNew === 'trending') {
    result.sort((a, b) => b.likeCount - a.likeCount);
  } else if (filter.trendingOrNew === 'new') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return result;
}

export function useFeed(): UseFeedResult {
  const [rawTemplates, setRawTemplates] = useState<Template[]>([]);
  const [filter, setFilterState] = useState<FeedFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const load = useCallback(async (page: number, replace: boolean) => {
    try {
      const data = await inspoService.getFeed({
        page,
        limit: PAGE_SIZE,
        buildingType: filter.buildingType,
      });
      setHasMore(data.length === PAGE_SIZE);
      setRawTemplates((prev) => (replace ? data : [...prev, ...data]));
      pageRef.current = page;
    } catch {
      // ignore
    }
  }, [filter.buildingType]);

  const setFilter = useCallback((f: FeedFilter) => {
    setFilterState(f);
    pageRef.current = 0;
    setRawTemplates([]);
    setIsLoading(true);
    inspoService
      .getFeed({ page: 0, limit: PAGE_SIZE, buildingType: f.buildingType })
      .then((data) => {
        setHasMore(data.length === PAGE_SIZE);
        setRawTemplates(data);
        pageRef.current = 0;
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await load(0, true);
    setIsRefreshing(false);
  }, [load]);

  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    await load(pageRef.current + 1, false);
    setIsFetchingMore(false);
  }, [isFetchingMore, hasMore, load]);

  // Initial load
  useState(() => {
    setIsLoading(true);
    inspoService
      .getFeed({ page: 0, limit: PAGE_SIZE })
      .then((data) => {
        setHasMore(data.length === PAGE_SIZE);
        setRawTemplates(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  });

  const templates = applyClientFilter(rawTemplates, filter);

  return {
    templates,
    isLoading,
    isRefreshing,
    isFetchingMore,
    hasMore,
    filter,
    setFilter,
    refresh,
    fetchMore,
  };
}
