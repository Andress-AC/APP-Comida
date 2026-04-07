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
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-purple-700 mb-1">
        Recomendación IA
      </h3>
      {loading ? (
        <p className="text-sm text-purple-400">Analizando tu día...</p>
      ) : (
        <p className="text-sm text-purple-900">{recommendation}</p>
      )}
    </div>
  );
}
