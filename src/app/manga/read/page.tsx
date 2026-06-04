"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useGetChapterImages } from "@/query/get-manga-data";

function ReaderContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Reading";
  const mangaSlug = searchParams.get("manga") || "";

  const { data: images, isLoading } = useGetChapterImages(url || "");

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No chapter URL provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-white/5 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mangaSlug && (
            <Link
              href={`/manga/${mangaSlug}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          <span className="text-sm text-gray-400 truncate max-w-[200px]">{title}</span>
        </div>
        {images && images.length > 0 && (
          <span className="text-sm text-gray-500">{images.length} pages</span>
        )}
      </div>
      <div className="flex flex-col items-center p-4">
        {isLoading && (
          <div className="flex items-center gap-2 py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading chapter...
          </div>
        )}
        {!isLoading && (!images || images.length === 0) && (
          <p className="text-gray-400 py-20">No images found for this chapter.</p>
        )}
        {(images || []).map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            alt={`Page ${img.page}`}
            className="w-full max-w-3xl mb-2"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

const MangaReaderPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
};

export default MangaReaderPage;
