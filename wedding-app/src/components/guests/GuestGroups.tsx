"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { createGroup, renameGroup, deleteGroup } from "@/app/(app)/guests/actions";

export interface GuestGroupView {
  id: string;
  name: string;
  count: number;
}

export function GuestGroups({
  groups,
  activeGroupId,
  onSelect,
  readOnly,
}: {
  groups: GuestGroupView[];
  activeGroupId: string | null;
  onSelect: (id: string | null) => void;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createGroup({ name });
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      toast("success", "Group created");
      setNewName("");
      setCreating(false);
    });
  }

  function handleRename(id: string) {
    const name = editName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await renameGroup({ id, name });
      if (result?.error) return toast("error", result.error);
      setEditingId(null);
      toast("success", "Group renamed");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this group? Guests will be unassigned.")) return;
    startTransition(async () => {
      const result = await deleteGroup({ id });
      if (result?.error) return toast("error", result.error);
      if (activeGroupId === id) onSelect(null);
      toast("success", "Group deleted");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "inline-flex items-center h-9 px-3 rounded-full text-sm font-medium border transition-colors",
          activeGroupId === null
            ? "bg-bordeaux-500 border-bordeaux-500 text-white"
            : "bg-white border-ink-300 text-ink-500 hover:bg-ink-50"
        )}
      >
        All Guests
      </button>

      {groups.map((g) =>
        editingId === g.id ? (
          <div
            key={g.id}
            className="inline-flex items-center gap-1 h-9 border border-bordeaux-300 rounded-full pl-3 pr-1 bg-white"
          >
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="w-28 text-sm outline-none"
            />
            <button
              onClick={() => handleRename(g.id)}
              aria-label="Save group name"
              className="min-w-[28px] min-h-[28px] flex items-center justify-center text-success-600"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              aria-label="Cancel"
              className="min-w-[28px] min-h-[28px] flex items-center justify-center text-ink-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            key={g.id}
            className="inline-flex items-center gap-0.5 h-9 border border-ink-300 rounded-full pl-3 pr-1 bg-white text-ink-500 hover:bg-ink-50"
          >
            <button
              onClick={() => onSelect(g.id)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                activeGroupId === g.id ? "text-bordeaux-600" : "text-ink-600"
              )}
            >
              {g.name}
              <span className="text-xs text-ink-400">({g.count})</span>
            </button>
            {!readOnly && (
              <>
                <button
                  onClick={() => {
                    setEditingId(g.id);
                    setEditName(g.name);
                  }}
                  aria-label={`Rename ${g.name}`}
                  className="min-w-[28px] min-h-[28px] flex items-center justify-center text-ink-400 hover:text-ink-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  aria-label={`Delete ${g.name}`}
                  className="min-w-[28px] min-h-[28px] flex items-center justify-center text-ink-400 hover:text-error-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )
      )}

      {!readOnly && creating ? (
        <div className="inline-flex items-center gap-1 h-9 border border-bordeaux-300 rounded-full pl-3 pr-1 bg-white">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            placeholder="Group name"
            className="w-28 text-sm outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            aria-label="Create group"
            className="min-w-[28px] min-h-[28px] flex items-center justify-center text-success-600 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreating(false)}
            aria-label="Cancel"
            className="min-w-[28px] min-h-[28px] flex items-center justify-center text-ink-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        !readOnly && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center h-9 px-3 rounded-full text-sm font-medium border border-dashed border-ink-300 text-ink-500 hover:border-bordeaux-400 hover:text-bordeaux-600"
          >
            <Plus className="w-4 h-4 mr-1" /> New Group
          </button>
        )
      )}
    </div>
  );
}
