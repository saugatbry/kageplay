"use client";
import React from "react";
import {
  Avatar as AvatarCN,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import PremiumAvatarFrame from "@/components/premium-avatar-frame";
import { env } from "next-runtime-env";

type Props = {
  url?: string;
  username?: string;
  collectionID?: string;
  id?: string;
  className?: string;
  onClick?: () => void;
  premium?: boolean;
};

function Avatar({
  url,
  username,
  id,
  className,
  collectionID,
  onClick,
  premium,
}: Props) {
  const pbUrl = env("NEXT_PUBLIC_POCKETBASE_URL");
  const src =
    pbUrl && collectionID && id && url
      ? `${pbUrl}/api/files/${collectionID}/${id}/${url}`
      : url || undefined;

  const inner = (
    <AvatarCN className={className} onClick={onClick}>
      {src && <AvatarImage src={src} alt={username} />}
      <AvatarFallback>
        {username?.charAt(0).toUpperCase()}
        {username?.charAt(1)?.toLowerCase()}
      </AvatarFallback>
    </AvatarCN>
  );

  if (premium) {
    return <PremiumAvatarFrame className={className}>{inner}</PremiumAvatarFrame>;
  }

  return inner;
}

export default Avatar;
