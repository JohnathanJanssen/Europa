import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to J2-MESA (Jupiter)</h1>
        <p className="text-xl text-gray-600 mb-6">
          Jupiter is your emotionally aware, reasoning AI assistant.
        </p>
        <Button onClick={() => navigate("/chat")}>Start Chatting with Jupiter</Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;