import { describe, expect, it } from "vitest";

import { MODULES } from "@/lib/data";
import { navItems, visibleNav } from "@/lib/nav";

describe("visibleNav", () => {
  it("always keeps module-less items like Home", () => {
    const result = visibleNav([]);
    expect(result.map((n) => n.label)).toContain("Home");
  });

  it("returns every section when all modules are enabled", () => {
    const all = MODULES.map((m) => m.key);
    expect(visibleNav(all)).toHaveLength(navItems.length);
  });

  it("hides sections whose module is not enabled", () => {
    const result = visibleNav(["tasks"]);
    const labels = result.map((n) => n.label);
    expect(labels).toContain("Tasks");
    expect(labels).not.toContain("Journal");
    expect(labels).not.toContain("Money");
  });
});
