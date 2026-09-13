export const DEFAULT_PAGE_LIMIT = 10;

export function normalizePageParams(params = {}) {
  const page = Math.max(1, Math.trunc(Number(params.page) || 1));
  const requestedLimit = Math.trunc(Number(params.limit) || DEFAULT_PAGE_LIMIT);
  const limit = Math.min(DEFAULT_PAGE_LIMIT, Math.max(1, requestedLimit));
  return Object.fromEntries(
    Object.entries({ ...params, page, limit }).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  );
}

export function readPageMeta(meta = {}, itemCount = 0) {
  const page = Math.max(1, Number(meta.page) || 1);
  const limit = Math.min(DEFAULT_PAGE_LIMIT, Math.max(1, Number(meta.limit) || DEFAULT_PAGE_LIMIT));
  const total = Math.max(0, Number(meta.total) || itemCount);
  const pages = Math.max(1, Number(meta.pages) || Math.ceil(total / limit));
  return { page, limit, total, pages, hasNext: Boolean(meta.hasNext ?? page < pages), hasPrevious: Boolean(meta.hasPrevious ?? page > 1) };
}

export function resetPageOnFilterChange(previous, next) {
  const { page: _previousPage, ...previousFilters } = previous || {};
  const { page: _nextPage, ...nextFilters } = next || {};
  return JSON.stringify(previousFilters) === JSON.stringify(nextFilters) ? next : { ...next, page: 1 };
}
