"use client";

import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { ROUTES } from "@/constants/routes";
import { Episode } from "@/types/episodes";
import { useAnimeStore } from "@/store/anime-store";
import { useHasAnimeWatched } from "@/hooks/use-is-anime-watched";
import { Captions, Mic, Clock } from "lucide-react";
import Link from "next/link";
import { WatchHistory } from "@/hooks/use-get-bookmark";

type Props = {
  className?: string;
  episode: Episode;
  showCard?: boolean;
  animeId: string;
  variant?: "card" | "list";
  subOrDub?: { sub: number; dub: number };
  watchedEpisodes?: WatchHistory[] | null;
};

function Countdown({ airingAt }: { airingAt: number }) {
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

  return <span className="text-xs text-yellow-400 flex items-center gap-1"><Clock size={12} />{text}</span>;
}

const EpisodeCard = ({
  showCard = false,
  variant = "card",
  ...props
}: Props) => {
  const { selectedEpisode } = useAnimeStore();
  const { hasWatchedEpisode } = useHasAnimeWatched(
    props.animeId,
    props.episode.episodeId,
    props.watchedEpisodes!,
  );

  const isUpcoming = !!props.episode.airingAt;

  if (showCard && variant === "card") {
    return (
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer ",

          "h-[8.625rem] min-w-[8.625rem] max-w-[10.625rem] md:h-[10.75rem] md:max-w-[12.5rem]",
          props.className,
        ])}
      >
        <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
        <div className="absolute inset-0 m-auto h-full w-full bg-slate-800"></div>
        <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3 z-10">
          <h5 className="line-clamp-2 text-sm font-semibold">{`${props.episode.number}. ${props.episode.title || `Episode ${props.episode.number}`}`}</h5>
        </div>
      </div>
    );
  } else if (!showCard && variant === "card") {
    if (isUpcoming) {
      return (
        <div className="h-[5.25rem] rounded-lg w-full flex flex-col items-center justify-center bg-secondary md:text-base text-xs opacity-60 gap-1">
          <span>{`Episode ${props.episode.number}`}</span>
          <Countdown airingAt={props.episode.airingAt!} />
        </div>
      );
    }
    return (
      <Link
        href={`${ROUTES.WATCH}?anime=${props.animeId}&episode=${props.episode.episodeId}`}
      >
        <div
          className={cn([
            "h-[5.25rem] rounded-lg cursor-pointer w-full flex items-center justify-center bg-secondary md:text-base text-xs",

            hasWatchedEpisode && "bg-slate-900",
          ])}
        >
          {`Episode ${props.episode.number}`}
        </div>
      </Link>
    );
  } else if (!props.episode.episodeId) {
    return (
      <div
        className="flex gap-5 items-center w-full relative h-fit rounded-md p-2"
      >
        <h3>{`Episode ${props.episode.number}`}</h3>
      </div>
    );
  } else if (isUpcoming) {
    return (
      <div
        className="flex gap-5 items-center w-full relative h-fit rounded-md p-2 opacity-70"
        style={
          selectedEpisode === props.episode.episodeId
            ? { backgroundColor: "#3b82f6" }
            : {}
        }
      >
        <h3>{`Episode ${props.episode.number}`}</h3>
        <Countdown airingAt={props.episode.airingAt!} />
      </div>
    );
  } else {
    return (
      <Link
        href={`${ROUTES.WATCH}?anime=${props.animeId}&episode=${props.episode.episodeId}`}
      >
        <div
          className="flex gap-5 items-center w-full relative h-fit rounded-md p-2"
          style={
            selectedEpisode === props.episode.episodeId
              ? { backgroundColor: "#3b82f6" }
              : hasWatchedEpisode
                ? {
                    backgroundColor: "#0f172a",
                  }
                : {}
          }
        >
          <h3>{`Episode ${props.episode.number}`}</h3>
          {props.subOrDub && props.episode.number <= props.subOrDub.sub && (
            <Captions className="text-gray-400" />
          )}
          {props.subOrDub && props.episode.number <= props.subOrDub.dub && (
            <Mic className="text-gray-400" />
          )}
        </div>
      </Link>
    );
  }
};

export default EpisodeCard;
