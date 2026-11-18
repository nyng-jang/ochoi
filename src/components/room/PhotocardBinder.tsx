"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { memberById, type MockCard } from "@/lib/mock";

/** 포카 한 장 (가상의 멤버 컬러 그래픽). rare면 홀로그램 반짝임 */
export function Photocard({ card }: { card: MockCard }) {
  const m = card.member ?? memberById(card.memberId);
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

export function Pocket({ card, onOpen }: { card?: MockCard; onOpen?: (c: MockCard) => void }) {
  const clickable = Boolean(card && onOpen);
  return (
    <div
      className={`pocket ${clickable ? "cursor-pointer transition-transform hover:-translate-y-1" : ""}`}
      data-pocket
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={card ? `${(card.member ?? memberById(card.memberId)).name} ${card.album} 포카 ${card.owned ? "" : "(미보유)"} 상세 보기` : undefined}
      onClick={clickable ? () => onOpen!(card!) : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onOpen!(card!) : undefined}
    >
      {card && card.owned ? (
        <Photocard card={card} />
      ) : card ? (
        <div className="absolute inset-1 flex flex-col items-center justify-center rounded-md border border-dashed border-ink/20 text-center">
          <div className="mb-1 h-6 w-6 rounded-full bg-ink/10" />
          <p className="text-[10px] font-bold text-ink-soft">{(card.member ?? memberById(card.memberId)).name}</p>
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
  const [opened, setOpened] = useState<MockCard | null>(null);
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
            <Pocket key={`l${spread}-${i}`} card={c} onOpen={setOpened} />
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
              <Pocket key={`r${spread}-${i}`} card={c} onOpen={setOpened} />
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

      {/* 부모에 transform(스크롤 연출 등)이 있어도 화면 전체를 덮도록 body로 포털 */}
      {typeof document !== "undefined" &&
        createPortal(<AnimatePresence>{opened && <PhotocardDetail card={opened} onClose={() => setOpened(null)} />}</AnimatePresence>, document.body)}

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

/** 포카 상세: 탭하면 앞뒷면이 뒤집히고, 구한 날짜·가격·거래 기록·시세 바로가기를 보여줌 */
export function PhotocardDetail({ card, onClose }: { card: MockCard; onClose: () => void }) {
  const m = card.member ?? memberById(card.memberId);
  const [flipped, setFlipped] = useState(false);
  const q = encodeURIComponent(`${m.name} ${card.album} 포카`);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[92svh] w-full max-w-sm overflow-y-auto rounded-t-[32px] bg-paper p-6 sm:rounded-[32px]"
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        exit={{ y: 120 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${m.name} 포카 상세`}
      >
        {/* 앞뒷면 뒤집기 */}
        <button className="mx-auto block w-40" style={{ perspective: 900 }} onClick={() => setFlipped(!flipped)} aria-label="앞뒷면 뒤집기">
          <motion.div className="relative aspect-[55/85]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6 }} style={{ transformStyle: "preserve-3d" }}>
            <div className={`absolute inset-0 overflow-hidden rounded-xl shadow-xl ${card.owned ? "" : "opacity-40 grayscale"}`} style={{ backfaceVisibility: "hidden" }}>
              <Photocard card={card} />
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl text-center shadow-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: `linear-gradient(200deg, ${m.color}, #fff 130%)` }}
            >
              <p className="text-xl font-black tracking-widest text-white">{card.groupName ?? "LUMI"}</p>
              <p className="mt-1 text-[10px] font-bold text-white/90">{card.album}</p>
              <p className="mt-6 -rotate-6 font-serif text-lg italic text-white">{m.name}</p>
            </div>
          </motion.div>
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-soft">카드를 누르면 뒷면을 볼 수 있어요</p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-lg font-black">
              {m.name} <span className="text-sm font-semibold text-ink-soft">· {card.album}</span>
            </p>
            {card.rare && <span className="mt-1 inline-block rounded-full bg-pink-soft px-2 py-0.5 text-[10px] font-black text-pink">RARE · 홀로그램</span>}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${card.owned ? "bg-mint/20 text-[#2f8f6a]" : "bg-line text-ink-soft"}`}>
            {card.owned ? "보유" : "미보유"}
          </span>
        </div>

        {card.owned ? (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-cream p-3">
                <dt className="text-[11px] text-ink-soft">구한 날짜</dt>
                <dd className="font-bold">{card.acquiredOn ?? "-"}</dd>
              </div>
              <div className="rounded-2xl bg-cream p-3">
                <dt className="text-[11px] text-ink-soft">산 가격</dt>
                <dd className="font-bold">{card.price ? `${card.price.toLocaleString("ko-KR")}원` : "앨범 포함"}</dd>
              </div>
            </dl>
            {card.history && (
              <div className="mt-4">
                <p className="text-xs font-bold text-ink-soft">거래 기록</p>
                <ol className="mt-2 space-y-2 border-l-2 border-line pl-4">
                  {card.history.map((h) => (
                    <li key={h.date + h.kind} className="relative text-sm">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      <span className="font-bold">{h.kind}</span> <span className="text-ink-soft">{h.date}</span>
                      {h.price > 0 && <span className="ml-1 font-semibold">{h.price.toLocaleString("ko-KR")}원</span>}
                      {h.memo && <p className="text-xs text-ink-soft">{h.memo}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : (
          <p className="mt-4 rounded-2xl bg-cream p-3 text-sm text-ink-soft">아직 없는 포카예요. 위시리스트에 담으면 예상 금액이 예산에 미리 반영돼요.</p>
        )}

        {/* 시세: 자동 수집 대신 검색 바로가기 */}
        <p className="mt-5 text-xs font-bold text-ink-soft">시세 확인</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a href={`https://m.bunjang.co.kr/search/products?q=${q}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-cream py-3 text-center text-sm font-bold">
            번개장터 검색
          </a>
          <a href={`https://x.com/search?q=${q}%20양도`} target="_blank" rel="noreferrer" className="rounded-2xl bg-cream py-3 text-center text-sm font-bold">
            X 양도글 검색
          </a>
        </div>
        <button className="mt-3 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-white" onClick={onClose}>
          {card.owned ? "거래 기록 추가" : "위시리스트에 담기"}
        </button>
      </motion.div>
    </motion.div>
  );
}
