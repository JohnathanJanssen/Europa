import { JupiterChat } from "@/components/JupiterChat";
import ThoughtsDock from '../components/ThoughtsDock';

const Index = () => {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <JupiterChat />
      <ThoughtsDock />
    </div>
  );
};

export default Index;