import { isThemeName, themeNames, themes, type ThemeName } from "@/themes";
import { THEME_TAGS, type ThemeTag } from "@/themes/types";

export const MAX_SELECTION = 3;

export type GalleryState = { tag: ThemeTag | null; selected: ThemeName[] };

export function isThemeTag(value: string): value is ThemeTag {
  return (THEME_TAGS as readonly string[]).includes(value);
}

export function filterThemes(tag: ThemeTag | null, names: readonly ThemeName[] = themeNames): ThemeName[] {
  return tag === null ? [...names] : names.filter((name) => themes[name].tags.includes(tag));
}

/** 선택/해제를 전환한다. max를 넘으면 가장 먼저 선택한 것부터 뺀다. */
export function toggleSelection(selected: readonly ThemeName[], name: ThemeName, max = MAX_SELECTION): ThemeName[] {
  if (selected.includes(name)) return selected.filter((item) => item !== name);
  const next = [...selected, name];
  return next.length > max ? next.slice(next.length - max) : next;
}

/** ?tag=<태그>&sel=<이름>,<이름> — 모르는 값·중복은 버리고 선택은 앞에서부터 MAX_SELECTION개 */
export function parseGalleryQuery(search: string): GalleryState {
  const params = new URLSearchParams(search);
  const rawTag = params.get("tag");
  const tag = rawTag !== null && isThemeTag(rawTag) ? rawTag : null;
  const selected: ThemeName[] = [];
  for (const raw of (params.get("sel") ?? "").split(",")) {
    const name = raw.trim();
    if (isThemeName(name) && !selected.includes(name)) selected.push(name);
  }
  return { tag, selected: selected.slice(0, MAX_SELECTION) };
}

export function formatGalleryQuery(state: GalleryState): string {
  const params = new URLSearchParams();
  if (state.tag) params.set("tag", state.tag);
  if (state.selected.length > 0) params.set("sel", state.selected.join(","));
  const query = params.toString();
  return query ? `?${query}` : "";
}
