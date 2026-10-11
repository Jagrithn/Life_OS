import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { Empty, Section } from "@/components/PageHeader";
import { useRows, useTableMutations, type TableName } from "@/lib/data";

/** Generic list + add/edit dialog for simple tables. */
export function CrudList<T extends TableName>({
  table,
  title,
  noun,
  fields,
  render,
  emptyTitle,
  emptyText,
  filter,
  defaults,
}: {
  table: T;
  title: string;
  noun: string;
  fields: Field[];
  render: (row: any) => ReactNode;
  emptyTitle: string;
  emptyText: string;
  filter?: (row: any) => boolean;
  defaults?: Record<string, any>;
}) {
  const { data = [] } = useRows(table);
  const m = useTableMutations(table);
  const ed = useEditor<any>();
  const rows = filter ? (data as any[]).filter(filter) : (data as any[]);
  const addBtn = (
    <Button size="sm" variant="outline" onClick={() => ed.openNew()}>
      <Plus className="h-4 w-4" /> Add {noun}
    </Button>
  );
  return (
    <Section title={title} count={rows.length} action={rows.length ? addBtn : undefined}>
      {rows.length === 0 ? (
        <Empty
          title={emptyTitle}
          action={
            <Button size="sm" onClick={() => ed.openNew()}>
              <Plus className="h-4 w-4" /> Add {noun}
            </Button>
          }
        >
          {emptyText}
        </Empty>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                className="w-full px-4 py-3 text-left transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none"
                onClick={() => ed.openEdit(r)}
              >
                {render(r)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? `Edit ${noun}` : `New ${noun}`}
        fields={fields}
        initial={ed.item ?? defaults}
        onSave={(v) =>
          ed.item
            ? m.update.mutate({ id: ed.item.id, values: v as any })
            : m.insert.mutate(v as any)
        }
        onDelete={ed.item ? () => m.remove.mutate(ed.item.id) : undefined}
      />
    </Section>
  );
}
