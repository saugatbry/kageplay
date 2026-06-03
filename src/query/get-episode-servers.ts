import { GET_EPISODE_SERVERS } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IEpisodeServers } from "@/types/episodes";
import { useQuery } from "react-query";

const getEpisodeServers = async (episodeId: string, type?: string) => {
  const params: Record<string, string> = {
    animeEpisodeId: decodeURIComponent(episodeId),
  };
  if (type) params.type = type;
  const res = await api.get("/api/episode/servers", { params });
  return res.data.data as IEpisodeServers;
};

export const useGetEpisodeServers = (episodeId: string, type?: string) => {
  return useQuery({
    queryFn: () => getEpisodeServers(episodeId, type),
    queryKey: [GET_EPISODE_SERVERS, episodeId, type],
    enabled: !!episodeId,
    refetchOnWindowFocus: false,
  });
};
