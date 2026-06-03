"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";

import { IWatchedAnime } from "@/types/watched-anime";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useGetEpisodeServers } from "@/query/get-episode-servers";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import { getFallbackServer } from "@/utils/fallback-server";
import { Captions, Globe, Mic, StepForward, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function CountdownDisplay({ airingAt }: { airingAt: number }) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const now = Math.floor(Date.now() / 1000);
      const diff = airingAt - now;
      if (diff <= 0) { setText("Releasing now"); return; }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      if (d > 0) { setText(`Releasing in ${d}d ${h}h ${m}m`); }
      else if (h > 0) { setText(`Releasing in ${h}h ${m}m`); }
      else { setText(`Releasing in ${m}m`); }
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [airingAt]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-yellow-400 gap-3">
      <Clock size={48} />
      <span className="text-2xl font-semibold">{text}</span>
      <span className="text-sm text-gray-500">This episode has not aired yet</span>
    </div>
  );
}

const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const episodeId = searchParams.get("episode");
  const { selectedEpisode, anime, watchType } = useAnimeStore();
  const animeId = anime?.anime?.info?.id;

  const activeEpisode = episodeId || selectedEpisode;
  const activeEpisodeId = activeEpisode;

  const { data: serversData } = useGetEpisodeServers(activeEpisode, watchType as string);
  const { data: episodesData } = useGetAllEpisodes(animeId ?? "", watchType as string);

  const isMAL = animeId ? /^\d+$/.test(animeId) : false;
  const isHindi = watchType === "hindi";

  const currentEpIndex = useMemo(() => {
    if (!episodesData?.episodes) return -1;
    return episodesData.episodes.findIndex(
      (ep) => ep.episodeId === activeEpisode,
    );
  }, [episodesData, activeEpisode]);

  const currentEpisode = useMemo(() => {
    if (currentEpIndex < 0 || !episodesData?.episodes) return null;
    return episodesData.episodes[currentEpIndex];
  }, [episodesData, currentEpIndex]);

  const currentEpisodeAiringAt = currentEpisode?.airingAt;

  const nextEpisode = useMemo(() => {
    if (currentEpIndex < 0 || !episodesData?.episodes) return null;
    return episodesData.episodes[currentEpIndex + 1] || null;
  }, [currentEpIndex, episodesData]);

  const [preferDub, setPreferDub] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("preferDub") === "true";
    }
    return true;
  });

  const [hindiServerIndex, setHindiServerIndex] = useState<number>(0);

  const [serverName, setServerName] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    [],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("watched");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setWatchedDetails(parsed);
      }
    } catch {
      localStorage.removeItem("watched");
    }
  }, []);

  useEffect(() => {
    const { serverName, key } = getFallbackServer(serversData);
    setServerName(serverName);
    setKey(key);
  }, [serversData]);

  const hindiServers = useMemo(() => {
    const all = serversData?.sub ?? [];
    return all.length > 0 ? all : serversData?.dub ?? [];
  }, [serversData]);

  const selectedHindiServer = hindiServers[hindiServerIndex] || null;

  const episodeDataKey = isHindi
    ? selectedHindiServer?.serverName || ""
    : serverName;
  const episodeDataCategory = isHindi ? "sub" : key;

  const { data: episodeData } = useGetEpisodeData(
    selectedEpisode,
    episodeDataKey,
    episodeDataCategory,
    watchType as string,
  );

  const hasDub = !!(serversData?.dub ?? []).length;
  const isUsingSub = !preferDub || !hasDub;

  useEffect(() => {
    const animeIdStore = anime?.anime?.info?.id;
    const animeName = anime?.anime?.info?.name;
    const animePoster = anime?.anime?.info?.poster;

    if (!episodeData || !animeIdStore || !selectedEpisode) return;

    let currentWatched: Array<IWatchedAnime> = [];
    try {
      const stored = localStorage.getItem("watched");
      if (stored) currentWatched = JSON.parse(stored);
    } catch {
      localStorage.removeItem("watched");
    }
    if (!Array.isArray(currentWatched)) {
      localStorage.removeItem("watched");
      currentWatched = [];
    }

    const existingAnime = currentWatched.find(
      (wa) => wa.anime.id === animeIdStore,
    );

    if (!existingAnime) {
      const next = [
        ...currentWatched,
        {
          anime: {
            id: animeIdStore,
            title: animeName ?? "",
            poster: animePoster ?? "",
          },
          episodes: [selectedEpisode],
        },
      ];
      localStorage.setItem("watched", JSON.stringify(next));
      setWatchedDetails(next);
    } else if (!existingAnime.episodes.includes(selectedEpisode)) {
      const next = currentWatched.map((wa) =>
        wa.anime.id === animeIdStore
          ? { ...wa, episodes: [...wa.episodes, selectedEpisode] }
          : wa,
      );
      localStorage.setItem("watched", JSON.stringify(next));
      setWatchedDetails(next);
    }
    //eslint-disable-next-line
  }, [episodeData, selectedEpisode, anime]);

  const embedUrl = useMemo(() => {
    if (episodeData?.sources?.[0]?.url) {
      return episodeData.sources[0].url + (episodeData.sources[0].url.includes("?") ? "&" : "?") + "autoplay=1";
    }
    return "";
  }, [episodeData]);

  const handleNextEpisode = () => {
    if (!nextEpisode) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("episode", nextEpisode.episodeId);
    router.push(`/anime/watch?${params.toString()}`);
  };

  return (
    activeEpisodeId &&
    serversData && (
      <>
        <div
          className={
            "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
          }
        >
          {currentEpisodeAiringAt ? (
            <CountdownDisplay airingAt={currentEpisodeAiringAt} />
          ) : serversData?.unavailable ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-orange-400 gap-3">
              <span className="text-3xl">🎬</span>
              <span className="text-xl font-semibold">Dub yet to be released</span>
              <span className="text-sm text-gray-500">This episode is not available yet</span>
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
              {...(isHindi ? { scrolling: "no" } : {})}
              style={{ border: 0 }}
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Loading player...
            </div>
          )}
        </div>
        <div className="flex space-x-3 p-2 bg-[#0f172a] items-center flex-wrap gap-y-2">
          {isHindi ? (
            <>
              <Globe className="text-orange-400" />
              <span className="text-sm font-semibold text-orange-400 mr-2">
                Hindi Dub
              </span>
              {hindiServers.map((server, i) => (
                  <Button
                    key={i}
                    size="sm"
                    className={`text-xs uppercase font-bold ${
                      hindiServerIndex === i
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    onClick={() => setHindiServerIndex(i)}
                  >
                    {server.serverName || `Server ${i + 1}`}
                  </Button>
                ))}
            </>
          ) : (
            <>
              <p>Sub/Dub: </p>
              {!!(serversData.sub ?? []).length && (
                <Button
                  className={`${isUsingSub && "bg-red-500 hover:bg-red-600"}`}
                  size="icon"
                  onClick={() => {
                    localStorage.setItem("preferDub", "false");
                    setPreferDub(false);
                  }}
                >
                  <Captions className={`${isUsingSub && "text-white"}`} />
                </Button>
              )}

              {hasDub && (
                <Button
                  className={`${preferDub && "bg-green-500 hover:bg-green-600"}`}
                  size="icon"
                  onClick={() => {
                    localStorage.setItem("preferDub", "true");
                    setPreferDub(true);
                  }}
                >
                  <Mic className={`${preferDub && "text-white"}`} />
                </Button>
              )}
            </>
          )}

          <div className="flex-1" />

          {nextEpisode && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNextEpisode}
            >
              <StepForward className="mr-1 h-4 w-4" />
              Play Next (Ep {nextEpisode.number})
            </Button>
          )}
        </div>
      </>
    )
  );
};

export default VideoPlayerSection;
