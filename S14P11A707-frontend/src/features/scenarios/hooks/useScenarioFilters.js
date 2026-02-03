import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

const DEFAULTS = {
  tab: "all",
  keyword: "",
  genres: [],
  difficulties: [],
  // 기본값 최신순
  sortBy: "latest",
  page: 0,
  size: 20,
};

const normalizeTab = (value) => (value === "mine" ? "mine" : "all");

const normalizeSortBy = (value) => {
  const v = String(value || "").trim();
  if (v === "latest" || v === "popular" || v === "rating") return v;
  return DEFAULTS.sortBy;
};

const normalizePage = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return DEFAULTS.page;
  return Math.floor(num);
};

const normalizeSize = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return DEFAULTS.size;
  return Math.floor(num);
};

const uniqueStrings = (arr) =>
  Array.from(new Set((arr || []).map((v) => String(v).trim()).filter(Boolean)));

const parseScenarioFiltersFromLocation = (fullUrl) => {
  const search = fullUrl.includes("?") ? fullUrl.split("?")[1] : "";
  const sp = new URLSearchParams(search);

  const tab = normalizeTab(sp.get("tab") || DEFAULTS.tab);
  const keyword = (sp.get("keyword") || DEFAULTS.keyword).trim();
  const genres = uniqueStrings(sp.getAll("genres"));
  const difficulties = uniqueStrings(sp.getAll("difficulties"));
  const sortBy = normalizeSortBy(sp.get("sortBy") || DEFAULTS.sortBy);
  const page = normalizePage(sp.get("page") ?? DEFAULTS.page);
  const size = normalizeSize(sp.get("size") ?? DEFAULTS.size);

  return { tab, keyword, genres, difficulties, sortBy, page, size };
};

const buildScenarioSearchParams = (filters) => {
  const sp = new URLSearchParams();

  const tab = normalizeTab(filters?.tab);
  if (tab !== DEFAULTS.tab) sp.set("tab", tab);

  const keyword = String(filters?.keyword || "").trim();
  if (keyword) sp.set("keyword", keyword);

  uniqueStrings(filters?.genres).forEach((g) => sp.append("genres", g));
  uniqueStrings(filters?.difficulties).forEach((d) =>
    sp.append("difficulties", d),
  );

  // ✅ sortBy는 항상 포함
  sp.set("sortBy", normalizeSortBy(filters?.sortBy));

  const page = normalizePage(filters?.page);
  if (page !== DEFAULTS.page) sp.set("page", String(page));

  const size = normalizeSize(filters?.size);
  if (size !== DEFAULTS.size) sp.set("size", String(size));

  return sp.toString();
};

export function useScenarioFilters() {
  const [loc, setLocation] = useLocation();
  const searchFromHook = useSearch(); // v3면 '?...' / v2면 ''일 수 있음

  // loc가 '/scenarios?x=1' 형태일 수도 있으니 basePath는 무조건 '?' 앞만
  const basePath = useMemo(() => {
    const raw = loc || "/scenarios";
    return raw.split("?")[0] || "/scenarios";
  }, [loc]);

  // search는 v3(useSearch) 우선, 없으면 loc에서 추출 (v2 호환)
  const mergedSearch = useMemo(() => {
    if (searchFromHook)
      return searchFromHook.startsWith("?")
        ? searchFromHook
        : `?${searchFromHook}`;
    const raw = loc || "";
    if (raw.includes("?")) return `?${raw.split("?")[1]}`;
    return "";
  }, [loc, searchFromHook]);

  const filters = useMemo(
    () => parseScenarioFiltersFromLocation(`${basePath}${mergedSearch}`),
    [basePath, mergedSearch],
  );

  const update = useCallback(
    (nextFilters) => {
      const search = buildScenarioSearchParams(nextFilters);
      const nextUrl = search ? `${basePath}?${search}` : basePath;
      setLocation(nextUrl);
    },
    [basePath, setLocation],
  );

  const setTab = useCallback(
    (tab) => update({ ...filters, tab: normalizeTab(tab), page: 0 }),
    [filters, update],
  );

  const applyKeyword = useCallback(
    (keyword) =>
      update({ ...filters, keyword: String(keyword || "").trim(), page: 0 }),
    [filters, update],
  );

  const toggleGenre = useCallback(
    (genre) => {
      const next = new Set(filters.genres);
      const value = String(genre || "").trim();
      if (!value) return;
      if (next.has(value)) next.delete(value);
      else next.add(value);
      update({ ...filters, genres: Array.from(next), page: 0 });
    },
    [filters, update],
  );

  const toggleDifficulty = useCallback(
    (difficulty) => {
      const next = new Set(filters.difficulties);
      const value = String(difficulty || "").trim();
      if (!value) return;
      if (next.has(value)) next.delete(value);
      else next.add(value);
      update({ ...filters, difficulties: Array.from(next), page: 0 });
    },
    [filters, update],
  );

  const clearGenres = useCallback(
    () => update({ ...filters, genres: [], page: 0 }),
    [filters, update],
  );

  const clearDifficulties = useCallback(
    () => update({ ...filters, difficulties: [], page: 0 }),
    [filters, update],
  );

  const setSortBy = useCallback(
    (sortBy) =>
      update({ ...filters, sortBy: normalizeSortBy(sortBy), page: 0 }),
    [filters, update],
  );

  const setPage = useCallback(
    (page) => update({ ...filters, page: normalizePage(page) }),
    [filters, update],
  );

  const setSize = useCallback(
    (size) => update({ ...filters, size: normalizeSize(size), page: 0 }),
    [filters, update],
  );

  const resetFilters = useCallback(
    () =>
      update({
        ...filters,
        keyword: DEFAULTS.keyword,
        genres: DEFAULTS.genres,
        difficulties: DEFAULTS.difficulties,
        sortBy: DEFAULTS.sortBy,
        page: DEFAULTS.page,
        size: DEFAULTS.size,
      }),
    [filters, update],
  );

  return {
    ...filters,
    setTab,
    applyKeyword,
    toggleGenre,
    toggleDifficulty,
    clearGenres,
    clearDifficulties,
    setSortBy,
    setPage,
    setSize,
    resetFilters,
  };
}

export default useScenarioFilters;
