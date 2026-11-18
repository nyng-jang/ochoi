"use client";

import { useEffect, useState } from "react";

/** 제목으로 정해지는 기본 파스텔 색 (커버 색을 못 읽을 때) */
export function fallbackColors(seed: string): [string, string] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return [`hsl(${h} 70% 72%)`, `hsl(${(h + 25) % 360} 80% 90%)`];
}

/**
 * 앨범 커버에서 대표 색 2개 뽑기 (책등 색).
 * 외부 CDN 이미지는 캔버스에서 읽을 수 없어서(CORS) Next 이미지 최적화 경로(같은 출처)로 작게 불러온다.
 */
export function useCoverColors(items: { id: string; coverUrl?: string | null }[]) {
  const [colors, setColors] = useState<Record<string, [string, string]>>({});
  const key = items.map((i) => i.id).join(",");

  useEffect(() => {
    let alive = true;
    items.forEach((it) => {
      if (!it.coverUrl) return;
      const img = new window.Image();
      img.src = `/_next/image?url=${encodeURIComponent(it.coverUrl)}&w=64&q=60`;
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 24;
          const ctx = c.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0, 24, 24);
          const d = ctx.getImageData(0, 0, 24, 24).data;
          // 가장 채도 높은 픽셀 쪽 평균(대표색)과 전체 평균(보조색)
          let r = 0, g = 0, b = 0, n = 0, vr = 0, vg = 0, vb = 0, vn = 0;
          for (let i = 0; i < d.length; i += 4) {
            const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
            r += R; g += G; b += B; n++;
            const sat = Math.max(R, G, B) - Math.min(R, G, B);
            if (sat > 60) { vr += R; vg += G; vb += B; vn++; }
          }
          const main = vn > 20 ? [vr / vn, vg / vn, vb / vn] : [r / n, g / n, b / n];
          const avg = [r / n, g / n, b / n];
          const hex = (v: number[]) => `#${v.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
          const light = avg.map((x) => x + (255 - x) * 0.55);
          if (alive) setColors((prev) => ({ ...prev, [it.id]: [hex(main), hex(light)] }));
        } catch {
          // 읽기 실패 시 기본 색 유지
        }
      };
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return colors;
}
