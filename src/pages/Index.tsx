import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  // Force dark mode on mount
  useEffect(() => {
    document.body.classList.add("dark");
    return () => document.body.classList.remove("dark");
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="text-center bg-black/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-4xl font-bold mb-4 text-white tracking-tight">Welcome to J2-MESA (Jupiter)</h1>
        <p className="text-xl text-gray-300 mb-6">
          Jupiter is your emotionally aware, reasoning AI assistant.
        </p>
        <Button
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full px-6 py-3 text-lg shadow"
          onClick={() => navigate("/chat")}
        >
          Start Chatting with Jupiter
        </Button>
      </div>
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;