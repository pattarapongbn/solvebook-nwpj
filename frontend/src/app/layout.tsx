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
            <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
