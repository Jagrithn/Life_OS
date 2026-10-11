import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTableMutations } from "@/lib/data";
import { visibleNav } from "@/lib/nav";

export function CommandPalette({
  enabled,
  onSignOut,
  open,
  onOpenChange,
}: {
  enabled: string[];
  onSignOut: () => void | Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const items = visibleNav(enabled);
  const { insert } = useTableMutations("tasks");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function go(to: string) {
    onOpenChange(false);
    navigate({ to });
  }

  function createTask() {
    const title = query.trim();
    if (!title) return;
    insert.mutate({ title }, { onSuccess: () => toast.success("Task added") });
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {query.trim() && (
          <>
            <CommandGroup heading="Create">
              <CommandItem value={`create-task-${query}`} onSelect={createTask}>
                <Plus />
                Add task “{query.trim()}”
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Go to">
          {items.map((n) => (
            <CommandItem key={n.to} value={n.label} onSelect={() => go(n.to)}>
              <n.icon />
              {n.label}
            </CommandItem>
          ))}
          <CommandItem value="Settings" onSelect={() => go("/settings")}>
            <Settings />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="Sign out"
            onSelect={() => {
              onOpenChange(false);
              void onSignOut();
            }}
          >
            <LogOut />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
