import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UnsplashImage {
  id: string;
  description: string;
  thumb: string;
  small: string;
  regular: string;
  photographer: string;
  photographerUsername: string;
  link: string;
}

interface SearchResult {
  results: UnsplashImage[];
  total: number;
  totalPages: number;
  query: string;
  page: number;
}

export function useUnsplashSearch() {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const search = useCallback(async (query: string, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/unsplash-search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query, page }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }));
        throw new Error((err as { error: string }).error ?? 'Search failed');
      }

      const data = await res.json() as SearchResult;
      setImages(data.results);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const nextPage = useCallback(async (query: string) => {
    if (currentPage < totalPages) {
      await search(query, currentPage + 1);
    }
  }, [currentPage, totalPages, search]);

  const clearSearch = useCallback(() => {
    setImages([]);
    setTotal(0);
    setTotalPages(0);
    setCurrentPage(1);
    setError(null);
  }, []);

  return { images, loading, error, total, totalPages, currentPage, search, nextPage, clearSearch };
}