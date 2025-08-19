import { useEffect } from "react";
import { JupiterChat } from "@/components/JupiterChat";

const Index = () => {
  // Force dark mode on mount
  useEffect(() => {
    document.body.classList.add("dark");
    return () => document.body.classList.remove("dark");
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0a1a] via-[#1a1333] to-[#0a0a1a] relative overflow-hidden">
      {/* Subtle star/nebula effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%">
          <filter id="blur1" x="0" y="0">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <circle cx="20%" cy="30%" r="120" fill="#6d28d9" fillOpacity="0.18" filter="url(#blur1)" />
          <circle cx="80%" cy="70%" r="180" fill="#2563eb" fillOpacity="0.13" filter="url(#blur1)" />
          <circle cx="60%" cy="20%" r="90" fill="#a21caf" fillOpacity="0.10" filter="url(#blur1)" />
        </svg>
        {/* Stars */}
        <div className="absolute inset-0 z-0">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-70"
              style={{
                width: Math.random() > 0.95 ? 2 : 1,
                height: Math.random() > 0.95 ? 2 : 1,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.2,
              }}
            />
          ))}
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <JupiterChat />
      </div>
    </div>
  );
};

export default Index;