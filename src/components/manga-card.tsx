import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MangaSearchResult } from "@/types/manga";

type Props = {
  manga: MangaSearchResult;
  className?: string;
};

const MangaCard = ({ manga, className }: Props) => {
  return (
    <Link
      href={`/manga/${manga.slug}`}
      className={cn([
        "rounded-xl overflow-hidden relative cursor-pointer hover:scale-105 duration-300 block",
        "w-full h-[12rem] min-[320px]:h-[16.625rem] sm:h-[18rem] max-w-[12.625rem] md:min-w-[12rem]",
        className,
      ])}
      aria-label={manga.title}
    >
      <Image
        src={manga.poster}
        alt={manga.title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, 12.5rem"
        className="object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-accent to-transparent" />
      <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3 w-full">
        <h5 className="line-clamp-1 text-sm font-medium">{manga.title}</h5>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
            {manga.type || "Manga"}
          </span>
          <span className="text-xs text-gray-400 truncate">{manga.latest_chapter}</span>
        </div>
      </div>
    </Link>
  );
};

export default MangaCard;
