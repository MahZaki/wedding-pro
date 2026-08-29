"use client";

import { Search } from "lucide-react";

export function GuestFilters({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  groupFilter,
  onGroupChange,
  groups,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  groupFilter: string;
  onGroupChange: (g: string) => void;
  groups: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search guests…"
          className="w-full min-h-[44px] pl-10 pr-3 border border-ink-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bordeaux-500"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="min-h-[44px] px-3 border border-ink-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bordeaux-500"
        aria-label="Filter by RSVP status"
      >
        <option value="all">All statuses</option>
        <option value="attending">Attending</option>
        <option value="declined">Declined</option>
        <option value="pending">Pending</option>
      </select>
      <select
        value={groupFilter}
        onChange={(e) => onGroupChange(e.target.value)}
        className="min-h-[44px] px-3 border border-ink-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bordeaux-500"
        aria-label="Filter by group"
      >
        <option value="all">All groups</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  );
}
