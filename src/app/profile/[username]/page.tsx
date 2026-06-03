"use client";
import React, { useEffect, useMemo, useState } from "react";
import Container from "@/components/container";
import Avatar from "@/components/common/avatar";
import { useAuthHydrated, useAuthStore } from "@/store/auth-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import CoverImage from "@/assets/cover.png";
import AnimeLists from "./components/anime-lists";
import AnimeHeatmap from "./components/anime-heatmap";
import Loading from "@/app/loading";
import AnilistImport from "./components/anilist-import";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { pb } from "@/lib/pocketbase";

function ProfilePage() {
  const { auth, setAuth } = useAuthStore();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasHydrated = useAuthHydrated();

  const [localWatched, setLocalWatched] = useState<any[]>([]);
  const [localEpCount, setLocalEpCount] = useState(0);

  useEffect(() => {
    if (hasHydrated && !auth) {
      router.replace("/");
    }
  }, [auth, hasHydrated, router]);

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
        toast.success("Avatar updated successfully (local)", {
          style: { background: "green" },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const noBackend = !pb;

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
          <h2 className="text-xl">@{auth.username}</h2>
          {noBackend && (
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-blue-400">{localWatched.length} anime watched</p>
              <p className="text-sm text-gray-400">{localEpCount} total episodes</p>
            </div>
          )}
        </div>
        <div className="w-full md:w-2/3">
          {noBackend ? (
            <div className="space-y-6">
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
              <div className="text-center p-8 bg-slate-900 rounded-lg">
                <p className="text-gray-400 text-sm">
                  To track watch status (Plan to Watch, Completed, etc.) and see your activity heatmap,{" "}
                  <a href="https://pocketbase.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                    set up PocketBase
                  </a>{" "}
                  and add <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_POCKETBASE_URL</code> to your environment.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="float-right flex gap-2 items-center mb-2">
                <p className="text-sm text-gray-500">Import:</p>
                <AnilistImport />
              </div>
              <Tabs defaultValue="watching" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5">
                  <TabsTrigger value="watching">Watching</TabsTrigger>
                  <TabsTrigger value="plan-to-watch">Plan To Watch</TabsTrigger>
                  <TabsTrigger value="on-hold">On Hold</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="dropped">Dropped</TabsTrigger>
                </TabsList>

                <TabsContent value="watching" className="mt-4">
                  <AnimeLists status="watching" />
                </TabsContent>
                <TabsContent value="plan-to-watch" className="mt-4">
                  <AnimeLists status="plan to watch" />
                </TabsContent>
                <TabsContent value="on-hold" className="mt-4">
                  <AnimeLists status="on hold" />
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                  <AnimeLists status="completed" />
                </TabsContent>
                <TabsContent value="dropped" className="mt-4">
                  <AnimeLists status="dropped" />
                </TabsContent>
              </Tabs>
            </div>
          )}
          {pb && (
            <div className="my-20">
              <AnimeHeatmap />
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

export default ProfilePage;
