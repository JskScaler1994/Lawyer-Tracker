import { useEffect, useState } from "react";

function labelFor(timestamp) {
  if (!timestamp) return null;
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds} sec ago`;
  return `${Math.round(seconds / 60)} min ago`;
}

export function useRelativeTimeLabel(timestamp) {
  const [label, setLabel] = useState(() => labelFor(timestamp));

  useEffect(() => {
    setLabel(labelFor(timestamp));
    if (!timestamp) return;
    const id = setInterval(() => setLabel(labelFor(timestamp)), 15000);
    return () => clearInterval(id);
  }, [timestamp]);

  return label;
}
