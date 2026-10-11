import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { CrudList } from "@/components/CrudList";
import { fmtDate, todayISO, useRows, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Daylight" },
      { name: "description", content: "Terms, courses, assignments and exams." },
    ],
  }),
  component: Academics,
});

function Academics() {
  const { data: terms = [] } = useRows("terms");
  const { data: courses = [] } = useRows("courses");
  const today = todayISO();
  return (
    <>
      <PageHeader
        title="Academics"
        subtitle="Assignments and exams also appear on your calendar."
      />
      <CrudList
        table="assessments"
        title="Assignments & exams"
        noun="assignment or exam"
        emptyTitle="Nothing due"
        emptyText="Add assignments and exams with due dates — they'll show on Home and the calendar."
        defaults={{ kind: "assignment" }}
        fields={[
          { name: "title", label: "Title", required: true, max: 120 },
          {
            name: "kind",
            label: "Type",
            type: "select",
            options: [
              { value: "assignment", label: "Assignment" },
              { value: "exam", label: "Exam" },
              { value: "quiz", label: "Quiz" },
            ],
          },
          {
            name: "course_id",
            label: "Course",
            type: "select",
            nullable: true,
            options: courses.map((c) => ({ value: c.id, label: c.name })),
          },
          { name: "due_date", label: "Due date", type: "date" },
          { name: "done", label: "Done", type: "boolean" },
        ]}
        render={(a: Row<"assessments">) => (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={a.done ? "text-muted-foreground line-through" : "font-medium"}>
                {a.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.kind}
                {a.course_id && ` · ${courses.find((c) => c.id === a.course_id)?.name ?? ""}`}
              </p>
            </div>
            {a.due_date && (
              <span
                className={`text-xs ${!a.done && a.due_date < today ? "font-medium text-destructive" : "text-muted-foreground"}`}
              >
                {fmtDate(a.due_date)}
              </span>
            )}
          </div>
        )}
      />
      <div className="grid gap-x-6 lg:grid-cols-2">
        <CrudList
          table="courses"
          title="Courses & subjects"
          noun="course"
          emptyTitle="No courses"
          emptyText="Add the courses or subjects you're taking."
          fields={[
            { name: "name", label: "Course", required: true, max: 80 },
            {
              name: "term_id",
              label: "Term",
              type: "select",
              nullable: true,
              options: terms.map((t) => ({ value: t.id, label: t.name })),
            },
          ]}
          render={(c: Row<"courses">) => (
            <p className="font-medium">
              {c.name}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {terms.find((t) => t.id === c.term_id)?.name}
              </span>
            </p>
          )}
        />
        <CrudList
          table="terms"
          title="Terms"
          noun="term"
          emptyTitle="No terms"
          emptyText="A term groups courses by semester or year."
          fields={[
            { name: "name", label: "Term", required: true, max: 80 },
            { name: "starts_on", label: "Starts", type: "date" },
            { name: "ends_on", label: "Ends", type: "date" },
          ]}
          render={(t: Row<"terms">) => (
            <p className="font-medium">
              {t.name}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {t.starts_on && fmtDate(t.starts_on)}
                {t.ends_on && ` – ${fmtDate(t.ends_on)}`}
              </span>
            </p>
          )}
        />
      </div>
    </>
  );
}
