import { GET_ALL_EPISODES } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IEpisodes } from "@/types/episodes";
import { useQuery } from "react-query";

const getAllEpisodes = async (animeId: string, type?: string) => {
  const res = await api.get(`/api/anime/${animeId}/episodes`, {
    params: type ? { type } : undefined,
  });
  return res.data.data as IEpisodes;
};

export const useGetAllEpisodes = (animeId: string, type?: string) => {
  return useQuery({
    queryFn: () => getAllEpisodes(animeId, type),
    queryKey: [GET_ALL_EPISODES, animeId, type],
    enabled: !!animeId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
  });
};
