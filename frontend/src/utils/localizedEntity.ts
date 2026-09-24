/**
 * Multi-locale catalog content.
 *
 * Products and categories can carry per-language overrides stored as JSON
 * ({"hi":{"name":"...","description":"..."}, ...}) in their `translations`
 * column. The base columns stay the English source of truth; anything
 * missing falls back to base, so partial translations are always safe.
 */

export interface LocalizedContent {
  name?: string;
  description?: string;
}

type WithTranslations = {
  name?: string;
  description?: string | null;
  translations?: string | null;
};

const cache = new WeakMap<object, Record<string, LocalizedContent>>();

function parse(translations: string | null | undefined): Record<string, LocalizedContent> {
  if (!translations) return {};
  try {
    const parsed = JSON.parse(translations);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function overridesOf(entity: WithTranslations): Record<string, LocalizedContent> {
  if (!entity.translations) return {};
  if (cache.has(entity)) return cache.get(entity)!;
  const parsed = parse(entity.translations);
  cache.set(entity, parsed);
  return parsed;
}

export function localizedName(entity: WithTranslations, language: string): string {
  const override = overridesOf(entity)[language]?.name?.trim();
  return override || entity.name || "";
}

export function localizedDescription(entity: WithTranslations, language: string): string {
  const override = overridesOf(entity)[language]?.description?.trim();
  return override || entity.description || "";
}
