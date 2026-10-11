import { Checkbox } from "@/components/ui/checkbox";
import { MODULES } from "@/lib/data";

export function ModulePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {MODULES.map((m) => {
        const on = value.includes(m.key);
        return (
          <label
            key={m.key}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${on ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/60"}`}
          >
            <Checkbox
              checked={on}
              onCheckedChange={(c) =>
                onChange(c ? [...value, m.key] : value.filter((x) => x !== m.key))
              }
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
