"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Loading from "@/app/loading";
import { useGetMangaChapters, useSearchManga } from "@/query/get-manga-data";

const MangaDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: searchData } = useSearchManga(slug as string);
  const mangaInfo = searchData?.find((m) => m.slug === slug);
  const { data: chaptersData, isLoading } = useGetMangaChapters(slug as string);
  const chapters = chaptersData?.chapters || [];
  const mangaName = mangaInfo?.title || chaptersData?.mangaName || (slug as string).replace(/-/g, " ");

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <Link href="/manga" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Manga
      </Link>

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {mangaInfo?.poster && (
          <div className="w-full md:w-64 shrink-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 relative">
              <img
                src={mangaInfo.poster}
                alt={mangaName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold capitalize mb-2">{mangaName}</h1>
          {mangaInfo?.type && (
            <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase mb-4">
              {mangaInfo.type}
            </span>
          )}
          <p className="text-gray-400 mt-2">{chapters.length} chapters found</p>
          {mangaInfo?.latest_chapter && (
            <p className="text-gray-500 text-sm">Latest: {mangaInfo.latest_chapter}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {chapters.length === 0 && (
          <p className="text-gray-500 text-center py-10">
            No chapters found. Make sure the manga name is correct.
          </p>
        )}
        {[...chapters].reverse().map((ch, idx) => (
          <a
            key={ch.id || idx}
            href={`/manga/read?url=${encodeURIComponent(ch.url)}&title=${encodeURIComponent(ch.title || `Chapter ${ch.number}`)}&manga=${encodeURIComponent(slug as string)}`}
            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-lg p-3 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="text-sm md:text-base">
              {ch.title || `Chapter ${ch.number}`}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default MangaDetailPage;
