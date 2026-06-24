import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || "beach-photos";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase environment variables.");
  return createClient(supabaseUrl, supabaseServiceKey);
}

function normalizeBeachName(name: string) {
  return name.trim().toLowerCase();
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const beach = searchParams.get("beach");

    let query = supabase
      .from("beach_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (beach) query = query.ilike("beach_name", `%${beach}%`);

    const { data, error } = await query;
    if (error) throw error;

    const reports = data || [];
    const stats = {
      total: reports.length,
      clear: reports.filter((r) => r.sargassum_level === "Clear").length,
      almostClear: reports.filter((r) => r.sargassum_level === "Almost Clear").length,
      moderate: reports.filter((r) => r.sargassum_level === "Moderate").length,
      high: reports.filter((r) => r.sargassum_level === "High").length
    };

    return Response.json({ reports, stats });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load reports. Check Supabase setup." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const formData = await req.formData();

    const beachName = String(formData.get("beachName") || "").trim();
    const reportDate = String(formData.get("reportDate") || "").trim();
    const level = String(formData.get("level") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const photo = formData.get("photo");

    if (!beachName || !reportDate || !level) {
      return Response.json({ error: "Beach name, date, and sargassum level are required." }, { status: 400 });
    }

    let photoUrl: string | null = null;

    if (photo instanceof File && photo.size > 0) {
      const fileExtension = photo.name.split(".").pop() || "jpg";
      const safeBeach = normalizeBeachName(beachName).replace(/[^a-z0-9]+/g, "-");
      const filePath = `${safeBeach}/${Date.now()}.${fileExtension}`;
      const bytes = await photo.arrayBuffer();

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, bytes, {
        contentType: photo.type || "image/jpeg",
        upsert: false
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    const { data, error } = await supabase.from("beach_reports").insert({
      beach_name: beachName,
      report_date: reportDate,
      sargassum_level: level,
      notes: notes || null,
      photo_url: photoUrl
    }).select().single();

    if (error) throw error;

    return Response.json({ report: data });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not submit report. Check Supabase table, bucket, and environment variables." }, { status: 500 });
  }
}
