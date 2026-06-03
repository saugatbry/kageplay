"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import MangaCard from "@/components/manga-card";
import { useSearchManga } from "@/query/get-manga-data";
import { MangaSearchResult } from "@/types/manga";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

const MangaHomePage = () => {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [submitted, setSubmitted] = useState(urlQuery);
  const [initialResults, setInitialResults] = useState<MangaSearchResult[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const { data: searchResults, isLoading: searchLoading } = useSearchManga(submitted);

  useEffect(() => {
    if (urlQuery) {
      setSubmitted(urlQuery);
      setQuery(urlQuery);
    }
  }, []);

  useEffect(() => {
    if (!urlQuery) {
      api.get("/api/manga/search", { params: { q: "a" } })
        .then((res) => setInitialResults(res.data.data || []))
        .catch(() => {})
        .finally(() => setInitialLoading(false));
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmitted(query.trim());
    }
  };

  const results = submitted ? (searchResults || []) : initialResults;
  const loading = submitted ? searchLoading : initialLoading;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Manga</h1>
          <p className="text-gray-400">Browse and read manga online</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md mx-auto mb-8">
          <Input
            placeholder="Search manga..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-full h-[16.625rem] sm:h-[18rem] rounded-xl bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No manga found{submitted ? ` for "${submitted}"` : ""}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {submitted ? `Results for "${submitted}"` : "Recently Updated"}
              {results.length > 0 && ` (${results.length})`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {results.map((manga) => (
                <MangaCard key={manga.slug} manga={manga} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MangaHomePage;
