import React from 'react';
import { useSpotlight } from '@/state/spotlight';
import { VisionPanel } from '@/components/ui/VisionPanel';
import { Button } from '@/components/ui/button';
import { X, Eye, FileText, Code, StickyNote } from 'lucide-react';

const PanelContent: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'vision':
      return <VisionPanel />;
    // Add cases for 'file', 'code', 'note' here later
    default:
      return <div className="p-4 text-white">Panel type "{type}" not implemented.</div>;
  }
};

const PanelIcon: React.FC<{ type: string; className?: string }> = ({ type, className }) => {
    switch (type) {
        case 'vision': return <Eye size={14} className={className} />;
        case 'file': return <FileText size={14} className={className} />;
        case 'code': return <Code size={14} className={className} />;
        case 'note': return <StickyNote size={14} className={className} />;
        default: return null;
    }
}

export const SpotlightView: React.FC = () => {
  const { panels, close, focus } = useSpotlight();

  if (panels.length === 0) {
    return null;
  }

  const activePanel = panels[panels.length - 1];

  return (
    <div className="bg-black/60 backdrop-blur-xl border-t border-[#2d2d4d] rounded-b-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between p-1.5 pr-2 bg-black/20">
        <div className="flex items-center gap-1">
            {panels.map(panel => (
                <Button 
                    key={panel.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => focus(panel.id)}
                    className={`flex items-center gap-2 px-3 py-1 h-auto text-xs rounded-md transition-colors ${activePanel.id === panel.id ? 'bg-indigo-500/40 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                >
                    <PanelIcon type={panel.type} />
                    {panel.title}
                </Button>
            ))}
        </div>
        <Button variant="ghost" size="icon" onClick={() => close(activePanel.id)} className="text-gray-400 hover:text-white h-7 w-7 shrink-0">
            <X size={16} />
        </Button>
      </div>
      <div className="h-[45vh] min-h-[300px] max-h-[500px]">
        <PanelContent type={activePanel.type} />
      </div>
    </div>
  );
};