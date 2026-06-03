import { GET_ANIME_DETAILS } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeDetails } from "@/types/anime-details";
import { useQuery } from "react-query";

const getAnimeDetails = async (animeId: string, type?: string) => {
  const res = await api.get("/api/anime/" + animeId, {
    params: type ? { type } : undefined,
  });
  return res.data.data as IAnimeDetails;
};

export const useGetAnimeDetails = (animeId: string, type?: string) => {
  return useQuery({
    queryFn: () => getAnimeDetails(animeId, type),
    queryKey: [GET_ANIME_DETAILS, animeId, type],
  });
};
