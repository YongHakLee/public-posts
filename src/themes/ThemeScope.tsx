"use client";

import { createContext, useContext, type CSSProperties, type HTMLAttributes } from "react";
import { themeToCssVars } from "./css-vars";
import { themes, type ThemeName } from "./index";
import type { Theme } from "./types";

export const ThemeContext = createContext<Theme>(themes.paper);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

type ThemeScopeProps = HTMLAttributes<HTMLDivElement> & { name: ThemeName };

/** 하위 트리에 테마 CSS 변수와 Theme 컨텍스트를 제공한다. */
export function ThemeScope({ name, style, children, ...rest }: ThemeScopeProps) {
  const theme = themes[name];
  return (
    <ThemeContext value={theme}>
      <div data-theme={name} style={{ ...(themeToCssVars(theme) as CSSProperties), ...style }} {...rest}>
        {children}
      </div>
    </ThemeContext>
  );
}
