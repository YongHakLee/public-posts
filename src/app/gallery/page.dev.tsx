import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryApp } from "@/gallery/GalleryApp";

export const metadata: Metadata = { title: "테마 갤러리 (dev)" };

// useSearchParams를 쓰는 클라이언트 컴포넌트는 Suspense 경계 안에 둔다.
export default function GalleryPage() {
  return (
    <Suspense fallback={null}>
      <GalleryApp />
    </Suspense>
  );
}
