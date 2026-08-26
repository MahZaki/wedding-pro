import { createClient } from "@/lib/supabase/server";

export const WEDDING_DOCS_BUCKET = "wedding-documents";
const MAX_CONTRACT_SIZE = 20 * 1024 * 1024; // 20MB

/** Uploads a contract PDF to private storage. Returns the storage path. */
export async function uploadContract(
  weddingId: string,
  vendorId: string,
  file: File
): Promise<{ path?: string; error?: string }> {
  if (file.size > MAX_CONTRACT_SIZE) {
    return { error: "File is larger than 20MB." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Only PDF files are supported." };
  }

  const supabase = await createClient();
  const path = `${weddingId}/${vendorId}/${Date.now()}-contract.pdf`;

  const { error } = await supabase.storage
    .from(WEDDING_DOCS_BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    console.error("uploadContract:", error);
    return { error: "Upload failed. Please try again." };
  }

  return { path };
}

/** Returns a short-lived signed URL for a stored document. */
export async function getSignedUrl(
  path: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(WEDDING_DOCS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  return data?.signedUrl ?? null;
}
