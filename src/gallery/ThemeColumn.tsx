import type { ReactNode } from "react";
import { StaticSlideFrame } from "@/engine";
import { familyForStack } from "@/fonts/registry";
import { themes, type ThemeName } from "@/themes";
import { CONTRAST_PAIRS, MIN_CONTRAST, contrastRatio } from "@/themes/contrast";
import { ThemeScope } from "@/themes/ThemeScope";
import { COLOR_TOKENS, TYPE_STEPS, type TypeStep } from "@/themes/types";
import { MotionTokenDemo } from "./MotionTokenDemo";
import { SampleSlide } from "./SampleSlide";

const PREVIEW_SCALE = 0.3;
const HEADING_STEPS: readonly TypeStep[] = ["display", "h1", "h2"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** 표시용 대비비: 반올림하면 4.496이 4.50으로 보여 경고와 모순되므로 내림한다 */
function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

export function ThemeColumn({ name }: { name: ThemeName }) {
  const theme = themes[name];
  return (
    <ThemeScope name={name} data-theme-detail={name} className="flex flex-col gap-8 rounded-2xl bg-bg p-5 text-fg">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">
          {theme.label} <code className="text-sm font-normal text-muted">{name}</code>
        </h2>
        <p className="text-sm text-muted">{theme.description}</p>
        <div className="flex flex-wrap gap-1">
          {theme.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <Section title="색상">
        <div className="grid grid-cols-4 gap-2">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="flex flex-col gap-1 text-xs">
              <div className="h-10 rounded-md border border-border" style={{ background: theme.color[token] }} />
              <span className="font-mono">{token}</span>
              <span className="font-mono text-muted">{theme.color[token]}</span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-1 text-xs">
          {CONTRAST_PAIRS.map(([fg, bg]) => {
            const ratio = contrastRatio(theme.color[fg], theme.color[bg]);
            const ok = ratio >= MIN_CONTRAST;
            return (
              <li key={`${fg}-${bg}`} className="flex justify-between font-mono">
                <span>
                  {fg} / {bg}
                </span>
                <span className={ok ? "" : "font-bold underline"}>
                  {formatRatio(ratio)}:1 {ok ? "✓" : `⚠ ${MIN_CONTRAST} 미만`}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="글꼴">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted">본문</dt>
          <dd>{familyForStack(theme.font.sans)}</dd>
          <dt className="text-muted">제목</dt>
          <dd>{familyForStack(theme.font.display)}</dd>
          <dt className="text-muted">코드</dt>
          <dd>{familyForStack(theme.font.mono)}</dd>
        </dl>
      </Section>

      <Section title={`타이포그래피 (미리보기 ${PREVIEW_SCALE * 100}%)`}>
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr>
              <th className="text-left font-normal">단계</th>
              <th className="text-right font-normal">16:9</th>
              <th className="text-right font-normal">4:5</th>
              <th className="pl-3 text-left font-normal">견본</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_STEPS.map((step) => (
              <tr key={step}>
                <td className="font-mono">{step}</td>
                <td className="text-right font-mono">{theme.type.landscape[step]}</td>
                <td className="text-right font-mono">{theme.type.portrait[step]}</td>
                <td
                  className="pl-3 leading-tight"
                  style={{
                    fontSize: theme.type.landscape[step] * PREVIEW_SCALE,
                    fontFamily: HEADING_STEPS.includes(step) ? theme.font.display : theme.font.sans,
                  }}
                >
                  가나다 Aa
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="간격 · 라운드">
        <div className="flex flex-col gap-1">
          {theme.space.gap.map((gap, i) => (
            <div key={`s${i + 1}`} className="flex items-center gap-3 text-xs">
              <span className="w-16 font-mono">
                s{i + 1} {gap}
              </span>
              <div className="h-2 rounded-sm bg-accent" style={{ width: gap * PREVIEW_SCALE * 3 }} />
            </div>
          ))}
        </div>
        <p className="font-mono text-xs">
          pad 16:9 {theme.space.pad.landscape} · 4:5 {theme.space.pad.portrait} · radius {theme.radius}
        </p>
      </Section>

      <Section title="모션">
        <MotionTokenDemo tokens={theme.motion} />
      </Section>

      <Section title="견본 슬라이드">
        <StaticSlideFrame canvas="landscape" theme={name}>
          <SampleSlide />
        </StaticSlideFrame>
        <div className="w-2/3">
          <StaticSlideFrame canvas="portrait" theme={name}>
            <SampleSlide />
          </StaticSlideFrame>
        </div>
      </Section>
    </ThemeScope>
  );
}
