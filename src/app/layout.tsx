import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SidebarWrapper from "@/components/SidebarWrapper";
import MainContent from "@/components/MainContent";
import Toaster from "@/components/Toaster";
import { SessionsProvider } from "@/context/SessionsContext";
import { ToastProvider } from "@/hooks/useToast";
import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

const inter      = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans  = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono  = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chrona",
  description: "Honest time tracking for contract work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}>
      <body className="flex min-h-screen bg-background text-foreground">
        <ToastProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <SessionsProvider>
                <SidebarWrapper />
                <MainContent>{children}</MainContent>
                <Toaster />
              </SessionsProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
