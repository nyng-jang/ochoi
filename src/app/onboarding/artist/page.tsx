"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ARTISTS, ALBUMS, type MockArtist } from "@/lib/mock";
import { saveOnboarding } from "@/lib/onboarding-store";

type Step = "pick" | "bias" | "confirm";
const STEPS: Step[] = ["pick", "bias", "confirm"];
const STEP_LABEL: Record<Step, string> = { pick: "아티스트", bias: "최애 멤버", confirm: "정보 확인" };

const birthTime = (mmdd: string) => {
  const [m, d] = mmdd.split("-");
  return `${m}:${d} · ${String(Number(m) + 12).padStart(2, "0")}:${d}`;
};

export default function ArtistSelect() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [bias, setBias] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const results = useMemo(
    () => ARTISTS.filter((a) => !query || a.name.toLowerCase().includes(query.toLowerCase()) || a.description.includes(query)),
    [query],
  );
  const chosen = ARTISTS.filter((a) => picked.includes(a.id));
  const groups = chosen.filter((a) => a.kind === "group");

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const next = () => {
    if (step === "pick") {
      setStep(groups.length ? "bias" : "confirm");
      if (!groups.length) fakeLoad();
    } else if (step === "bias") {
      setStep("confirm");
      fakeLoad();
    } else {
      saveOnboarding({ artistIds: picked, bias });
      router.push("/onboarding/tutorial");
    }
  };
  const fakeLoad = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };

  return (
    <main className="mx-auto w-full flex min-h-svh max-w-md flex-col px-6 pb-8 pt-6">
      {/* 진행 표시 */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${STEPS.indexOf(s) <= STEPS.indexOf(step) ? "bg-pink" : "bg-line"}`} />
            <p className={`mt-1.5 text-[11px] font-bold ${s === step ? "text-ink" : "text-ink-soft/60"}`}>{STEP_LABEL[s]}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.section key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mt-8 flex-1">
          {step === "pick" && (
            <>
              <h1 className="text-2xl font-black">누구를 덕질하고 있나요?</h1>
              <p className="mt-1 text-sm text-ink-soft">여러 명 고를 수 있어요. 그룹을 먼저 찾으면 멤버를 고를 수 있어요.</p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="그룹이나 가수 이름 검색"
                className="mt-5 w-full rounded-2xl bg-paper px-4 py-3.5 shadow-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-pink"
              />
              <ul className="mt-4 space-y-2.5">
                {results.map((a) => (
                  <ArtistRow key={a.id} artist={a} selected={picked.includes(a.id)} onClick={() => toggle(a.id)} />
                ))}
                {!results.length && <p className="py-8 text-center text-sm text-ink-soft">검색 결과가 없어요</p>}
              </ul>
            </>
          )}

          {step === "bias" && (
            <>
              <h1 className="text-2xl font-black">최애 멤버를 골라주세요</h1>
              <p className="mt-1 text-sm text-ink-soft">방 컬러와 메인 화면이 최애 기준으로 꾸며져요. 나중에 바꿀 수 있어요.</p>
              <div className="mt-6 space-y-6">
                {groups.map((g) => (
                  <div key={g.id}>
                    <p className="mb-2 text-sm font-bold" style={{ color: g.color }}>
                      {g.name}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {g.members.map((m) => {
                        const on = bias[g.id] === m.id;
                        return (
                          <motion.button
                            key={m.id}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setBias({ ...bias, [g.id]: m.id })}
                            className={`flex flex-col items-center rounded-2xl p-2 ${on ? "bg-paper shadow-md ring-2" : "bg-paper/60"}`}
                            style={on ? { ["--tw-ring-color" as string]: m.color } : undefined}
                          >
                            <span className="relative h-14 w-14 rounded-full" style={{ background: `linear-gradient(160deg, ${m.color}, #fff)` }}>
                              {on && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink text-[10px] font-black text-white">♥</span>}
                            </span>
                            <span className="mt-1.5 text-xs font-bold">{m.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <h1 className="text-2xl font-black">불러온 정보를 확인해주세요</h1>
              <p className="mt-1 text-sm text-ink-soft">위키데이터·음반 DB에서 가져왔어요. 틀린 건 고치면 다른 팬들에게도 반영돼요.</p>
              {loading ? (
                <div className="mt-10 flex flex-col items-center gap-4 py-10">
                  <div className="flex items-end gap-1">
                    {ALBUMS.slice(0, 5).map((a, i) => (
                      <motion.span
                        key={a.id}
                        className="block w-4 rounded-sm"
                        style={{ background: a.color, height: 40 + (i % 3) * 10 }}
                        animate={{ y: [0, -14, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-ink-soft">덕질 준비 중...</p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {chosen.map((a) => (
                    <div key={a.id} className="rounded-3xl bg-paper p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-full" style={{ background: a.color }} />
                        <div>
                          <p className="font-black">{a.name}</p>
                          <p className="text-xs text-ink-soft">{a.description}</p>
                        </div>
                      </div>
                      <dl className="mt-4 space-y-2 text-sm">
                        <Row label="데뷔일">
                          <span className="flex items-center gap-2">
                            <input type="date" defaultValue={`${a.debutYear}-05-16`} className="rounded-lg bg-cream px-2 py-1 text-xs" />
                            <span className="rounded-full bg-butter/40 px-2 py-0.5 text-[10px] font-bold text-[#9a6b00]">확인 필요</span>
                          </span>
                        </Row>
                        <Row label="생일시">
                          <span className="text-right text-xs">
                            {a.members.slice(0, 3).map((m) => (
                              <span key={m.id} className="block">
                                {m.name} {birthTime(m.birth)}
                              </span>
                            ))}
                            {a.members.length > 3 && <span className="text-ink-soft">외 {a.members.length - 3}명</span>}
                          </span>
                        </Row>
                        <Row label="앨범">12장 (정규 3 · 미니 5 · 싱글 4)</Row>
                        <Row label="공식 링크">
                          <span className="flex gap-1">
                            {["YT", "IG", "X", "WEB"].map((l) => (
                              <span key={l} className="rounded-md bg-cream px-1.5 py-0.5 text-[10px] font-bold">{l}</span>
                            ))}
                          </span>
                        </Row>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.section>
      </AnimatePresence>

      <div className="mt-6 flex gap-3">
        {step !== "pick" && (
          <button onClick={() => setStep(step === "confirm" && groups.length ? "bias" : "pick")} className="rounded-2xl bg-paper px-5 py-4 font-bold shadow-sm">
            이전
          </button>
        )}
        <button
          onClick={next}
          disabled={(step === "pick" && !picked.length) || (step === "bias" && groups.some((g) => !bias[g.id])) || loading}
          className="flex-1 rounded-2xl bg-ink py-4 font-bold text-white disabled:opacity-30"
        >
          {step === "pick" ? `${picked.length || ""}${picked.length ? "명 선택 · " : ""}다음` : step === "bias" ? "정보 불러오기" : "내 방 만들기"}
        </button>
      </div>
    </main>
  );
}

function ArtistRow({ artist, selected, onClick }: { artist: MockArtist; selected: boolean; onClick: () => void }) {
  return (
    <li>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl bg-paper p-3 text-left shadow-sm ring-2 transition ${selected ? "" : "ring-transparent"}`}
        style={selected ? { ["--tw-ring-color" as string]: artist.color } : undefined}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white" style={{ background: artist.color }}>
          {artist.name[0]}
        </span>
        <span className="flex-1">
          <span className="block font-bold">{artist.name}</span>
          <span className="block text-xs text-ink-soft">{artist.description}</span>
        </span>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${selected ? "bg-pink text-white" : "bg-line text-transparent"}`}>✓</span>
      </motion.button>
    </li>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}
