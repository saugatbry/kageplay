"use client";

import { useAnilistEpisodeCount } from "@/hooks/use-anilist-episode-count";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

const ACTIVE_BG = "bg-[#3b82f6]";
const DEFAULT_BG = "bg-secondary hover:bg-slate-700 active:bg-slate-600";

type Props = {
  animeId: string;
  pageSize?: number;
  currentEpisode?: number;
};

function generateEpisodes(count: number, pageSize: number, currentPage: number) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, count);
  const items: number[] = [];
  for (let i = start; i <= end; i++) items.push(i);
  return items;
}

export default function EpisodeSelector({
  animeId,
  pageSize = 100,
  currentEpisode: forcedEpisode,
}: Props) {
  const { count, loading, error, retry } = useAnilistEpisodeCount(animeId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRef = useRef<HTMLButtonElement>(null);

  const urlEpisode = searchParams?.get("episode");
  const currentEpisode = forcedEpisode ?? (
    urlEpisode ? parseInt(urlEpisode.split("-").pop()!, 10) : 1
  );

  const totalPages = useMemo(
    () => (count ? Math.ceil(count / pageSize) : 1),
    [count, pageSize],
  );
  const currentPage = useMemo(
    () => Math.min(Math.ceil(currentEpisode / pageSize), totalPages),
    [currentEpisode, pageSize, totalPages],
  );
  const episodes = useMemo(
    () => (count ? generateEpisodes(count, pageSize, currentPage) : []),
    [count, pageSize, currentPage],
  );

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentEpisode, episodes]);

  const goToEpisode = useCallback(
    (num: number) => {
      router.push(`/anime/watch?anime=${animeId}&episode=${animeId}-${num}`);
    },
    [animeId, router],
  );

  const goToPage = useCallback(
    (page: number) => {
      const ep = (page - 1) * pageSize + 1;
      goToEpisode(ep);
    },
    [goToEpisode, pageSize],
  );

  if (loading) {
    return <Skeleton />;
  }

  if (error || !count || count === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-gray-400">
        <span>Could not load episodes</span>
        <button
          onClick={retry}
          className="rounded-md bg-secondary px-4 py-1.5 text-xs font-medium text-white active:scale-95"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {totalPages > 1 && (
        <PageNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6">
        {episodes.map((num) => (
          <button
            key={num}
            ref={num === currentEpisode ? activeRef : undefined}
            onClick={() => goToEpisode(num)}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg text-xs font-medium transition-colors",
              num === currentEpisode
                ? `${ACTIVE_BG} text-white`
                : `${DEFAULT_BG} text-gray-300`,
            )}
            aria-label={`Episode ${num}`}
          >
            {num}
          </button>
        ))}
      </div>

      <Summary count={count} currentEpisode={currentEpisode} />
    </div>
  );
}

function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-md bg-secondary px-3 py-1.5 font-medium text-gray-300 disabled:opacity-30"
      >
        Prev
      </button>
      <span className="text-gray-400">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-md bg-secondary px-3 py-1.5 font-medium text-gray-300 disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}

function Summary({
  count,
  currentEpisode,
}: {
  count: number;
  currentEpisode: number;
}) {
  return (
    <p className="text-xs text-gray-500 text-center">
      Episode {currentEpisode} of {count}
    </p>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-14 rounded-md bg-secondary" />
        <div className="h-4 w-16 rounded bg-secondary" />
        <div className="h-7 w-14 rounded-md bg-secondary" />
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-secondary" />
        ))}
      </div>
    </div>
  );
}
