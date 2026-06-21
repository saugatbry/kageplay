import Container from "./container";
import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useGetAnimeSchedule } from "@/query/get-anime-schedule";
import Button from "./common/custom-button";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function AnimeSchedule() {
  const currentDate = new Date();
  const currentDay = currentDate
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const currentDayIndex = currentDate.getDay();
  const [currentSelectedTab, setCurrentSelectedTab] =
    React.useState<string>(currentDay);

  const defaultTab = DAYS.includes(currentDay) ? currentDay : "monday";

  function getDateForWeekday(targetDay: string) {
    const targetIndex = DAYS.indexOf(targetDay);
    const date = new Date(currentDate);
    const diff = targetIndex - currentDayIndex;
    date.setDate(currentDate.getDate() + diff);
    return date;
  }

  const { isLoading, data } = useGetAnimeSchedule("week");

  const dayItems = useMemo(() => {
    const all = data?.scheduledAnimes ?? [];
    return all.filter((item) => item.airingDay === currentSelectedTab);
  }, [data, currentSelectedTab]);

  function formatTime(anime: any): string {
    if (anime.airingTimestamp && anime.airingTimestamp > 0) {
      return new Date(anime.airingTimestamp * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return anime.time || "TBD";
  }

  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start">
      <h5 className="text-2xl font-bold">Schedule</h5>
      <Tabs
        orientation="vertical"
        defaultValue={defaultTab}
        onValueChange={(val) => setCurrentSelectedTab(val)}
        value={currentSelectedTab}
        className="w-full"
      >
        <TabsList className="flex w-full overflow-x-auto gap-1 scrollbar-hide">
          {DAYS.map((day) => (
            <TabsTrigger key={day} value={day}>
              {day.substring(0, 3).toUpperCase()} -{" "}
              {getDateForWeekday(day).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </TabsTrigger>
          ))}
        </TabsList>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          DAYS.map((day) => (
            <TabsContent key={day} value={day}>
              {day === currentSelectedTab && (
                <div className="flex flex-col gap-5 w-full p-4">
                  {dayItems.length === 0 && (
                    <p className="text-gray-400 text-sm">No anime scheduled for this day</p>
                  )}
                  {dayItems.map((anime, i) => (
                    <div
                      key={`${anime.id}-${i}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-slate-700 last:border-0"
                    >
                      <div className="flex items-center gap-x-3 sm:gap-x-5">
                        <h3 className="text-xs sm:text-sm text-gray-300 font-semibold shrink-0 min-w-[4rem]">
                          {formatTime(anime)}
                        </h3>
                        <h3 className="text-sm font-semibold">{anime.name}</h3>
                      </div>
                      <Link href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}>
                        <Button
                          className="w-[8rem] bg-[#3b82f6] text-white hover:bg-[#3b82f6]"
                          size="sm"
                        >
                          {anime.type || "TV"}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))
        )}
      </Tabs>
    </Container>
  );
}

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start">
      <div className="h-14 w-full animate-pulse bg-slate-700"></div>
      <div className="h-14 w-full animate-pulse bg-slate-700"></div>
      <div className="h-14 w-full animate-pulse bg-slate-700"></div>
      <div className="h-14 w-full animate-pulse bg-slate-700"></div>
    </Container>
  );
};

export default AnimeSchedule;
