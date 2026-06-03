import { MangaSearchResult } from "./manga";

export interface MangaHomeData {
  recentlyUpdated: MangaSearchResult[];
  popular: MangaSearchResult[];
}
