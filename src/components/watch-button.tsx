"use client";

import React from "react";
import { CirclePlay, Languages } from "lucide-react";
import { ROUTES } from "@/constants/routes";

import { usePathname } from "next/navigation";
import { ButtonLink } from "./common/button-link";

type Props = {
  provider: "subdub" | "hindi";
};

function getFirstEpisodeSlug(slug: string): string {
  const seasonMatch = slug.match(/-season-(\d+)-/);
  const season = seasonMatch ? seasonMatch[1] : "1";
  return `${slug}-${season}x1`;
}

const WatchButton = ({ provider }: Props) => {
  const pathName = usePathname();
  const slug = pathName.split("/")[2];

  if (provider === "hindi") {
    return (
      <ButtonLink
        href={`${ROUTES.WATCH}?anime=${slug}&episode=${getFirstEpisodeSlug(slug)}&type=hindi`}
        className="max-w-fit text-base"
        LeftIcon={Languages}
      >
        Start Watching
      </ButtonLink>
    );
  }

  return (
    <ButtonLink
      href={`${ROUTES.WATCH}?anime=${slug}&episode=1&type=subdub`}
      className="max-w-fit text-base"
      LeftIcon={CirclePlay}
    >
      Start Watching
    </ButtonLink>
  );
};

export default WatchButton;
