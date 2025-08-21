import { createContext, useContext, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';

export type PanelType = 'vision' | 'file' | 'code' | 'note' | 'settings' | 'terminal';

export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  payload?: any;
}

interface SpotlightContextType {
  panels: Panel[];
  open: (type: PanelType, payload?: any, title?: string) => string;
  close: (id:string) => void;
  focus: (id: string) => void;
  replace: (type: PanelType, payload?: any, title?: string) => void;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  toggle: () => void;
}

const SpotlightContext = createContext<SpotlightContextType | undefined>(undefined);

export const SpotlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const open = useCallback((type: PanelType, payload?: any, title?: string) => {
    const id = nanoid(8);
    const newPanel: Panel = {
      id,
      type,
      payload,
      title: title || type.charAt(0).toUpperCase() + type.slice(1),
    };
    
    setPanels(prev => {
      // Prevent duplicate panels of the same type
      if (prev.some(p => p.type === type)) {
        const existing = prev.find(p => p.type === type)!;
        const others = prev.filter(p => p.type !== type);
        return [...others, existing]; // Move to front
      }
      return [...prev, newPanel];
    });

    setIsVisible(true);
    return id;
  }, []);

  const close = useCallback((id: string) => {
    setPanels(prev => {
      const newPanels = prev.filter(p => p.id !== id);
      if (newPanels.length === 0) {
        setIsVisible(false);
      }
      return newPanels;
    });
  }, []);
  
  const focus = useCallback((id: string) => {
    setPanels(prev => {
      const panelToFocus = prev.find(p => p.id === id);
      if (!panelToFocus) return prev;
      const otherPanels = prev.filter(p => p.id !== id);
      return [...otherPanels, panelToFocus];
    });
    setIsVisible(true);
  }, []);

  const replace = useCallback((type: PanelType, payload?: any, title?: string) => {
    const id = nanoid(8);
    const newPanel: Panel = {
      id,
      type,
      payload,
      title: title || type.charAt(0).toUpperCase() + type.slice(1),
    };
    setPanels([newPanel]);
    setIsVisible(true);
  }, []);

  const setVisible = useCallback((visible: boolean) => {
    if (panels.length > 0) {
      setIsVisible(visible);
    } else {
      setIsVisible(false);
    }
  }, [panels.length]);

  const toggle = useCallback(() => {
    setVisible(!isVisible);
  }, [isVisible, setVisible]);

  return (
    <SpotlightContext.Provider value={{ panels, open, close, focus, replace, isVisible, setVisible, toggle }}>
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