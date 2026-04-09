"use client";

import { useEffect, useState } from "react";

export default function AiRecommendation({ logCount }: { logCount: number }) {
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logCount === 0) {
      setRecommendation("");
      return;
    }

    setLoading(true);
    fetch("/api/ai/recommend", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.recommendation) setRecommendation(data.recommendation);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [logCount]);

  if (!recommendation && !loading) return null;

  return (
    <div className="glass-warm p-4 animate-in animate-in-delay-1">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--amber)' }}>
        Recomendación IA
      </h3>
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analizando tu día...</p>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{recommendation}</p>
      )}
    </div>
  );
}
