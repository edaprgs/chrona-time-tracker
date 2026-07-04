"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface MobileSidebarContextValue {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
  toggle: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextValue>({
  isOpen: false,
  open:   () => {},
  close:  () => {},
  toggle: () => {},
});

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <MobileSidebarContext.Provider value={{
      isOpen,
      open:   () => setIsOpen(true),
      close:  () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}
