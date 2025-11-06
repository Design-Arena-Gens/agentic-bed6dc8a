"use client";

import { ROLE_OPTIONS, type ProfileRole } from "@/lib/categories";
import { useTransition } from "react";

type RoleSwitcherProps = {
  activeRole: ProfileRole;
  onRoleChange: (role: ProfileRole) => void | Promise<void>;
};

export function RoleSwitcher({ activeRole, onRoleChange }: RoleSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/60 p-1 shadow-sm ring-1 ring-zinc-200 backdrop-blur-sm sm:gap-3">
      {ROLE_OPTIONS.map((role) => {
        const selected = role === activeRole;

        return (
          <button
            key={role}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              selected
                ? "bg-blue-600 text-white shadow"
                : "text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
            onClick={() =>
              startTransition(() => {
                onRoleChange(role);
              })
            }
            disabled={isPending && selected}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}
