import React, { useEffect, useState } from "react";
import { fetchDependentsByParent } from "@/lib/api";

export default function ChildBadge({ parentEmail }: { parentEmail: string }) {
  const [countUnder18, setCountUnder18] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchDependentsByParent(parentEmail);
        const deps = (res as any).data?.dependents || (res as any).data?.data?.dependents || [];
        const now = Date.now();
        const under18 = deps.filter((d: any) => {
          if (!d.dateOfBirth) return false;
          const dob = new Date(d.dateOfBirth).getTime();
          const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
          return age < 18;
        });
        if (mounted) setCountUnder18(under18.length);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [parentEmail]);

  if (countUnder18 === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
      Enfant · {countUnder18}
    </span>
  );
}
