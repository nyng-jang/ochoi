"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AlbumShelf from "@/components/room/AlbumShelf";
import PhotocardBinder from "@/components/room/PhotocardBinder";
import GoodsCabinet from "@/components/room/GoodsCabinet";
import ReceiptLedger from "@/components/room/ReceiptLedger";
import { ALBUMS, ARTISTS, CARDS, GOODS, RECEIPT } from "@/lib/mock";
import { loadOnboarding } from "@/lib/onboarding-store";

const TABS = [
  { id: "shelf", label: "앨범 선반" },
  { id: "binder", label: "포카 바인더" },
  { id: "goods", label: "굿즈 진열장" },
  { id: "ledger", label: "가계부" },
] as const;

export default function Room() {
  const [artistIds, setArtistIds] = useState<string[]>([ARTISTS[0].id]);
  const [budget, setBudget] = useState(150000);
  const [current, setCurrent] = useState(ARTISTS[0].id);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("shelf");

  // 브라우저 저장소(sessionStorage)는 마운트 후에만 읽을 수 있어서 effect에서 상태를 맞춘다
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const s = loadOnboarding();
    if (s.artistIds.length) {
      setArtistIds(s.artistIds);
      setCurrent(s.artistIds[0]);
    }
    setBudget(s.budget);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const artist = ARTISTS.find((a) => a.id === current) ?? ARTISTS[0];

  return (
    <main className="mx-auto w-full min-h-svh max-w-3xl overflow-x-hidden px-5 pb-16 pt-5" style={{ background: `linear-gradient(180deg, ${artist.color}22, transparent 320px)` }}>
      <header className="flex items-center justify-between">
        <Link href="/" className="font-black">
          오늘의 최애<span className="text-pink">.</span>
        </Link>
        <span className="text-xs text-ink-soft">목업</span>
      </header>

      {/* 방 문 (아티스트 탭) */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {ARTISTS.filter((a) => artistIds.includes(a.id)).map((a) => (
          <button
            key={a.id}
            onClick={() => setCurrent(a.id)}
            className={`flex-none rounded-t-2xl px-4 pb-2 pt-3 text-sm font-black transition ${a.id === current ? "text-white" : "bg-paper/70 text-ink-soft"}`}
            style={a.id === current ? { background: a.color } : undefined}
          >
            {a.name} 방
          </button>
        ))}
        <Link href="/onboarding/artist" className="flex-none rounded-t-2xl bg-paper/50 px-4 pb-2 pt-3 text-sm font-bold text-ink-soft">
          + 방 추가
        </Link>
      </div>

      <nav className="relative mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-paper p-1 shadow-sm">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="relative min-w-0 rounded-xl py-2.5 text-[11px] font-bold sm:text-xs">
            {tab === t.id && <motion.span layoutId="tab" className="absolute inset-0 rounded-xl" style={{ background: artist.color }} />}
            <span className={`relative ${tab === t.id ? "text-white" : "text-ink-soft"}`}>{t.label}</span>
          </button>
        ))}
      </nav>

      <motion.section key={tab + current} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        {tab === "shelf" && (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              <AlbumShelf albums={ALBUMS} />
            </div>
          </div>
        )}
        {tab === "binder" && <PhotocardBinder cards={CARDS} coverColor={artist.color} title={artist.name} />}
        {tab === "goods" && <GoodsCabinet goods={GOODS} />}
        {tab === "ledger" && (
          <div className="flex justify-center">
            <ReceiptLedger items={RECEIPT} budget={budget} savedGoal={{ label: "생일 적금", saved: 23400, target: 50000 }} />
          </div>
        )}
      </motion.section>
    </main>
  );
}
