import type { Metadata } from "next";
import { ThemeColumn } from "@/gallery/ThemeColumn";
import { themeNames } from "@/themes";

export const metadata: Metadata = { title: "테마 갤러리 (dev)" };

export default function GalleryPage() {
  return (
    <main className="min-h-dvh bg-neutral-100 p-6 text-neutral-900">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold">테마 갤러리</h1>
        <p className="text-sm text-neutral-600">
          개발 모드 전용 · 프로덕션 빌드에 포함되지 않음 · 정의: <code>src/themes/</code>
        </p>
      </header>
      <div className="grid gap-6 xl:grid-cols-3">
        {themeNames.map((name) => (
          <ThemeColumn key={name} name={name} />
        ))}
      </div>
    </main>
  );
}
