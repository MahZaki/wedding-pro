"use client";

import { useRef, useState } from "react";
import { FileText, Download, Trash2, Upload, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadVendorDoc,
  deleteVendorDocument,
  getDocumentUrl,
} from "@/app/(app)/vendors/actions";

export interface VendorDocumentView {
  id: string;
  name: string;
  doc_type: string | null;
  uploaded_at: string | null;
}

const DOC_TYPE_OPTIONS = [
  "contract",
  "invoice",
  "insurance",
  "quote",
  "other",
];

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: "Contract",
  invoice: "Invoice",
  insurance: "Insurance",
  quote: "Quote",
  other: "Other",
};

const DOC_TYPE_STYLES: Record<string, string> = {
  contract: "bg-bordeaux-100 text-bordeaux-700",
  invoice: "bg-warning-100 text-warning-700",
  insurance: "bg-success-100 text-success-700",
  quote: "bg-ink-100 text-ink-600",
  other: "bg-ink-200 text-ink-700",
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export function VendorDocuments({
  vendorId,
  documents,
  readOnly = false,
}: {
  vendorId: string;
  documents: VendorDocumentView[];
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    const result = await uploadVendorDoc(
      { vendor_id: vendorId, doc_type: docType },
      file
    );
    setUploading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setFileName("");
    setDocType("other");
  }

  async function download(id: string) {
    const result = await getDocumentUrl({ id });
    if (result?.error) {
      alert(result.error);
      return;
    }
    if (result?.url) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const result = await deleteVendorDocument({ id });
    if (result?.error) alert(result.error);
  }

  return (
    <div className="mt-3 border-t border-stone-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-700 min-h-[36px]"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-ink-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-ink-400" />
        )}
        <FileText className="w-4 h-4" />
        Documents
        <span className="ml-1 text-xs font-normal text-ink-400">
          {documents.length}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2 pl-5">
          {documents.length === 0 && (
            <p className="text-xs text-ink-400">No documents yet.</p>
          )}

          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-2 bg-ink-50 rounded-lg px-3 py-2"
            >
              <div className="min-w-0 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex-shrink-0",
                    DOC_TYPE_STYLES[doc.doc_type ?? "other"]
                  )}
                >
                  {DOC_TYPE_LABELS[doc.doc_type ?? "other"]}
                </span>
                <span className="text-sm text-ink-700 truncate">{doc.name}</span>
                {doc.uploaded_at && (
                  <span className="text-xs text-ink-400 flex-shrink-0">
                    {formatDate(doc.uploaded_at)}
                  </span>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => download(doc.id)}
                  aria-label={`Download ${doc.name}`}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-ink-400 hover:text-bordeaux-600 hover:bg-ink-100"
                >
                  <Download className="w-4 h-4" />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(doc.id, doc.name)}
                    aria-label={`Delete ${doc.name}`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {!readOnly && (
            <div className="flex items-center gap-2 pt-1">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                aria-label="Document type"
                className="min-h-[44px] px-3 border border-ink-300 rounded-lg text-sm bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-bordeaux-500"
              >
                {DOC_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-lg text-sm font-semibold text-bordeaux-600 border border-bordeaux-300 hover:bg-bordeaux-50 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Uploading…" : fileName || "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFile}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
