import { useInfiniteQuery } from '@tanstack/react-query';
import { liveRequest } from '@/components/donna/live/liveApi';
// One query key for the book so every monitoring surface shares the same cached page.
export default function useLiveBook(search = '', sort = 'name') {
  return useInfiniteQuery({
    queryKey: ['donna-live', 'book', search, sort],
    queryFn: ({ pageParam }) => liveRequest({ action: 'getBook', search, sort, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null,
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
    staleTime: 15000, retry: false
  });
}
