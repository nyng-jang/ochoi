"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { memberById, type MockCard } from "@/lib/mock";

/** 포카 한 장 (가상의 멤버 컬러 그래픽). rare면 홀로그램 반짝임 */
export function Photocard({ card }: { card: MockCard }) {
  const m = memberById(card.memberId);
  return (
    <div
      data-card
      className={`pcard ${card.rare ? "holo" : ""}`}
      style={{ background: `linear-gradient(160deg, ${m.color} 0%, #ffffff 120%)` }}
    >
      {/* 실루엣 일러스트 */}
      <div className="absolute left-1/2 top-[22%] h-[26%] w-[42%] -translate-x-1/2 rounded-full bg-white/70" />
      <div className="absolute bottom-[18%] left-1/2 h-[30%] w-[70%] -translate-x-1/2 rounded-t-full bg-white/60" />
      <div className="absolute inset-x-0 bottom-0 bg-white/85 px-1.5 py-1 text-center">
        <p className="text-[11px] font-bold leading-tight text-ink">{m.name}</p>
        <p className="truncate text-[9px] leading-tight text-ink-soft">{card.album}</p>
      </div>
      {card.rare && (
        <span className="absolute right-1 top-1 z-[4] rounded-full bg-white/90 px-1.5 text-[8px] font-black text-pink">RARE</span>
      )}
    </div>
  );
}

export function Pocket({ card }: { card?: MockCard }) {
  return (
    <div className="pocket" data-pocket>
      {card && card.owned ? (
        <Photocard card={card} />
      ) : card ? (
        <div className="absolute inset-1 flex flex-col items-center justify-center rounded-md border border-dashed border-ink/20 text-center">
          <div className="mb-1 h-6 w-6 rounded-full bg-ink/10" />
          <p className="text-[10px] font-bold text-ink-soft">{memberById(card.memberId).name}</p>
          <p className="text-[9px] text-ink-soft/70">미보유</p>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  cards: MockCard[];
  /** 한 면에 들어가는 포켓 수 (2×2 = 4, 3×3 = 9) */
  perPage?: 4 | 9;
  coverColor?: string;
  title?: string;
  className?: string;
};

export default function PhotocardBinder({ cards, perPage = 4, coverColor = "#ff8fb8", title = "최애 바인더", className = "" }: Props) {
  const pages: (MockCard | undefined)[][] = [];
  for (let i = 0; i < Math.max(cards.length, perPage * 2); i += perPage) {
    pages.push(Array.from({ length: perPage }, (_, k) => cards[i + k]));
  }
  if (pages.length % 2) pages.push(Array.from({ length: perPage }, () => undefined));

  const spreads = pages.length / 2;
  const [spread, setSpread] = useState(0);
  const [dir, setDir] = useState(1);
  const cols = perPage === 9 ? "grid-cols-3" : "grid-cols-2";

  const go = (d: number) => {
    const next = spread + d;
    if (next < 0 || next >= spreads) return;
    setDir(d);
    setSpread(next);
  };

  return (
    <div className={`binder ${className}`} data-binder>
      <div className="binder-spread">
        <div className={`binder-page left ${cols}`} data-binder-page="left">
          {pages[spread * 2].map((c, i) => (
            <Pocket key={`l${spread}-${i}`} card={c} />
          ))}
        </div>

        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={spread}
            custom={dir}
            className={`binder-page right ${cols}`}
            data-binder-page="right"
            variants={{
              enter: (d: number) => ({ rotateY: d > 0 ? 90 : -90, opacity: 0.6 }),
              center: { rotateY: 0, opacity: 1 },
              exit: (d: number) => ({ rotateY: d > 0 ? -100 : 100, opacity: 0, zIndex: 3 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.3, 0.7, 0.2, 1] }}
          >
            {pages[spread * 2 + 1].map((c, i) => (
              <Pocket key={`r${spread}-${i}`} card={c} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* 표지 — 랜딩에서는 GSAP으로 펼침. 기본은 열린 상태(뒤로 넘어가 숨겨짐) */}
        <div
          className="binder-cover flex flex-col items-center justify-center text-white"
          data-binder-cover
          style={{ background: `linear-gradient(150deg, ${coverColor}, #ffffff 160%)`, transform: "rotateY(-180deg)" }}
        >
          <div className="mb-3 h-14 w-14 rounded-full border-4 border-white/80" />
          <p className="text-lg font-black tracking-wide">{title}</p>
          <p className="text-xs opacity-80">COLLECT BOOK</p>
        </div>

        {/* 링 */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-[6] flex h-full -translate-x-1/2 flex-col justify-around py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-7 rounded-full border-[3px] border-zinc-300 bg-zinc-100 shadow" />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <button onClick={() => go(-1)} disabled={spread === 0} className="rounded-full bg-paper px-4 py-2 font-bold shadow disabled:opacity-30">
          이전
        </button>
        <span className="tabular-nums text-ink-soft">
          {spread + 1} / {spreads}
        </span>
        <button onClick={() => go(1)} disabled={spread === spreads - 1} className="rounded-full bg-paper px-4 py-2 font-bold shadow disabled:opacity-30">
          다음
        </button>
      </div>
    </div>
  );
}
