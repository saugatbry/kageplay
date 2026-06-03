export interface MangaSearchResult {
  slug: string;
  title: string;
  poster: string;
  latest_chapter: string;
  type: string;
  time: string;
}

export interface MangaSearchResponse {
  results: MangaSearchResult[];
  success: boolean;
}

export interface MangaChapter {
  id: string;
  number: string;
  title: string;
  url: string;
}

export interface MangaChapterList {
  mangaName: string;
  chapters: MangaChapter[];
}

export interface ChapterImage {
  page: number;
  url: string;
}
