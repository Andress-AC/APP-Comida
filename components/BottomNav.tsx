"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/hoy", label: "Hoy", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/alimentos", label: "Alimentos", icon: "M21 15.999h-6.938a2 2 0 01-1.414-.586L11 13.756M3 15.999h6.938a2 2 0 001.414-.586L13 13.756M12 3v9M9 6l3-3 3 3" },
  { href: "/recetas", label: "Recetas", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/historial", label: "Historial", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/despensa", label: "Despensa", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/estadisticas", label: "Stats", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/objetivos", label: "Objetivos", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
      <div
        className="flex justify-around items-center h-16 px-2 rounded-2xl"
        style={{
          background: 'rgba(6, 15, 30, 0.90)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border-warm)',
          boxShadow: '0 0 0 1px rgba(0,212,170,0.06), 0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 relative px-2 py-1 transition-all duration-200"
            >
              {active && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: 'var(--amber)', boxShadow: '0 0 8px var(--amber-glow)' }}
                />
              )}
              <svg
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: active ? 'var(--amber)' : 'var(--text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={active ? 2 : 1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? 'var(--amber)' : 'var(--text-muted)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
