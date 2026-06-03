"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { BookOpen } from "lucide-react";
import Loading from "@/app/loading";
import { MangaChapter } from "@/lib/manga";

const MangaDetailPage = () => {
  const { slug } = useParams();
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [mangaName, setMangaName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get("/api/manga/chapters", { params: { name: slug as string } })
      .then((res) => {
        const d = res.data?.data;
        setMangaName(d?.mangaName || (slug as string));
        setChapters(d?.chapters || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold capitalize mb-2">
        {mangaName || (slug as string).replace(/-/g, " ")}
      </h1>
      <p className="text-gray-400 mb-6">{chapters.length} chapters found</p>
      <div className="flex flex-col gap-2">
        {chapters.length === 0 && (
          <p className="text-gray-500">No chapters found. Make sure the manga name is correct.</p>
        )}
        {[...chapters].reverse().map((ch, idx) => (
          <a
            key={ch.id || idx}
            href={`/manga/read?url=${encodeURIComponent(ch.url)}&title=${encodeURIComponent(ch.title || `Chapter ${ch.number}`)}`}
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
