"use client";

import React from "react";
import { ROUTES } from "@/constants/routes";
import AnimeCard from "@/components/anime-card";

import BlurFade from "@/components/ui/blur-fade";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetSearchAnimeResults } from "@/query/get-search-results";
import Pagination from "@/components/common/pagination";
import { useAnimeSearchParams } from "@/hooks/use-anime-search-params";
import { useProviderStore } from "@/store/provider-store";
import Select from "@/components/common/select";
import {
  statuses,
  types,
  ratings,
  seasons,
  languages,
  sort,
  genres,
} from "@/constants/search-filters";
import { SearchAnimeParams } from "@/types/anime";
import Button from "@/components/common/custom-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const SearchResults = () => {
  const params = useAnimeSearchParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const displayPhrase = (params.q || "").replace(/^"+|"+$/g, "").trim();
  const storeProvider = useProviderStore((s) => s.provider);
  const provider = params.provider || storeProvider;

  console.log(`[search-page] URL provider="${params.provider}" store="${storeProvider}" resolved="${provider}"`);

  // Sync store provider to URL when it differs (handles navbar toggle while on search page)
  React.useEffect(() => {
    if (params.provider && params.provider !== storeProvider) {
      const _params = new URLSearchParams(searchParams.toString());
      _params.set("provider", storeProvider);
      router.replace(`/search?${_params.toString()}`);
    }
  }, [storeProvider, params.provider, searchParams, router]);

  const { data: searchResults, isLoading } = useGetSearchAnimeResults({ ...params, provider });

  const [filters, setFilters] = React.useState<SearchAnimeParams>({
    q: params.q,
    page: params.page,
    type: params.type,
    status: params.status,
    rated: params.rated,
    season: params.season,
    language: params.language,
    sort: params.sort,
    genres: params.genres,
  });

  const handleNextPage = () => {
    if (searchResults?.hasNextPage) {
      handlePageChange((params.page || 1) + 1);
    }
  };

  const handlePreviousPage = () => {
    if ((params.page || 1) > 1) {
      handlePageChange((params.page || 1) - 1);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1) return;
    const _params = new URLSearchParams(searchParams.toString());
    _params.set("page", pageNumber.toString());
    router.push(`/search?${_params.toString()}`);
  };

  const onChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const searchParams = new URLSearchParams();

    onChange("q", params.q);

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() !== "") {
        searchParams.set(key, value);
      } else if (typeof value === "number" && !isNaN(value)) {
        searchParams.set(key, value.toString());
      }
    });

    searchParams.delete("page");

    if (provider) searchParams.set("provider", provider);

    router.push(`/search?${searchParams.toString()}`);
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      page: 1,
      type: "",
      status: "",
      rated: "",
      season: "",
      language: "",
      sort: "",
      genres: "",
    });
    router.push(`/search?q=""&provider=${provider}`);
  };

  return (
    <div className="flex flex-col gap-10 mt-28 lg:mt-36 pb-20 min-h-[75vh]">
      <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-5 flex flex-col gap-5">
        <p className="text-lg font-semibold">Filters</p>
        <div className="flex flex-wrap gap-3">
          <Select
            options={types}
            placeholder="Type"
            value={filters.type}
            onChange={(val) => onChange("type", val)}
          />
          <Select
            options={statuses}
            placeholder="Status"
            value={filters.status}
            onChange={(val) => onChange("status", val)}
          />
          <Select
            options={ratings}
            placeholder="Rated"
            value={filters.rated}
            onChange={(val) => onChange("rated", val)}
          />
          <Select
            options={seasons}
            placeholder="Season"
            value={filters.season}
            onChange={(val) => onChange("season", val)}
          />
          <Select
            options={languages}
            placeholder="Language"
            value={filters.language}
            onChange={(val) => onChange("language", val)}
          />
          <Select
            options={sort}
            placeholder="Sort"
            value={filters.sort}
            onChange={(val) => onChange("sort", val)}
          />
        </div>
        <div>
          <p className="text-lg font-semibold mt-4">Genres</p>
          <ToggleGroup
            type="multiple"
            className="flex flex-wrap justify-start gap-2 mt-4"
            value={filters.genres?.split(",") || []}
            onValueChange={(value) => {
              onChange("genres", value.filter(Boolean).join(","));
            }}
          >
            {genres.map((genre) => (
              <ToggleGroupItem
                value={genre.value}
                key={genre.value}
                size="sm"
                className={cn(
                  "border border-slate-700 hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-transparent",
                  "data-[state=on]:border-[#3b82f6] data-[state=on]:text-white data-[state=on]:bg-[#3b82f6]",
                  filters.genres?.split(",").includes(genre.value)
                    ? "bg-[#3b82f6] text-white"
                    : "text-slate-300",
                )}
              >
                {genre.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            className="w-[6.25rem] hover:bg-[#3b82f6] bg-[#3b82f6] text-white"
            onClick={applyFilters}
          >
            Filter
          </Button>
          <Button
            size="sm"
            className="w-[6.25rem]"
            onClick={resetFilters}
            variant="link"
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="text-2xl font-semibold">
        {displayPhrase === "" ? (
          "Filter Results"
        ) : (
          <>
            Search Results for{" "}
            <span className="font-[800]">&quot;{params.q}&quot;</span>
          </>
        )}
      </div>
      {isLoading && (
        <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
          {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, idx) => {
            return (
              <div
                key={idx}
                className="rounded-xl h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem] animate-pulse bg-slate-700"
              ></div>
            );
          })}
        </div>
      )}
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {searchResults?.animes.map((anime, idx) => (
          <BlurFade key={idx} delay={idx * 0.05} inView>
            <div className="relative self-center justify-self-center">
              {anime.provider && (
                <span className={cn([
                  "absolute top-1 right-1 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                  anime.provider === "hindi"
                    ? "text-orange-400 bg-orange-500/80 border border-orange-500"
                    : anime.provider === "both"
                      ? "text-green-400 bg-green-500/80 border border-green-500"
                      : "text-blue-400 bg-blue-500/80 border border-blue-500",
                ])}>
                  {anime.provider === "hindi" ? "Hindi" : anime.provider === "both" ? "S/D+Hindi" : "S/D"}
                </span>
              )}
              <AnimeCard
                title={anime.name}
                subTitle={anime.type}
                poster={anime.poster}
                href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                className="self-center justify-self-center"
                showGenre={false}
                episodeCard
                sub={anime?.episodes?.sub}
                dub={anime?.episodes?.dub}
              />
            </div>
          </BlurFade>
        ))}
      </div>
      {searchResults && searchResults.totalPages && (
        <Pagination
          totalPages={searchResults?.totalPages}
          currentPage={params.page}
          handleNextPage={handleNextPage}
          handlePageChange={handlePageChange}
          handlePreviousPage={handlePreviousPage}
        />
      )}
    </div>
  );
};

export default SearchResults;
