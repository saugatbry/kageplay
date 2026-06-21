"use client";

import Loading from "@/app/loading";
import parse from "html-react-parser";
import { ROUTES } from "@/constants/routes";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { useAnimeStore } from "@/store/anime-store";
import EpisodePlaylist from "@/components/episode-playlist";
import Select, { ISelectOptions } from "@/components/common/select";
import {
  Ban,
  BookmarkCheck,
  CheckCheck,
  Hand,
  TvMinimalPlay,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAnimeDetails } from "@/query/get-anime-details";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import AnimeCarousel from "@/components/anime-carousel";
import { IAnime } from "@/types/anime";
import useBookMarks from "@/hooks/use-get-bookmark";
import Comments from "@/components/comments";
import { toast } from "sonner";
import { useGetAllEpisodes } from "@/query/get-all-episodes";

type Props = {
  children: ReactNode;
};

const SelectOptions: ISelectOptions[] = [
  { value: "plan to watch", label: "Plan to Watch", icon: BookmarkCheck },
  { value: "watching", label: "Watching", icon: TvMinimalPlay },
  { value: "completed", label: "Completed", icon: CheckCheck },
  { value: "on hold", label: "On Hold", icon: Hand },
  { value: "dropped", label: "Dropped", icon: Ban },
];

const Layout = (props: Props) => {
  const searchParams = useSearchParams();
  const { setAnime, setSelectedEpisode, setWatchType } = useAnimeStore();
  const router = useRouter();

  const currentAnimeId = useMemo(
    () => searchParams.get("anime"),
    [searchParams],
  );
  const episodeId = searchParams.get("episode");
  const watchType = searchParams.get("type") as "subdub" | "hindi" | null;

  const [animeId, setAnimeId] = useState<string | null>(currentAnimeId);

  useEffect(() => {
    if (watchType === "subdub" || watchType === "hindi") {
      setWatchType(watchType);
    }
  }, [watchType, setWatchType]);

  useEffect(() => {
    if (currentAnimeId !== animeId) {
      setAnimeId(currentAnimeId);
    }
    if (episodeId) {
      setSelectedEpisode(episodeId);
    }
  }, [currentAnimeId, episodeId, animeId, setSelectedEpisode]);

  const { data: anime, isLoading } = useGetAnimeDetails(animeId as string, watchType as string);

  useEffect(() => {
    if (anime) {
      setAnime(anime);
    }
  }, [anime, setAnime]);

  useEffect(() => {
    if (!animeId) {
      router.push(ROUTES.HOME);
    }
  }, [animeId]);

  const { bookmarks, createOrUpdateBookMark } = useBookMarks({
    animeID: currentAnimeId as string,
    page: 1,
    per_page: 1,
  });
  const [selected, setSelected] = useState("");

  const handleSelect = async (value: string) => {
    const previousSelected = selected;
    setSelected(value);
    try {
      await createOrUpdateBookMark(
        currentAnimeId as string,
        anime?.anime?.info?.name || "",
        anime?.anime?.info?.poster || "",
        value,
      );
    } catch (error) {
      console.log(error);
      setSelected(previousSelected);
      toast.error("Error adding to list", { style: { background: "red" } });
    }
  };

  const { data: rawEpisodes, isLoading: episodeLoading } = useGetAllEpisodes(
    animeId as string,
    watchType as string,
  );

  const episodes = useMemo(() => {
    if (watchType !== "subdub" || !rawEpisodes) return rawEpisodes;
    const epList = rawEpisodes.episodes.length > 0
      ? rawEpisodes.episodes
      : Array.from({ length: rawEpisodes.totalEpisodes }, (_, i) => ({
          number: i + 1,
          episodeId: "",
          title: `Episode ${i + 1}`,
          isFiller: false,
          season: 1,
          image: "",
        }));
    return { totalEpisodes: rawEpisodes.totalEpisodes, episodes: epList, latestAiredEpisode: rawEpisodes.latestAiredEpisode };
  }, [rawEpisodes, watchType]);

  useEffect(() => {
    if (!episodeId && episodes?.episodes && episodes.episodes.length > 0 && currentAnimeId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("episode", String(episodes.episodes[0].number));
      router.replace(`${ROUTES.WATCH}?${params.toString()}`);
    }
  }, [episodeId, episodes, currentAnimeId, router, searchParams]);

  const [activeSeason, setActiveSeason] = useState<number>(1);

  const seasons = useMemo(() => {
    if (!episodes?.episodes) return [];
    const set = new Set<number>();
    for (const ep of episodes.episodes) {
      if (ep.season) set.add(ep.season);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    if (!episodes?.episodes) return [];
    return episodes.episodes.filter((ep) => ep.season === activeSeason);
  }, [episodes, activeSeason]);

  useEffect(() => {
    if (episodeId && episodes?.episodes) {
      const current = episodes.episodes.find(
        (ep) => ep.episodeId === episodeId || String(ep.number) === episodeId,
      );
      if (current?.season) setActiveSeason(current.season);
    }
  }, [episodeId, episodes]);

  if (isLoading) return <Loading />;

  if (watchType === "hindi") {
    return (
      anime?.anime?.info && (
        <Container className="mt-4 pb-20">
          <div className="w-full">{props.children}</div>

          <div className="flex items-center gap-1 overflow-x-auto mt-4 pb-2">
            {seasons.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSeason(s)}
                className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors shrink-0 ${
                  s === activeSeason
                    ? "bg-red-600 text-white"
                    : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                }`}
              >
                Season {s}
              </button>
            ))}
            {seasons.length > 0 && (
              <button className="px-3 py-1.5 text-sm font-semibold bg-slate-800 text-gray-300 rounded shrink-0 hover:bg-slate-700">
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          <div className="grid gap-2 mt-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
            {filteredEpisodes.map((ep) => {
              const seasonLabel = ep.season ? `${ep.season}x${ep.number}` : `${ep.number}`;
              return (
                <button
                  key={ep.episodeId}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("episode", ep.episodeId);
                    router.push(`${ROUTES.WATCH}?${params.toString()}`);
                  }}
                  className="group text-left"
                >
                  <div className="relative aspect-video bg-slate-800 rounded overflow-hidden">
                    {ep.image && (
                      <img
                        src={ep.image}
                        alt={seasonLabel}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                      {seasonLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {anime?.anime?.info?.name} {seasonLabel}
                  </p>
                </button>
              );
            })}
          </div>
          <Comments />
        </Container>
      )
    );
  }

  return (
    anime?.anime?.info && (
      <Container className="mt-4 space-y-10 pb-20">
        <div className="grid lg:grid-cols-4 grid-cols-1 gap-y-5 gap-x-10 h-auto w-full">
          <div className="lg:col-span-3 col-span-1 lg:mb-0">
            {props.children}
          </div>
          <EpisodePlaylist
            animeId={animeId as string}
            title={
              anime?.anime?.info?.name
                ? anime.anime.info.name
                : (anime?.anime?.moreInfo?.japanese as string)
            }
            subOrDub={anime?.anime?.info?.stats?.episodes}
            episodes={episodes ?? { episodes: [], totalEpisodes: 0 }}
            isLoading={episodeLoading}
            bookmarks={bookmarks}
          />
        </div>
        <div className="flex md:flex-row flex-col gap-5">
          <AnimeCard
            title={anime?.anime.info.name}
            poster={anime?.anime.info.poster}
            subTitle={anime?.anime.moreInfo.aired}
            displayDetails={false}
            variant="lg"
            className="shrink-0"
            href={ROUTES.ANIME_DETAILS + "/" + anime?.anime.info.id}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Select
                placeholder="Add to list"
                value={bookmarks?.[0]?.status || selected}
                options={SelectOptions}
                onChange={handleSelect}
              />
            </div>
            <h1 className="text-2xl md:font-black font-extrabold z-[100]">
              {anime?.anime.info.name}
            </h1>
            <p>{parse(anime?.anime.info.description as string)}</p>
          </div>
        </div>
        {anime?.relatedAnimes?.length > 0 && (
          <AnimeCarousel
            title={"Also Watch"}
            anime={anime?.relatedAnimes as IAnime[]}
          />
        )}
        {anime?.recommendedAnimes?.length > 0 && (
          <AnimeCarousel
            title={"Recommended"}
            anime={anime?.recommendedAnimes as IAnime[]}
          />
        )}
        <Comments />
      </Container>
    )
  );
};
export default Layout;