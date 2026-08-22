import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";

function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="animate-fade-up mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink/10 bg-brand-dark text-paper/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm sm:flex-row sm:px-6 lg:px-8">
          <span className="font-mono font-bold tracking-[0.25em]">CARTLY</span>
          <span>
            © {new Date().getFullYear()} Cartly. Built on Spring Boot
            microservices.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default DashboardLayout;
