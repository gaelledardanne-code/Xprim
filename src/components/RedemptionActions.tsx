"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui";

export function RedemptionActions({ redemptionId, status }: { redemptionId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject" | "fulfill") {
    setLoading(true);
    await fetch(`/api/admin/redemptions/${redemptionId}/${action}`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <button disabled={loading} onClick={() => act("approve")} className={`${buttonStyles.ghost} px-2.5 py-1.5 text-xs`}>
          Approve
        </button>
        <button disabled={loading} onClick={() => act("reject")} className={`${buttonStyles.ghost} px-2.5 py-1.5 text-xs text-danger`}>
          Reject
        </button>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <button disabled={loading} onClick={() => act("fulfill")} className={`${buttonStyles.ghost} px-2.5 py-1.5 text-xs`}>
        Mark fulfilled
      </button>
    );
  }

  return null;
}
