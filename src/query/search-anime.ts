import { SEARCH_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { ISuggestionAnime } from "@/types/anime";
import { useQuery } from "react-query";

const searchAnime = async (q: string, provider?: string) => {
  if (q === "") {
    return;
  }
  const res = await api.get("/api/search/suggestion", {
    params: {
      q,
      ...(provider ? { provider } : {}),
    },
  });

  return res.data.data as ISuggestionAnime[];
};

export const useSearchAnime = (query: string, provider?: string) => {
  return useQuery({
    queryFn: () => searchAnime(query, provider),
    queryKey: [SEARCH_ANIME, query, provider],
  });
};
