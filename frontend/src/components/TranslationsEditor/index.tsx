import { Box, MenuItem, Select, TextField, Typography } from "@mui/material";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import React from "react";
import { LANGUAGES } from "../../features/i18n";

export interface LocalizedContent {
  name?: string;
  description?: string;
}

export const translationsToJson = (value: Record<string, LocalizedContent>): string | null => {
  const cleaned = Object.fromEntries(
    Object.entries(value)
      .map(([lang, content]) => [
        lang,
        {
          ...(content.name?.trim() ? { name: content.name.trim() } : {}),
          ...(content.description?.trim() ? { description: content.description.trim() } : {}),
        },
      ])
      .filter(([, content]) => Object.keys(content as object).length > 0)
  );
  return Object.keys(cleaned).length === 0 ? null : JSON.stringify(cleaned);
};

export const translationsFromJson = (raw: string | null | undefined): Record<string, LocalizedContent> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

interface TranslationsEditorProps {
  value: Record<string, LocalizedContent>;
  onChange: (next: Record<string, LocalizedContent>) => void;
  /** Show the description field too (products) vs name only (categories). */
  includeDescription?: boolean;
}

/**
 * Multi-locale catalog content editor: pick one of the storefront languages
 * and override its name/description. Languages without overrides fall back
 * to the base (English) content at render time.
 */
function TranslationsEditor({ value, onChange, includeDescription = true }: TranslationsEditorProps) {
  const [language, setLanguage] = React.useState<string>("hi");
  const current = value[language] ?? {};

  const update = (patch: LocalizedContent) =>
    onChange({ ...value, [language]: { ...current, ...patch } });

  const overridden = LANGUAGES.filter((l) => {
    const content = value[l.code];
    return content && (content.name?.trim() || content.description?.trim());
  });

  return (
    <Box className="rounded-xl border border-line p-4">
      <Box className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Typography className="flex items-center gap-2 text-sm font-bold text-ink">
          <TranslateOutlinedIcon sx={{ fontSize: 18 }} /> Translations
        </Typography>
        <Select
          size="small"
          value={language}
          onChange={(e) => setLanguage(e.target.value as string)}
          className="min-w-[10rem]"
        >
          {LANGUAGES.map((l) => (
            <MenuItem key={l.code} value={l.code}>
              {l.native} {value[l.code]?.name?.trim() ? "✓" : ""}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box className="space-y-3">
        <TextField
          fullWidth
          size="small"
          label={`Name in ${LANGUAGES.find((l) => l.code === language)?.native ?? language}`}
          value={current.name ?? ""}
          onChange={(e) => update({ name: e.target.value })}
          helperText="Leave empty to use the base (English) name."
        />
        {includeDescription && (
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            label={`Description in ${LANGUAGES.find((l) => l.code === language)?.native ?? language}`}
            value={current.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
          />
        )}
      </Box>

      <Typography className="mt-2 text-[0.6875rem] text-ink-muted">
        {overridden.length === 0
          ? "No overrides yet — the storefront shows English everywhere."
          : `Localized: ${overridden.map((l) => l.short).join(", ")}`}
      </Typography>
    </Box>
  );
}

export default TranslationsEditor;
