import React, { useEffect } from 'react';
import { useSpotlight } from '@/state/spotlight';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { VisionPanel } from './VisionPanel';
import { X } from 'lucide-react';

const PanelContent: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'vision':
      return <VisionPanel />;
    // Add cases for 'file', 'code', 'note' here later
    default:
      return <div className="p-4 text-white">Panel type "{type}" not implemented.</div>;
  }
};

export const SpotlightDock: React.FC = () => {
  const { isOpen, panels, close, toggle, focus } = useSpotlight();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        toggle();
      }

      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        const panelIndex = parseInt(e.key, 10) - 1;
        if (panels[panelIndex]) {
          e.preventDefault();
          focus(panels[panelIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, focus, panels]);

  if (!isOpen || panels.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 h-full p-4 z-50 pointer-events-none">
      <div className="w-[500px] h-[600px] max-w-[90vw] max-h-[80vh] pointer-events-auto">
        <ResizablePanelGroup direction="vertical" className="bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <ResizablePanel defaultSize={100}>
            <div className="h-full flex flex-col">
              <div className="flex items-center bg-gray-900/80 border-b border-gray-700">
                {panels.map(panel => (
                  <div key={panel.id} className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-700 bg-gray-800">
                    <span className="text-sm font-medium text-white">{panel.title}</span>
                    <button onClick={() => close(panel.id)} className="text-gray-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-hidden">
                {panels.length > 0 && <PanelContent type={panels[panels.length - 1].type} />}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};