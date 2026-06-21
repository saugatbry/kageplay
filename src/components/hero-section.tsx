"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";

import Container from "./container";
import { Button } from "./ui/button";
import Image from "next/image";

import React from "react";
import { ArrowLeft, ArrowRight, Captions, Mic, Play } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

import { ROUTES } from "@/constants/routes";
import { ButtonLink } from "./common/button-link";
import { SpotlightAnime } from "@/types/anime";
import { Badge } from "./ui/badge";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

type IHeroSectionProps = {
  spotlightAnime: SpotlightAnime[];
  isDataLoading: boolean;
};

const HeroSection = (props: IHeroSectionProps) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true }),
  );

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (props.isDataLoading) return <LoadingSkeleton />;
  if (!props.spotlightAnime || props.spotlightAnime.length === 0) return null;

  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] -mt-[72px] overflow-hidden">
      <Carousel className="absolute inset-0" setApi={setApi} opts={{ loop: true }} plugins={[autoplayPlugin.current]}>
        <CarouselContent className="h-full">
          {props.spotlightAnime.map((anime, index) => (
            <CarouselItem key={index} className="h-full pl-0">
              <div className="w-full h-full relative overflow-hidden">
                {anime.banner ? (
                  <Image
                    src={anime.banner}
                    alt={anime.name}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={anime.poster}
                    alt={anime.name}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/60 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/30 to-transparent z-10"></div>

                <div className="absolute inset-0 z-20 flex items-end md:items-center pb-12 md:pb-0">
                  <Container>
                    <div className="max-w-xl space-y-4">
                      <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black leading-tight drop-shadow-lg">
                        {anime.name}
                      </h1>

                      <div className="flex flex-row items-center flex-wrap gap-2">
                        {anime.episodes.sub && (
                          <Badge className="bg-red-500/90 flex flex-row items-center space-x-0.5">
                            <Captions size={"16"} />
                            <span>{anime.episodes.sub}</span>
                          </Badge>
                        )}
                        {anime.episodes.dub && (
                          <Badge className="bg-green-500/90 flex flex-row items-center space-x-0.5">
                            <Mic size={"16"} />
                            <span>{anime.episodes.dub}</span>
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm sm:text-base line-clamp-3 text-gray-200 max-w-prose">
                        {stripHtml(anime.description || "")}
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <ButtonLink
                          href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                          className="h-10 px-6 text-sm sm:text-base bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg shadow-lg shadow-[#3b82f6]/25"
                        >
                          <Play className="h-4 w-4 mr-1.5 fill-current" />
                          Learn More
                        </ButtonLink>
                        <ButtonLink
                          href={`${ROUTES.WATCH}?anime=${anime.id}&episode=1`}
                          className="h-10 px-5 text-sm sm:text-base bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-lg"
                        >
                          Watch Now
                        </ButtonLink>
                      </div>
                    </div>
                  </Container>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#121212] to-transparent z-30 pointer-events-none"></div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
        {props.spotlightAnime.map((_, idx) => (
          <button
            key={idx}
            onClick={() => api?.scrollTo(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "w-6 h-1.5 bg-[#3b82f6]"
                : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="absolute hidden md:flex items-center gap-3 right-6 bottom-24 z-40">
        <Button
          onClick={() => api?.scrollPrev()}
          className="rounded-full bg-white/10 backdrop-blur-sm border border-white/30 h-9 w-9 hover:bg-white/20"
          aria-label="Previous slide"
        >
          <ArrowLeft className="text-white shrink-0 h-4 w-4" />
        </Button>
        <Button
          onClick={() => api?.scrollNext()}
          className="rounded-full bg-white/10 backdrop-blur-sm border border-white/30 h-9 w-9 hover:bg-white/20"
          aria-label="Next slide"
        >
          <ArrowRight className="text-white shrink-0 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] -mt-[72px] bg-slate-800 animate-pulse">
      <div className="h-full flex items-end md:items-center pb-8 md:pb-0">
        <Container>
          <div className="space-y-3 lg:w-[40vw]">
            <div className="h-8 sm:h-10 md:h-16 bg-slate-700 w-[75%] rounded"></div>
            <div className="flex gap-2">
              <span className="h-6 w-16 bg-slate-700 rounded-full"></span>
              <span className="h-6 w-16 bg-slate-700 rounded-full"></span>
            </div>
            <div className="h-16 sm:h-20 bg-slate-700 w-full rounded"></div>
            <div className="flex items-center gap-4">
              <span className="h-10 w-[8rem] bg-slate-700 rounded-lg"></span>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HeroSection;
