"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AlbumShelf from "@/components/room/AlbumShelf";
import PhotocardBinder from "@/components/room/PhotocardBinder";
import GoodsCabinet from "@/components/room/GoodsCabinet";
import ReceiptLedger from "@/components/room/ReceiptLedger";
import { GOODS, RECEIPT, type AlbumFormat, type MockAlbum, type MockCard } from "@/lib/mock";
import type { RoomData } from "@/lib/artists/queries";
import { fallbackColors, useCoverColors } from "@/lib/use-cover-colors";

const TABS = [
  { id: "shelf", label: "앨범 선반" },
  { id: "binder", label: "포카 바인더" },
  { id: "goods", label: "굿즈 진열장" },
  { id: "ledger", label: "가계부" },
] as const;

// 멤버 구분용 파스텔 색 (공식 멤버 컬러가 아님)
const PALETTE = ["#ff8fb8", "#9b8cff", "#5cc8ff", "#ffb347", "#6fd6a8", "#ff7a7a", "#c77dff", "#4fb3ff"];
const FORMAT: Record<string, AlbumFormat> = { album: "photobook", ep: "digipack", single: "jewel" };
const LINK_LABEL: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", x: "X", website: "공식 사이트", spotify: "Spotify", weibo: "Weibo" };
const linkUrl = (k: string, v: string) =>
  ({ youtube: `https://www.youtube.com/channel/${v}`, instagram: `https://instagram.com/${v}`, x: `https://x.com/${v}`, spotify: `https://open.spotify.com/artist/${v}`, weibo: `https://weibo.com/${v}` })[k] ?? v;

const OWNED_KEY = (artistId: string) => `ochoi-owned-${artistId}`;

/** 한국 시간 기준 지금 */
function nowKST() {
  return new Date(Date.now() + (9 * 60 + new Date().getTimezoneOffset()) * 60000);
}
function daysUntil(mmdd: string, from: Date) {
  const [m, d] = mmdd.split("-").map(Number);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(from.getFullYear(), m - 1, d);
  if (next < today) next = new Date(from.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 864e5);
}
/** 다음 생일시까지 남은 분 (05:16 → 05:16, 17:16) */
function nextBirthdayTime(mmdd: string, now: Date) {
  const [m, d] = mmdd.split("-").map(Number);
  const times = [m * 60 + d, (m + 12) * 60 + d].filter((t) => t < 24 * 60);
  const cur = now.getHours() * 60 + now.getMinutes();
  const next = times.find((t) => t > cur) ?? times[0] + 24 * 60;
  return { mins: next - cur, label: `${String(Math.floor((next % 1440) / 60)).padStart(2, "0")}:${String(d).padStart(2, "0")}` };
}

export default function RoomView({ data, biasWikidataId }: { data: RoomData; biasWikidataId: string }) {
  const { artist, members } = data;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("shelf");
  const [owned, setOwned] = useState<string[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  const bias = members.find((m) => m.wikidataId === biasWikidataId) ?? members[0];
  const biasColor = PALETTE[Math.max(0, members.indexOf(bias)) % PALETTE.length];
  const coverColors = useCoverColors(data.albums);

  // 브라우저 저장소와 현재 시각은 마운트 후에만 알 수 있어서 effect에서 맞춘다
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setOwned(JSON.parse(localStorage.getItem(OWNED_KEY(artist.id)) ?? "[]"));
    } catch {}
    setNow(nowKST());
    const t = setInterval(() => setNow(nowKST()), 30_000);
    return () => clearInterval(t);
  }, [artist.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleOwned = (id: string) => {
    const next = owned.includes(id) ? owned.filter((x) => x !== id) : [...owned, id];
    setOwned(next);
    try {
      localStorage.setItem(OWNED_KEY(artist.id), JSON.stringify(next));
    } catch {}
  };

  const albums: MockAlbum[] = useMemo(
    () =>
      data.albums.map((a) => {
        const [c1, c2] = coverColors[a.id] ?? fallbackColors(a.title);
        return {
          id: a.id,
          title: a.title,
          version: a.releaseType === "album" ? "정규" : a.releaseType === "ep" ? "미니" : "싱글",
          format: FORMAT[a.releaseType ?? ""] ?? "jewel",
          color: c1.startsWith("#") ? c1 : "#ff9cc2",
          color2: c2.startsWith("#") ? c2 : "#fff0f6",
          year: Number(a.releaseDate?.slice(0, 4)),
          releaseDate: a.releaseDate ?? undefined,
          coverUrl: a.coverUrl ?? undefined,
          owned: owned.includes(a.id),
        };
      }),
    [data.albums, coverColors, owned],
  );

  // 포카 도감: 최근 앨범 2장 × 멤버 (아직 보유 기록 없음 → 전부 빈 포켓)
  const cards: MockCard[] = useMemo(
    () =>
      data.albums
        .filter((a) => a.releaseType !== "single")
        .slice(-2)
        .reverse()
        .flatMap((al) =>
          members.map((m, i) => ({
            id: `${al.id}-${m.id}`,
            memberId: m.id,
            member: { name: shortName(m.name), color: PALETTE[i % PALETTE.length] },
            groupName: artist.nameEn?.toUpperCase() ?? artist.name,
            album: al.title,
            owned: false,
          })),
        ),
    [data.albums, members, artist],
  );

  const firstRelease = data.firstRelease;
  const debutMmdd = (artist.debutDate ?? firstRelease)?.slice(5);
  // 다가오는 기념일이 몇 주년인지: 그 기념일이 속한 해 - 데뷔 해
  const debutYears =
    now && firstRelease && debutMmdd
      ? new Date(now.getTime() + daysUntil(debutMmdd, now) * 864e5).getFullYear() - Number(firstRelease.slice(0, 4))
      : null;

  return (
    <main className="mx-auto min-h-svh w-full max-w-3xl overflow-x-hidden px-5 pb-16 pt-5" style={{ background: `linear-gradient(180deg, ${biasColor}26, transparent 360px)` }}>
      <header className="flex items-center justify-between">
        <Link href="/" className="font-black">
          오늘의 최애<span className="text-pink">.</span>
        </Link>
        <span className="text-xs text-ink-soft">실제 데이터 · 위키데이터·MusicBrainz·Deezer</span>
      </header>

      <div className="mt-5 flex items-end gap-2">
        <span className="rounded-t-2xl px-4 pb-2 pt-3 text-sm font-black text-white" style={{ background: biasColor }}>
          {artist.name} 방
        </span>
        <Link href="/onboarding/artist" className="rounded-t-2xl bg-paper/60 px-4 pb-2 pt-3 text-sm font-bold text-ink-soft">
          + 방 추가
        </Link>
      </div>

      {/* 오늘의 최애 카드 */}
      {bias && (
        <section className="rounded-3xl rounded-tl-none bg-paper p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full text-xl font-black text-white" style={{ background: `linear-gradient(160deg, ${biasColor}, #fff 160%)` }}>
              {shortName(bias.name)[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold" style={{ color: biasColor }}>
                오늘의 최애
              </p>
              <p className="text-2xl font-black">{bias.name}</p>
              <p className="text-xs text-ink-soft">
                {bias.nameEn} · {bias.birthDate?.replaceAll("-", ".")} 생
              </p>
            </div>
          </div>

          {bias.birthDate && now && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="다음 생일시" value={nextBirthdayTime(bias.birthDate.slice(5), now).label} sub={`${shortName(bias.name)}시까지 ${fmtMins(nextBirthdayTime(bias.birthDate.slice(5), now).mins)}`} dark />
              <Stat label="생일" value={`D-${daysUntil(bias.birthDate.slice(5), now)}`} sub={`${Number(bias.birthDate.slice(5, 7))}월 ${Number(bias.birthDate.slice(8))}일`} />
              {firstRelease && (
                <Stat
                  label="데뷔 기념일"
                  value={`D-${daysUntil(debutMmdd!, now)}`}
                  sub={`${debutYears}주년 · ${firstRelease.replaceAll("-", ".")}`}
                  badge={artist.debutDate ? undefined : "첫 발매 기준 · 확인 필요"}
                />
              )}
              <Stat label="앨범 선반" value={`${owned.length} / ${albums.length}`} sub="보유 / 전체 발매" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(artist.links).flatMap(([k, vs]) =>
              vs.slice(0, 1).map((v) => (
                <a key={k + v} href={linkUrl(k, v)} target="_blank" rel="noreferrer" className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold">
                  {LINK_LABEL[k] ?? k}
                </a>
              )),
            )}
          </div>
        </section>
      )}

      {/* 멤버별 생일시 */}
      <section className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {members.map((m, i) => (
          <Link
            key={m.id}
            href={`/room?artist=${artist.wikidataId}&bias=${m.wikidataId}`}
            className={`flex w-[88px] flex-none flex-col items-center rounded-2xl p-2.5 text-center ${m.id === bias?.id ? "bg-paper shadow ring-2" : "bg-paper/60"}`}
            style={m.id === bias?.id ? { ["--tw-ring-color" as string]: PALETTE[i % PALETTE.length] } : undefined}
          >
            <span className="h-10 w-10 rounded-full" style={{ background: `linear-gradient(160deg, ${PALETTE[i % PALETTE.length]}, #fff)` }} />
            <span className="mt-1 text-xs font-bold">{shortName(m.name)}</span>
            {m.birthDate && <span className="text-[10px] tabular-nums text-ink-soft">{birthTimes(m.birthDate)}</span>}
          </Link>
        ))}
      </section>

      <nav className="relative mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-paper p-1 shadow-sm">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="relative min-w-0 rounded-xl py-2.5 text-[11px] font-bold sm:text-xs">
            {tab === t.id && <motion.span layoutId="tab" className="absolute inset-0 rounded-xl" style={{ background: biasColor }} />}
            <span className={`relative ${tab === t.id ? "text-white" : "text-ink-soft"}`}>{t.label}</span>
          </button>
        ))}
      </nav>

      <motion.section key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        {tab === "shelf" && (
          <>
            <p className="mb-3 text-sm text-ink-soft">
              {albums.length}장 (정규·미니·싱글, 리믹스·일본어 버전 제외). <b className="text-ink">가지고 있는 앨범을 눌러서 보유로 바꿔보세요.</b>
            </p>
            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: Math.max(600, albums.length * 34) }}>
                <AlbumShelf albums={albums} perRow={albums.length} onToggleOwned={toggleOwned} />
              </div>
            </div>
          </>
        )}
        {tab === "binder" && (
          <>
            <p className="mb-3 text-sm text-ink-soft">최근 앨범 포카 도감이에요. 아직 등록한 포카가 없어서 전부 빈 포켓이에요.</p>
            <PhotocardBinder cards={cards} perPage={members.length > 4 ? 9 : 4} coverColor={biasColor} title={artist.nameEn?.toUpperCase() ?? artist.name} />
          </>
        )}
        {tab === "goods" && (
          <>
            <p className="mb-3 text-sm text-ink-soft">예시 데이터예요. 굿즈 등록 기능을 붙이면 내 굿즈로 바뀌어요.</p>
            <GoodsCabinet goods={GOODS} />
          </>
        )}
        {tab === "ledger" && (
          <>
            <p className="mb-3 text-sm text-ink-soft">예시 데이터예요. 영수증 인식을 붙이면 실제 지출로 바뀌어요.</p>
            <div className="flex justify-center">
              <ReceiptLedger items={RECEIPT} budget={150000} savedGoal={{ label: `${shortName(bias?.name ?? "")} 생일 적금`, saved: 23400, target: 50000 }} />
            </div>
          </>
        )}
      </motion.section>
    </main>
  );
}

/** "나오이 레이" → "레이"처럼 팬들이 부르는 이름 (일본인 멤버 성 생략) */
function shortName(name: string) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
function birthTimes(birth: string) {
  const [, m, d] = birth.split("-");
  return `${m}:${d} · ${String(Number(m) + 12).padStart(2, "0")}:${d}`;
}
function fmtMins(m: number) {
  const h = Math.floor(m / 60);
  return h ? `${h}시간 ${m % 60}분` : `${m}분`;
}

function Stat({ label, value, sub, dark, badge }: { label: string; value: string; sub: string; dark?: boolean; badge?: string }) {
  return (
    <div className={`rounded-2xl p-3 ${dark ? "bg-ink text-white" : "bg-cream"}`}>
      <p className={`text-[11px] font-bold ${dark ? "text-white/60" : "text-ink-soft"}`}>{label}</p>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className={`text-[11px] ${dark ? "text-white/70" : "text-ink-soft"}`}>{sub}</p>
      {badge && <p className="mt-1 inline-block rounded-full bg-butter/40 px-2 py-0.5 text-[10px] font-bold text-[#9a6b00]">{badge}</p>}
    </div>
  );
}
