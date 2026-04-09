"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function SearchInput({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(term: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      router.replace(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <input
      type="search"
      placeholder="Buscar..."
      defaultValue={searchParams.get("q") ?? ""}
      onChange={(e) => handleSearch(e.target.value)}
      className="input-dark w-full"
      style={{ opacity: isPending ? 0.5 : 1 }}
    />
  );
}
