import Link from "next/link";
import { ThemeScope } from "@/themes/ThemeScope";

export default function NotFound() {
  return (
    <ThemeScope name="paper" className="grid min-h-dvh place-items-center bg-bg p-6 text-fg">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <Link href="/" className="text-accent underline underline-offset-4">
          목록으로
        </Link>
      </div>
    </ThemeScope>
  );
}
