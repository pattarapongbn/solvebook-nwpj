import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/lib/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Scout",
  description: "Internal product research tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        <QueryProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            {/* pb-24 เผื่อพื้นที่ bottom nav บนมือถือ */}
            <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:px-8 md:py-6 md:pb-6">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
