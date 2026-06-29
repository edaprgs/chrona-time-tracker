export interface SessionTemplate {
  id: string;
  name: string;
  task: string;
  description: string;
  github_pr: string;
}

const KEY = "chrona_templates";

export function loadTemplates(): SessionTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTemplate(t: Omit<SessionTemplate, "id">): SessionTemplate {
  const templates = loadTemplates();
  const entry: SessionTemplate = { ...t, id: crypto.randomUUID() };
  localStorage.setItem(KEY, JSON.stringify([...templates, entry]));
  return entry;
}

export function deleteTemplate(id: string) {
  const templates = loadTemplates().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(templates));
}
