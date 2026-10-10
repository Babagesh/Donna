import { useInfiniteQuery } from '@tanstack/react-query';
import { liveRequest } from '@/components/donna/live/liveApi';
export default function useLiveDeals(status = 'all', search = '') {
  return useInfiniteQuery({
    queryKey: ['donna-live', 'deals', status, search],
    queryFn: ({ pageParam }) => liveRequest({ action: 'listDeals', status, search, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
    staleTime: 15000, retry: false
  });
}