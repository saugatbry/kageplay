import Image from "next/image";
import genkai from "@/assets/genkai.gif";

const Loading = () => {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "clamp(90px, 14vw, 130px)",
          height: "clamp(90px, 14vw, 130px)",
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: "clamp(80px, 12vw, 115px)",
            height: "clamp(80px, 12vw, 115px)",
            background: "radial-gradient(circle, rgba(233, 55, 107, 0.4) 0%, rgba(192, 132, 252, 0.3) 50%, transparent 70%)",
            animation: "loader-glow 3s ease-in-out infinite",
          }}
        />
        <Image
          src={genkai}
          alt="Loading..."
          unoptimized
          priority
          style={{
            width: "clamp(70px, 11vw, 100px)",
            height: "clamp(70px, 11vw, 100px)",
            objectFit: "contain",
            animation: "loader-float 3s ease-in-out infinite",
            position: "relative",
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
};

export default Loading;
