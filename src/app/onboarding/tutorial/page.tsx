"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlbumCover, Spine } from "@/components/room/AlbumShelf";
import { Photocard } from "@/components/room/PhotocardBinder";
import { ALBUMS, ARTISTS, CARDS } from "@/lib/mock";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding-store";

const STEPS = [
  { title: "선반에 첫 앨범을 꽂아볼까요?", hint: "가지고 있는 앨범을 눌러보세요" },
  { title: "포카를 바인더에 넣어요", hint: "포카를 눌러서 빈 포켓에 넣어보세요" },
  { title: "이번 달 덕질 예산은?", hint: "남은 금액은 영수증을 올릴 때마다 자동으로 줄어요" },
  { title: "생일시 알림을 켤까요?", hint: "매일 생일 숫자 시각에 알려줘요" },
];

export default function Tutorial() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [shelved, setShelved] = useState<string[]>([]);
  const [pocketed, setPocketed] = useState<string[]>([]);
  const [budget, setBudget] = useState(150000);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [artist, setArtist] = useState(ARTISTS[0]);

  // 브라우저 저장소(sessionStorage)는 마운트 후에만 읽을 수 있어서 effect에서 상태를 맞춘다
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const s = loadOnboarding();
    const a = ARTISTS.find((x) => x.id === s.artistIds[0]);
    if (a) setArtist(a);
    const biasId = a ? s.bias[a.id] : undefined;
    setAlerts(biasId ? [biasId] : []);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const albums = ALBUMS.filter((a) => a.owned).slice(0, 3);
  const cards = CARDS.filter((c) => c.owned).slice(0, 3);
  const done = step >= STEPS.length;
  const canNext = [shelved.length > 0, pocketed.length > 0, true, true][step];

  const finish = () => {
    saveOnboarding({ budget, birthdayAlerts: alerts });
    router.push("/room");
  };

  return (
    <main className="mx-auto w-full flex min-h-svh max-w-md flex-col px-6 pb-8 pt-6" style={{ ["--room" as string]: artist.color }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black" style={{ color: artist.color }}>
          {artist.name} 방 꾸미기
        </p>
        <p className="text-xs font-bold text-ink-soft">{Math.min(step + 1, STEPS.length)} / {STEPS.length}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full" style={{ background: artist.color }} animate={{ width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.section key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-8 flex flex-1 flex-col">
            <h1 className="text-2xl font-black">{STEPS[step].title}</h1>
            <p className="mt-1 text-sm text-ink-soft">{STEPS[step].hint}</p>

            {step === 0 && (
              <LayoutGroup>
                <div className="shelf mt-8">
                  <div className="shelf-row justify-start" style={{ height: 190 }}>
                    {shelved.map((id) => {
                      const a = albums.find((x) => x.id === id)!;
                      return (
                        <motion.div key={id} layoutId={id} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
                          <Spine album={a} />
                        </motion.div>
                      );
                    })}
                    {!shelved.length && <p className="m-auto text-sm font-semibold text-wood-dark">아직 비어 있어요</p>}
                  </div>
                  <div className="shelf-board" />
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {albums
                    .filter((a) => !shelved.includes(a.id))
                    .map((a) => (
                      <motion.button key={a.id} layoutId={a.id} onClick={() => setShelved([...shelved, a.id])} whileTap={{ scale: 0.95 }} className="text-left">
                        <AlbumCover album={a} />
                        <p className="mt-1 truncate text-xs font-bold">{a.title}</p>
                      </motion.button>
                    ))}
                </div>
              </LayoutGroup>
            )}

            {step === 1 && (
              <LayoutGroup>
                <div className="mt-8 grid grid-cols-3 gap-3 rounded-3xl bg-[#f5f2ff] p-4">
                  {[0, 1, 2].map((slot) => {
                    const id = pocketed[slot];
                    const c = cards.find((x) => x.id === id);
                    return (
                      <div key={slot} className="pocket">
                        {c && (
                          <motion.div layoutId={c.id} className="absolute inset-0" transition={{ type: "spring", stiffness: 220, damping: 20 }}>
                            <Photocard card={c} />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center gap-3">
                  {cards
                    .filter((c) => !pocketed.includes(c.id))
                    .map((c, i) => (
                      <motion.button
                        key={c.id}
                        layoutId={c.id}
                        onClick={() => setPocketed([...pocketed, c.id])}
                        className="relative aspect-[55/85] w-24"
                        style={{ rotate: (i - 1) * 6 }}
                        whileHover={{ y: -8 }}
                      >
                        <Photocard card={c} />
                      </motion.button>
                    ))}
                </div>
              </LayoutGroup>
            )}

            {step === 2 && (
              <div className="mt-10 rounded-3xl bg-paper p-6 shadow-sm">
                <p className="text-center text-4xl font-black tabular-nums" style={{ color: artist.color }}>
                  {budget.toLocaleString("ko-KR")}원
                </p>
                <input
                  type="range"
                  min={30000}
                  max={500000}
                  step={10000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-6 w-full"
                  style={{ accentColor: artist.color }}
                />
                <div className="mt-1 flex justify-between text-xs text-ink-soft">
                  <span>3만원</span>
                  <span>50만원</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                  {[100000, 150000, 300000].map((v) => (
                    <button key={v} onClick={() => setBudget(v)} className={`rounded-xl py-2 font-bold ${budget === v ? "bg-ink text-white" : "bg-cream"}`}>
                      {v / 10000}만원
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <ul className="mt-8 space-y-2.5">
                {artist.members.map((m) => {
                  const on = alerts.includes(m.id);
                  const [mm, dd] = m.birth.split("-");
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => setAlerts(on ? alerts.filter((x) => x !== m.id) : [...alerts, m.id])}
                        className="flex w-full items-center gap-3 rounded-2xl bg-paper p-3 text-left shadow-sm"
                      >
                        <span className="h-10 w-10 rounded-full" style={{ background: `linear-gradient(160deg, ${m.color}, #fff)` }} />
                        <span className="flex-1">
                          <span className="block font-bold">{m.name}시</span>
                          <span className="block text-xs tabular-nums text-ink-soft">
                            매일 {mm}:{dd} · {String(Number(mm) + 12).padStart(2, "0")}:{dd}
                          </span>
                        </span>
                        <span className={`relative h-7 w-12 rounded-full transition ${on ? "" : "bg-line"}`} style={on ? { background: artist.color } : undefined}>
                          <motion.span layout className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${on ? "right-1" : "left-1"}`} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        ) : (
          <motion.section key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative h-40 w-40">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-3 w-3 rounded-sm"
                  style={{ background: [artist.color, "#ffd166", "#5cc8ff", "#6fd6a8"][i % 4] }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: Math.cos((i / 14) * Math.PI * 2) * 90, y: Math.sin((i / 14) * Math.PI * 2) * 90, opacity: 0, rotate: 180 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              ))}
              <div className="absolute inset-6 flex items-center justify-center rounded-full text-4xl font-black text-white" style={{ background: artist.color }}>
                {artist.name[0]}
              </div>
            </div>
            <h1 className="mt-6 text-2xl font-black">{artist.name} 방이 준비됐어요</h1>
            <p className="mt-2 text-sm text-ink-soft">
              앨범 {shelved.length}장 · 포카 {pocketed.length}장 · 예산 {budget.toLocaleString("ko-KR")}원 · 생일시 알림 {alerts.length}개
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="mt-6">
        {done ? (
          <button onClick={finish} className="w-full rounded-2xl py-4 font-bold text-white" style={{ background: artist.color }}>
            내 방 보러 가기
          </button>
        ) : (
          <button onClick={() => setStep(step + 1)} disabled={!canNext} className="w-full rounded-2xl bg-ink py-4 font-bold text-white disabled:opacity-30">
            {step === STEPS.length - 1 ? "완료" : "다음"}
          </button>
        )}
      </div>
    </main>
  );
}
