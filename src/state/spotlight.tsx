import { createContext, useContext, useState } from 'react';
import { nanoid } from 'nanoid';

type PanelType = 'vision' | 'file' | 'code' | 'note';

export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  payload?: any;
}

interface SpotlightContextType {
  panels: Panel[];
  open: (type: PanelType, payload?: any, title?: string) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  isOpen: boolean;
  toggle: () => void;
}

const SpotlightContext = createContext<SpotlightContextType | undefined>(undefined);

export const SpotlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const open = (type: PanelType, payload?: any, title?: string) => {
    const id = nanoid(8);
    const newPanel: Panel = {
      id,
      type,
      payload,
      title: title || type.charAt(0).toUpperCase() + type.slice(1),
    };
    setPanels(prev => {
      // Prevent duplicate vision panels
      if (type === 'vision' && prev.some(p => p.type === 'vision')) {
        return prev;
      }
      return [...prev, newPanel];
    });
    setIsOpen(true);
    return id;
  };

  const close = (id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  };

  const focus = (id: string) => {
    setPanels(prev => {
      const panelToFocus = prev.find(p => p.id === id);
      if (!panelToFocus) return prev;
      const otherPanels = prev.filter(p => p.id !== id);
      return [...otherPanels, panelToFocus];
    });
  };

  const toggle = () => setIsOpen(prev => !prev);

  return (
    <SpotlightContext.Provider value={{ panels, open, close, focus, isOpen, toggle }}>
      {children}
    </SpotlightContext.Provider>
  );
};

export function useSpotlight() {
  const context = useContext(SpotlightContext);
  if (!context) {
    throw new Error('useSpotlight must be used within a SpotlightProvider');
  }
  return context;
}