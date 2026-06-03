import { GET_EPISODE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IEpisodeSource } from "@/types/episodes";
import { useQuery } from "react-query";

const getEpisodeData = async (
  episodeId: string,
  server: string | undefined,
  subOrDub: string,
  type?: string,
) => {
  const params: Record<string, string> = {
    animeEpisodeId: decodeURIComponent(episodeId),
    category: subOrDub,
  };
  if (server) params.server = server;
  if (type) params.type = type;
  const res = await api.get("/api/episode/sources", { params });
  return res.data.data as IEpisodeSource;
};

export const useGetEpisodeData = (
  episodeId: string,
  server: string | undefined,
  subOrDub: string = "sub",
  type?: string,
) => {
  return useQuery({
    queryFn: () => getEpisodeData(episodeId, server, subOrDub, type),
    queryKey: [GET_EPISODE_DATA, episodeId, server, subOrDub, type],
    refetchOnWindowFocus: false,
    enabled: server !== "",
  });
};
