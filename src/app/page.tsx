"use client";

import dynamic from "next/dynamic";
import ContinueWatching from "@/components/continue-watching";
import FeaturedCollection from "@/components/featured-collection";
import HeroSection from "@/components/hero-section";
import LatestEpisodesAnime from "@/components/latest-episodes-section";
import AnimeSections from "@/components/anime-sections";

const AnimeSchedule = dynamic(() => import("@/components/anime-schedule"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-5 py-10 items-center lg:items-start px-4">
      <div className="h-10 w-[7rem] animate-pulse bg-slate-700 rounded"></div>
      <div className="h-14 w-full animate-pulse bg-slate-700 rounded"></div>
      <div className="h-14 w-full animate-pulse bg-slate-700 rounded"></div>
      <div className="h-14 w-full animate-pulse bg-slate-700 rounded"></div>
    </div>
  ),
});
import { useGetHomePageData } from "@/query/get-home-page-data";
import { IAnime, LatestCompletedAnime, SpotlightAnime } from "@/types/anime";

export default function Home() {
  const { data, isLoading, isError } = useGetHomePageData();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white gap-4">
        <h2 className="text-2xl font-bold">Failed to load anime data</h2>
        <p className="text-gray-400">The API might be rate-limited or unavailable. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb]"
        >
          Refresh
        </button>
      </div>
    );
  }

  const hasData = data && data.spotlightAnimes && data.spotlightAnimes.length > 0;

  return (
    <>
      <HeroSection
        spotlightAnime={(data?.spotlightAnimes ?? []) as SpotlightAnime[]}
        isDataLoading={isLoading}
      />
      {hasData && (
        <>
          <ContinueWatching loading={isLoading} />

          <LatestEpisodesAnime
            loading={isLoading}
            latestEpisodes={(data?.latestEpisodeAnimes ?? []) as LatestCompletedAnime[]}
          />

          <FeaturedCollection
            loading={isLoading}
            featuredAnime={[
              {
                title: "Most Favorite Anime",
                anime: (data?.mostFavoriteAnimes ?? []) as IAnime[],
              },
              {
                title: "Most Popular Anime",
                anime: (data?.mostPopularAnimes ?? []) as IAnime[],
              },
              {
                title: "Latest Completed Anime",
                anime: (data?.latestCompletedAnimes ?? []) as LatestCompletedAnime[],
              },
            ]}
          />
          <AnimeSections
            title={"Trending Anime"}
            trendingAnime={(data?.trendingAnimes ?? []) as IAnime[]}
            loading={isLoading}
          />

          <AnimeSchedule />

          <AnimeSections
            title={"Upcoming Animes"}
            trendingAnime={(data?.topUpcomingAnimes ?? []) as IAnime[]}
            loading={isLoading}
          />

          <AnimeSections
            title={"Top Airing"}
            trendingAnime={(data?.topAiringAnimes ?? []) as IAnime[]}
            loading={isLoading}
          />

          <AnimeSections
            title={"Movies"}
            trendingAnime={(data?.movies ?? []) as IAnime[]}
            loading={isLoading}
          />

          <AnimeSections
            title={"Recently Added"}
            trendingAnime={(data?.recentlyAdded ?? []) as IAnime[]}
            loading={isLoading}
          />
        </>
      )}
      {!isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white gap-4">
          <p className="text-gray-400">No anime data available right now. Please try again later.</p>
        </div>
      )}
    </>
  );
}
