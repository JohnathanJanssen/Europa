import React from 'react';
import { useSpotlight } from '@/state/spotlight';
import { VisionPanel } from '@/components/ui/VisionPanel';
import { Button } from '@/components/ui/button';
import { X, Eye, FileText, Code, StickyNote, Settings, Terminal } from 'lucide-react';
import { SettingsPanel } from '@/components/panels/SettingsPanel.tsx';
import { TerminalPanel } from '@/components/panels/TerminalPanel.tsx';
import LiveCamera from '@/components/vision/LiveCamera.tsx';

const PanelContent: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'vision':
      return <LiveCamera />;
    case 'settings':
      return <SettingsPanel />;
    case 'terminal':
      return <TerminalPanel />;
    // Add other panel types here later
    default:
      return (
        <div className="p-4 text-gray-400">
          Panel type "{type}" is not yet implemented.
        </div>
      );
  }
};

const PanelIcon: React.FC<{ type: string; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'vision': return <Eye size={16} className={className} />;
    case 'file': return <FileText size={16} className={className} />;
    case 'code': return <Code size={16} className={className} />;
    case 'note': return <StickyNote size={16} className={className} />;
    case 'settings': return <Settings size={16} className={className} />;
    case 'terminal': return <Terminal size={16} className={className} />;
    default: return null;
  }
};

export const SpotlightCard: React.FC = () => {
  const { panels, close } = useSpotlight();

  if (panels.length === 0) {
    return null;
  }

  return (
    <div className="bg-black/60 backdrop-blur-xl border-t border-[#2d2d4d] rounded-b-2xl overflow-hidden shadow-2xl">
      <div className="flex flex-col h-[45vh] min-h-[300px] max-h-[500px] overflow-y-auto">
        {panels.map(panel => (
          <div key={panel.id} className="bg-black/40 flex flex-col h-full">
            <div className="flex items-center justify-between p-1.5 pr-2 bg-black/20 border-b border-gray-800/50 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <PanelIcon type={panel.type} />
                {panel.title}
              </div>
              <Button variant="ghost" size="icon" onClick={() => close(panel.id)} className="text-gray-400 hover:text-white h-7 w-7 shrink-0">
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PanelContent type={panel.type} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};