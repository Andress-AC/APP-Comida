"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/hoy", label: "Hoy", icon: "📊" },
  { href: "/despensa", label: "Despensa", icon: "🏠" },
  { href: "/alimentos", label: "Alimentos", icon: "🍎" },
  { href: "/recetas", label: "Recetas", icon: "📖" },
  { href: "/historial", label: "Historial", icon: "📅" },
  { href: "/objetivos", label: "Objetivos", icon: "🎯" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                active ? "text-blue-600 font-semibold" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
