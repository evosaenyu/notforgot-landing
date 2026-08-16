import { supabaseAdmin } from "@/lib/supabase";

/** Best-effort write so checkout still succeeds before the migration is applied. */
export async function persistComingToSee(
  orderId: string,
  comingToSee: string | null
): Promise<void> {
  if (!comingToSee) return;
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ coming_to_see: comingToSee })
    .eq("id", orderId);
  if (error) {
    console.warn("[orders] coming_to_see update skipped:", error.message);
  }
}
