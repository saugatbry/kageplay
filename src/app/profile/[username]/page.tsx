"use client";
import React, { useEffect, useState, useCallback } from "react";
import Container from "@/components/container";
import Avatar from "@/components/common/avatar";
import { useAuthHydrated, useAuthStore } from "@/store/auth-store";
import { usePremiumStore } from "@/store/premium-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import CoverImage from "@/assets/cover.png";
import Loading from "@/app/loading";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { fetchAnimeGifs } from "@/lib/tenor";
import { Crown, RefreshCw, Sparkles } from "lucide-react";

function ProfilePage() {
  const { auth, setAuth } = useAuthStore();
  const { isPremium, checkPremium } = usePremiumStore();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasHydrated = useAuthHydrated();

  const [localWatched, setLocalWatched] = useState<any[]>([]);
  const [localEpCount, setLocalEpCount] = useState(0);
  const [tenorGifs, setTenorGifs] = useState<string[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  useEffect(() => {
    if (hasHydrated && !auth) {
      router.replace("/");
    }
  }, [auth, hasHydrated, router]);

  useEffect(() => {
    if (auth?.username) {
      checkPremium(auth.username);
    }
  }, [auth?.username, checkPremium]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("watched");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalWatched(parsed);
          setLocalEpCount(parsed.reduce((sum: number, wa: any) => sum + (wa.episodes?.length || 0), 0));
        }
      }
    } catch {}
  }, []);

  const loadTenorGifs = useCallback(async () => {
    setLoadingGifs(true);
    try {
      const urls = await fetchAnimeGifs(30);
      setTenorGifs(urls);
    } catch {}
    setLoadingGifs(false);
  }, []);

  useEffect(() => {
    if (isPremium) {
      loadTenorGifs();
    }
  }, [isPremium, loadTenorGifs]);

  if (!hasHydrated) {
    return <Loading />;
  }

  if (!auth) {
    return null;
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAuth({ ...auth, avatar: dataUrl });
        toast.success("Avatar updated!", {
          style: { background: "green" },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setAuth({ ...auth, avatar: gifUrl });
    toast.success("Anime PFP set!", {
      style: { background: "green" },
    });
  };

  return (
    <>
      <div className="w-full h-48 md:h-64 lg:h-72 relative">
        <Image
          src={CoverImage.src}
          alt={"cover"}
          fill
          className="object-cover"
          priority
          placeholder="blur"
          blurDataURL={CoverImage.blurDataURL}
        />
      </div>
      <Container className="min-h-[70vh] mt-10 flex flex-col md:flex-row justify-around gap-8 md:gap-4">
        <div className="flex flex-col items-center gap-5 w-full md:w-1/3">
          <Avatar
            className="w-[150px] h-[150px] cursor-pointer"
            username={auth.username}
            url={auth.avatar}
            collectionID={auth.collectionId}
            id={auth.id}
            premium={isPremium}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <h2 className="text-xl flex items-center gap-2">
            @{auth.username}
            {isPremium && <Crown className="h-5 w-5 text-amber-400" />}
          </h2>
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-blue-400">{localWatched.length} anime watched</p>
            <p className="text-sm text-gray-400">{localEpCount} total episodes</p>
          </div>

          {isPremium && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Anime PFP
                </h3>
                <button
                  onClick={loadTenorGifs}
                  disabled={loadingGifs}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingGifs ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {tenorGifs.map((gif, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectGif(gif)}
                    className={`rounded-lg overflow-hidden border-2 transition-all hover:border-amber-400 hover:scale-105 active:scale-95 ${
                      auth.avatar === gif ? "border-amber-400 ring-2 ring-amber-400/50" : "border-transparent"
                    }`}
                  >
                    <img src={gif} alt="" className="w-full aspect-square object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-full md:w-2/3">
          <Tabs defaultValue="watching" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="watching">Watching</TabsTrigger>
              <TabsTrigger value="plan-to-watch" disabled>Plan To Watch</TabsTrigger>
              <TabsTrigger value="on-hold" disabled>On Hold</TabsTrigger>
              <TabsTrigger value="completed" disabled>Completed</TabsTrigger>
              <TabsTrigger value="dropped" disabled>Dropped</TabsTrigger>
            </TabsList>
            <TabsContent value="watching" className="mt-4">
              {localWatched.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
                  {localWatched.map((wa) => (
                    <AnimeCard
                      key={wa.anime.id}
                      displayDetails={true}
                      poster={wa.anime.poster}
                      title={wa.anime.title}
                      subTitle={`${wa.episodes.length} episodes`}
                      href={`${ROUTES.WATCH}?anime=${wa.anime.id}&episode=${wa.episodes[wa.episodes.length - 1]}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No anime watched yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </>
  );
}

export default ProfilePage;
