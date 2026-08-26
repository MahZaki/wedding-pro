"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Plus,
  Search,
  Users,
  Upload,
  Pencil,
  Trash2,
  Copy,
  CheckCheck,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  saveGuest,
  deleteGuest,
  importGuests,
} from "@/app/(app)/guests/actions";

export interface GuestView {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  side: string | null;
  token: string | null;
  rsvpStatus: string;
}

export function GuestsView({
  guests,
  readOnly = false,
  appUrl,
}: {
  guests: GuestView[];
  readOnly?: boolean;
  appUrl?: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GuestView | null>(null);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (statusFilter !== "all" && g.rsvpStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [guests, query, statusFilter]);

  const stats = useMemo(() => {
    let attending = 0;
    let declined = 0;
    for (const g of guests) {
      if (g.rsvpStatus === "attending") attending++;
      else if (g.rsvpStatus === "declined") declined++;
    }
    return {
      attending,
      declined,
      pending: guests.length - attending - declined,
      total: guests.length,
    };
  }, [guests]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-slate-700">
          Guests
        </h1>
        {!readOnly && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Invited" value={stats.total} tone="neutral" />
        <StatCard
          icon={CheckCheck}
          label="Attending"
          value={stats.attending}
          tone="success"
        />
        <StatCard
          icon={XCircle}
          label="Declined"
          value={stats.declined}
          tone="danger"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          tone="pending"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guests…"
            className="w-full min-h-[44px] pl-10 pr-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          aria-label="Filter by RSVP status"
        >
          <option value="all">All statuses</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          {guests.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No guests yet"
              description="Add guests manually or import your list from a CSV file."
              action={
                !readOnly ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowImport(true)}>
                      Import CSV
                    </Button>
                    <Button onClick={() => setCreating(true)}>Add Guests</Button>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matches"
              description="Try a different search or filter."
            />
          )}
        </div>
      ) : (
        <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filtered.map((g) => (
            <li key={g.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {g.first_name} {g.last_name}
                  {g.side && g.side !== "both" && (
                    <span className="ml-2 text-xs text-slate-400 capitalize">
                      ({g.side}&apos;s side)
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 truncate">{g.email}</p>
              </div>
              <Badge
                variant={
                  ({
                    attending: "success",
                    declined: "danger",
                    pending: "pending",
                  } as Record<string, BadgeVariant>)[g.rsvpStatus] ?? "neutral"
                }
              >
                {g.rsvpStatus}
              </Badge>
              {!readOnly && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (!g.token) return;
                      const origin =
                        typeof window !== "undefined"
                          ? window.location.origin
                          : appUrl;
                      void navigator.clipboard
                        .writeText(`${origin}/rsvp/${g.token}`)
                        .then(() => toast("success", "RSVP link copied"))
                        .catch(() => toast("error", "Could not copy link"));
                    }}
                    disabled={!g.token}
                    aria-label={`Copy RSVP link for ${g.first_name}`}
                    title="Copy RSVP link"
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditing(g)}
                    aria-label={`Edit ${g.first_name}`}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        !confirm(`Delete ${g.first_name} ${g.last_name}?`)
                      )
                        return;
                      void (async () => {
                        const result = await deleteGuest({ id: g.id });
                        if (result?.error) toast("error", result.error);
                      })();
                    }}
                    aria-label={`Delete ${g.first_name}`}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <GuestFormModal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        guest={editing}
      />
      <CsvImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger" | "pending";
}) {
  const tones = {
    neutral: "text-slate-700",
    success: "text-green-600",
    danger: "text-red-500",
    pending: "text-yellow-600",
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
      <Icon className={cn("w-4 h-4 mb-1.5", tones[tone])} />
      <p className={cn("font-heading text-xl font-bold", tones[tone])}>
        {value}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function GuestFormModal({
  open,
  onClose,
  guest,
}: {
  open: boolean;
  onClose: () => void;
  guest: GuestView | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState("both");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [lastKey, setLastKey] = useState("");
  const key = `${open}-${guest?.id ?? "new"}`;
  if (key !== lastKey) {
    setLastKey(key);
    setFirstName(guest?.first_name ?? "");
    setLastName(guest?.last_name ?? "");
    setEmail(guest?.email ?? "");
    setPhone(guest?.phone ?? "");
    setSide(guest?.side ?? "both");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast("warning", "First and last name are required");
      return;
    }
    setLoading(true);
    const result = await saveGuest({
      id: guest?.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      side: side as "bride" | "groom" | "both",
    });
    setLoading(false);
    if (result?.error) {
      toast("error", result.error);
      return;
    }
    toast("success", guest ? "Guest updated" : "Guest added");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={guest ? "Edit guest" : "Add guest"}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Select
          label="Side"
          options={[
            { value: "bride", label: "Bride's side" },
            { value: "groom", label: "Groom's side" },
            { value: "both", label: "Both" },
          ]}
          value={side}
          onChange={(e) => setSide(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          {guest ? "Save changes" : "Add guest"}
        </Button>
      </form>
    </Modal>
  );
}

interface CsvRow {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  group: string | null;
}

function CsvImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    duplicates: number;
  } | null>(null);
  const { toast } = useToast();

  function parseFile(file: File) {
    setResult(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const valid: CsvRow[] = [];
        let invalid = 0;
        for (const raw of parsed.data) {
          const first = raw.first_name?.trim();
          const last = raw.last_name?.trim();
          if (!first || !last) {
            invalid++;
            continue;
          }
          const email = raw.email?.trim() || null;
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            invalid++;
            continue;
          }
          valid.push({
            first_name: first,
            last_name: last,
            email,
            phone: raw.phone?.trim() || null,
            group: raw.group?.trim() || null,
          });
        }
        setRows(valid);
        setInvalidCount(invalid);
      },
      error: () => {
        toast("error", "Could not read that CSV file.");
      },
    });
  }

  async function runImport() {
    setLoading(true);
    const res = await importGuests({ rows });
    setLoading(false);
    if (res.error) {
      toast("error", res.error);
      return;
    }
    setResult({ imported: res.imported ?? 0, duplicates: res.duplicates ?? 0 });
    toast(
      "success",
      `Imported ${res.imported} guests (${res.duplicates} duplicates skipped)`
    );
    setTimeout(onClose, 1200);
  }

  return (
    <Modal open={open} onClose={onClose} title="Import guests from CSV">
      <p className="text-sm text-slate-500 mb-4">
        Required columns:{" "}
        <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
          first_name, last_name, email, phone, group
        </code>
      </p>

      <label className="block border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-rose-400 transition-colors min-h-[44px]">
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) parseFile(f);
          }}
        />
        <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
        <span className="text-sm text-slate-500">
          {fileName ? fileName : "Choose a .csv file"}
        </span>
      </label>

      {rows.length > 0 && !result && (
        <div className="mt-4">
          <p className="text-sm mb-2">
            <span className="font-semibold text-green-600">{rows.length}</span>{" "}
            valid rows
            {invalidCount > 0 && (
              <span className="text-red-500"> · {invalidCount} invalid</span>
            )}
          </p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {rows.slice(0, 50).map((r, i) => (
              <p key={i} className="text-xs text-slate-600 px-3 py-2">
                {r.first_name} {r.last_name}
                {r.email && (
                  <span className="text-slate-400"> · {r.email}</span>
                )}
              </p>
            ))}
          </div>
          <Button onClick={runImport} loading={loading} className="w-full mt-4">
            Import {rows.length} guests
          </Button>
        </div>
      )}

      {result && (
        <div className="mt-4 text-center text-sm space-y-1">
          <p className="font-semibold text-green-600">
            Imported {result.imported} guests
          </p>
          <p className="text-slate-400">{result.duplicates} duplicates skipped</p>
        </div>
      )}
    </Modal>
  );
}
