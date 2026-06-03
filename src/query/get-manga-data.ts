import { SEARCH_MANGA, GET_MANGA_CHAPTERS, GET_CHAPTER_IMAGES } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { MangaSearchResult, MangaChapter, ChapterImage } from "@/types/manga";
import { useQuery } from "react-query";

const searchMangaApi = async (q: string) => {
  const res = await api.get("/api/manga/search", { params: { q } });
  return res.data.data as MangaSearchResult[];
};

export const useSearchManga = (q: string) => {
  return useQuery({
    queryFn: () => searchMangaApi(q),
    queryKey: [SEARCH_MANGA, q],
    enabled: q.trim().length > 0,
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 5,
  });
};

const getChaptersApi = async (name: string, start = 1, end = 1000) => {
  const res = await api.get("/api/manga/chapters", { params: { name, start, end } });
  return res.data.data as { mangaName: string; chapters: MangaChapter[] };
};

export const useGetMangaChapters = (name: string, start = 1, end = 1000) => {
  return useQuery({
    queryFn: () => getChaptersApi(name, start, end),
    queryKey: [GET_MANGA_CHAPTERS, name, start, end],
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });
};

const getChapterImagesApi = async (url: string) => {
  const res = await api.get("/api/manga/images", { params: { url } });
  return res.data.data as ChapterImage[];
};

export const useGetChapterImages = (url: string) => {
  return useQuery({
    queryFn: () => getChapterImagesApi(url),
    queryKey: [GET_CHAPTER_IMAGES, url],
    enabled: !!url,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
};
