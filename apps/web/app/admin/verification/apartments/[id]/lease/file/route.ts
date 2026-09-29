import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../../../../_lib/require-admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: verification, error: verificationError } = await supabase
    .from("apartment_verifications")
    .select("apartment_id")
    .eq("id", id)
    .maybeSingle();

  if (verificationError) {
    console.error("Admin lease verification lookup failed", verificationError);
    return new Response("Unable to load lease agreement.", { status: 500 });
  }
  if (!verification) return new Response("Not found", { status: 404 });

  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("lease_agreement_url")
    .eq("id", verification.apartment_id)
    .maybeSingle();

  if (apartmentError) {
    console.error("Admin lease apartment lookup failed", apartmentError);
    return new Response("Unable to load lease agreement.", { status: 500 });
  }
  const path = apartment?.lease_agreement_url;
  if (!path) return new Response("Not found", { status: 404 });

  const isPdf = /\.pdf$/i.test(path);
  const isDocx = /\.docx$/i.test(path);
  if (!isPdf && !isDocx)
    return new Response("Unsupported file type", { status: 415 });
  const fileName = path.split("/").at(-1) ?? "lease-agreement";
  const isDownload = new URL(request.url).searchParams.get("download") === "1";
  const encodedFileName = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  const { data, error } = await supabase.storage
    .from("lease-agreements")
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    console.error("Admin lease signing failed", error);
    return new Response("Unable to load lease agreement.", { status: 502 });
  }

  try {
    const file = await fetch(data.signedUrl, { cache: "no-store" });
    if (!file.ok || !file.body) {
      console.error("Admin lease fetch failed", file.status);
      return new Response("Unable to load lease agreement.", { status: 502 });
    }

    return new Response(file.body, {
      headers: {
        "Content-Type": isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": isDownload
          ? `attachment; filename="lease-agreement.${isPdf ? "pdf" : "docx"}"; filename*=UTF-8''${encodedFileName}`
          : "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Admin lease fetch failed", error);
    return new Response("Unable to load lease agreement.", { status: 502 });
  }
}
