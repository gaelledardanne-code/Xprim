import { NextResponse } from "next/server";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getBalance, listTransactions } from "@/server/services/points";

export async function GET() {
  try {
    const user = await requireUser();
    const [balance, transactions] = await Promise.all([
      getBalance(user.id),
      listTransactions(user.id),
    ]);
    return NextResponse.json({ balance, transactions });
  } catch (error) {
    return toErrorResponse(error);
  }
}
