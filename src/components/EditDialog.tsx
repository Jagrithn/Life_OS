import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select" | "datetime";
  options?: { value: string; label: string }[];
  max?: number;
  required?: boolean;
  placeholder?: string;
  nullable?: boolean;
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function EditDialog({
  open, onOpenChange, title, fields, initial, onSave, onDelete, saveLabel = "Save",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  fields: Field[];
  initial?: Record<string, any> | null | undefined;
  onSave: (values: Record<string, any>) => void;
  onDelete?: (() => void) | undefined;
  saveLabel?: string;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!open) return;
    const v: Record<string, string> = {};
    for (const f of fields) {
      const raw = initial?.[f.name];
      if (raw == null) v[f.name] = f.type === "select" ? (f.nullable ? "none" : f.options?.[0]?.value ?? "") : "";
      else v[f.name] = f.type === "datetime" ? toLocalInput(raw) : String(raw);
    }
    setVals(v);
    setConfirm(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, any> = {};
    for (const f of fields) {
      const s = (vals[f.name] ?? "").trim();
      if (f.required && !s) return;
      if (f.type === "number") out[f.name] = s === "" ? null : Number(s);
      else if (f.type === "datetime") out[f.name] = s ? new Date(s).toISOString() : null;
      else if (f.type === "select") out[f.name] = s === "none" ? null : s;
      else out[f.name] = s === "" ? null : s;
    }
    onSave(out);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-heading">{title}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => {
            const id = `f-${f.name}`;
            const set = (v: string) => setVals((p) => ({ ...p, [f.name]: v }));
            return (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={id}>{f.label}{f.required && " *"}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={id} rows={4} maxLength={f.max} placeholder={f.placeholder} value={vals[f.name] ?? ""} onChange={(e) => set(e.target.value)} />
                ) : f.type === "select" ? (
                  <Select value={vals[f.name] ?? ""} onValueChange={set}>
                    <SelectTrigger id={id}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {f.nullable && <SelectItem value="none">None</SelectItem>}
                      {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={id}
                    type={f.type === "datetime" ? "datetime-local" : f.type ?? "text"}
                    maxLength={f.max}
                    step={f.type === "number" ? "any" : undefined}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={vals[f.name] ?? ""}
                    onChange={(e) => set(e.target.value)}
                  />
                )}
              </div>
            );
          })}
          <DialogFooter className="gap-2 sm:justify-between">
            {onDelete ? (
              confirm ? (
                <Button type="button" variant="destructive" onClick={() => { onDelete(); onOpenChange(false); }}>Confirm delete</Button>
              ) : (
                <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirm(true)}>Delete</Button>
              )
            ) : <span />}
            <Button type="submit">{saveLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Small helper hook for "add or edit" dialog state */
export function useEditor<T>() {
  const [state, setState] = useState<{ open: boolean; item: T | null; preset?: Record<string, any> | undefined }>({ open: false, item: null });
  return {
    ...state,
    openNew: (preset?: Record<string, any>) => setState({ open: true, item: null, preset }),
    openEdit: (item: T) => setState({ open: true, item }),
    setOpen: (open: boolean) => setState((s) => ({ ...s, open })),
  };
}
