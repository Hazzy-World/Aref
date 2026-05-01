import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, apiError } from "@/lib/api-helpers";

// GET /api/plans/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from("learning_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (dbError || !data) return apiError("Plan not found", 404);

  // Touch last_accessed
  await supabase
    .from("learning_plans")
    .update({ last_accessed: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json(data);
}

// PATCH /api/plans/[id] — update progress (current_phase, completed_topics)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const supabase = await createClient();

  const allowed = ["current_phase", "completed_topics", "last_accessed"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return apiError("No valid fields to update");
  }

  const { data, error: dbError } = await supabase
    .from("learning_plans")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (dbError || !data) return apiError("Plan not found or update failed", 404);

  return NextResponse.json(data);
}

// DELETE /api/plans/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await createClient();

  const { error: dbError } = await supabase
    .from("learning_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (dbError) return apiError(dbError.message, 500);

  return new NextResponse(null, { status: 204 });
}
