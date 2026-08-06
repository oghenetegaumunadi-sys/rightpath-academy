"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({
  children,
}: DashboardShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        mobileOpen={mobileNavigationOpen}
        onMobileClose={() =>
          setMobileNavigationOpen(false)
        }
      />

      <div className="min-w-0 flex-1 lg:pl-72">
        <Topbar
          onOpenNavigation={() =>
            setMobileNavigationOpen(true)
          }
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
