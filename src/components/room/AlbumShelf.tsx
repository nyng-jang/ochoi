"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { AlbumFormat, MockAlbum } from "@/lib/mock";

// 앨범 형태별 책등 크기 (포토북은 두껍고 높게, 플랫폼 앨범은 아주 얇게)
const SIZE: Record<AlbumFormat, { w: number; h: number }> = {
  photobook: { w: 42, h: 172 },
  digipack: { w: 28, h: 150 },
  jewel: { w: 22, h: 140 },
  platform: { w: 12, h: 118 },
};

const FORMAT_LABEL: Record<AlbumFormat, string> = {
  photobook: "포토북",
  digipack: "디지팩",
  jewel: "쥬얼",
  platform: "플랫폼",
};

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return r * 0.299 + g * 0.587 + b * 0.114 < 150;
}

/** 앨범 커버 (가상의 일러스트풍 그래픽) */
export function AlbumCover({ album, className = "" }: { album: MockAlbum; className?: string }) {
  if (album.coverUrl) {
    return (
      <div className={`relative aspect-square overflow-hidden rounded-xl bg-line ${className}`}>
        <Image src={album.coverUrl} alt={`${album.title} 앨범 커버`} fill sizes="320px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`@container relative aspect-square overflow-hidden rounded-xl ${className}`}
      style={{ background: `linear-gradient(140deg, ${album.color}, ${album.color2})` }}
    >
      <div className="absolute -right-6 -top-6 h-2/3 w-2/3 rounded-full opacity-60" style={{ background: album.color2 }} />
      <div className="absolute bottom-6 left-5 h-1/4 w-1/4 rounded-full border-4 border-white/70" />
      <div className={`absolute bottom-[6%] right-[6%] left-[6%] text-right ${isDark(album.color) ? "text-white" : "text-ink"}`}>
        <p className="text-[13cqw] font-black leading-tight">{album.title}</p>
        <p className="text-[8cqw] opacity-80">{album.version}</p>
      </div>
    </div>
  );
}

/** 책등 하나 — 랜딩 애니메이션에서도 data-spine으로 잡아서 움직임 */
export function Spine({ album, onClick }: { album: MockAlbum; onClick?: () => void }) {
  const { w, h } = SIZE[album.format];
  const dark = isDark(album.color);
  return (
    <button
      type="button"
      data-spine
      data-owned={album.owned}
      onClick={onClick}
      aria-label={`${album.title} ${album.version}${album.owned ? "" : " (미보유)"}`}
      className={`spine ${album.owned ? "" : "spine-ghost"}`}
      style={{ width: w, height: h, background: `linear-gradient(90deg, ${album.color} 0%, ${album.color2} 140%)` }}
    >
      {w >= 20 && (
        <span className={`spine-title ${dark ? "text-white" : "text-ink"}`} style={{ fontSize: w >= 40 ? 12 : 10 }}>
          {album.title}
        </span>
      )}
      <span
        className="absolute bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
        style={{ background: dark ? "rgba(255,255,255,.7)" : "rgba(42,34,51,.5)" }}
      />
    </button>
  );
}

type Props = {
  albums: MockAlbum[];
  /** 앨범 상세에서 보유/미보유 전환 (실제 데이터 방) */
  onToggleOwned?: (id: string) => void;
  /** 한 칸에 꽂을 최대 개수. 넘으면 다음 칸으로 */
  perRow?: number;
  interactive?: boolean;
  className?: string;
};

export default function AlbumShelf({ albums, onToggleOwned, perRow = 12, interactive = true, className = "" }: Props) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = albums.find((a) => a.id === pickedId) ?? null;
  const setPicked = (a: MockAlbum | null) => setPickedId(a?.id ?? null);
  const rows: MockAlbum[][] = [];
  for (let i = 0; i < albums.length; i += perRow) rows.push(albums.slice(i, i + perRow));

  return (
    <div className={`shelf ${className}`} data-shelf>
      {rows.map((row, ri) => (
        <div key={ri}>
          <div className="shelf-row" data-shelf-row>
            {row.map((a) => (
              <Spine key={a.id} album={a} onClick={interactive ? () => setPicked(a) : undefined} />
            ))}
            {/* 북엔드 */}
            <div className="ml-2 h-24 w-3 self-end rounded-t-md bg-wood-dark/80" />
          </div>
          <div className="shelf-board" />
        </div>
      ))}

      {typeof document !== "undefined" &&
        createPortal(
      <AnimatePresence>
        {picked && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPicked(null)}
          >
            <motion.div
              className="w-full max-w-xs rounded-3xl bg-paper p-5 shadow-2xl"
              initial={{ y: 80, rotateY: -70, opacity: 0 }}
              animate={{ y: 0, rotateY: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              style={{ transformPerspective: 900 }}
            >
              <AlbumCover album={picked} className={picked.owned ? "" : "opacity-50 grayscale"} />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{picked.title}</p>
                  <p className="text-sm text-ink-soft">
                    {picked.version} · {picked.releaseDate ?? picked.year}
                    {!picked.coverUrl && ` · ${FORMAT_LABEL[picked.format]}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${picked.owned ? "bg-pink-soft text-pink" : "bg-line text-ink-soft"}`}
                >
                  {picked.owned ? "보유" : "미보유"}
                </span>
              </div>
              {onToggleOwned ? (
                <button
                  onClick={() => onToggleOwned(picked.id)}
                  className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold ${picked.owned ? "bg-line text-ink" : "bg-ink text-white"}`}
                >
                  {picked.owned ? "미보유로 바꾸기" : "가지고 있어요 (선반에 꽂기)"}
                </button>
              ) : (
                !picked.owned && <button className="mt-4 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white">위시리스트에 담기</button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
