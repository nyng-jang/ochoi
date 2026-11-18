"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import SmoothScroll from "@/components/SmoothScroll";
import AlbumShelf, { Spine } from "@/components/room/AlbumShelf";
import PhotocardBinder from "@/components/room/PhotocardBinder";
import GoodsCabinet, { GoodsIcon } from "@/components/room/GoodsCabinet";
import ReceiptLedger, { Receipt } from "@/components/room/ReceiptLedger";
import { ALBUMS, ARTISTS, CARDS, GOODS, MONTHLY_BUDGET, RECEIPT, TIMELINE } from "@/lib/mock";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-pink">
      <span className="rounded-full bg-pink px-2 py-0.5 text-[10px] tracking-normal text-white">{n}</span>
      {children}
    </p>
  );
}

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(root);

      // 01 히어로: 알림이 하나씩 떨어짐
      gsap.from(q("[data-noti]"), { y: -40, opacity: 0, scale: 0.92, duration: 0.7, stagger: 0.35, ease: "back.out(1.6)", delay: 0.3 });
      gsap.from(q("[data-hero-line]"), { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" });
      gsap.to(q("[data-float]"), { y: -14, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.4 });

      // 02 오늘의 덕질 요약: 고정된 채로 카드가 차례로 등장
      gsap
        .timeline({ scrollTrigger: { trigger: "#summary", start: "top top", end: "+=140%", scrub: 0.8, pin: true } })
        .from(q("#summary [data-sum]"), { y: 120, opacity: 0, rotate: (i) => [-6, 4, -3][i], stagger: 0.5, ease: "power2.out" })
        .from(q("#summary [data-sum-fill]"), { scaleX: 0, transformOrigin: "left", ease: "none" }, "<0.6");

      // 03 나의 덕질 방: 가로로 펼쳐짐
      const track = q("#room [data-track]")[0] as HTMLElement;
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: { trigger: "#room", start: "top top", end: () => `+=${track.scrollWidth - window.innerWidth}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
      });

      // 04 앨범 선반: 좌우에서 날아와 하나씩 꽂힘. 미보유는 반투명으로 남음
      const spines = q("#shelf [data-spine]") as HTMLElement[];
      gsap
        .timeline({ scrollTrigger: { trigger: "#shelf", start: "top top", end: "+=220%", scrub: 0.8, pin: true } })
        .fromTo(
          spines,
          { x: (i) => (i % 2 ? 1 : -1) * (window.innerWidth * 0.7), y: -120, rotate: (i) => (i % 2 ? 1 : -1) * 35, opacity: 0 },
          { x: 0, y: 0, rotate: 0, opacity: (i, el: HTMLElement) => (el.dataset.owned === "true" ? 1 : 0.32), stagger: 0.35, ease: "power3.out" },
        )
        .from(q("#shelf [data-shelf-note]"), { y: 20, opacity: 0, duration: 0.6 });

      // 05 포카 바인더: 표지가 열리고 포카가 포켓에 들어감 → 페이지 넘김
      gsap.set(q("#binder [data-binder-cover]"), { rotateY: 0 });
      gsap
        .timeline({ scrollTrigger: { trigger: "#binder", start: "top top", end: "+=260%", scrub: 0.8, pin: true } })
        .to(q("#binder [data-binder-cover]"), { rotateY: -180, duration: 1.2, ease: "power2.inOut" })
        .from(q("#binder [data-card]"), { y: -160, x: 40, rotate: 18, opacity: 0, stagger: 0.3, ease: "power3.out" })
        .fromTo(q("#binder [data-leaf]"), { rotateY: 0, opacity: 0 }, { rotateY: -180, opacity: 1, duration: 1.2, ease: "power2.inOut" })
        .to(q("#binder [data-leaf]"), { opacity: 0, duration: 0.2 })
        .from(q("#binder [data-binder-note]"), { y: 20, opacity: 0, duration: 0.6 }, "<");

      // 06 굿즈 진열장: 공중에서 떨어져 칸에 정렬
      gsap
        .timeline({ scrollTrigger: { trigger: "#goods", start: "top top", end: "+=180%", scrub: 0.8, pin: true } })
        .fromTo(
          q("#goods [data-goods]"),
          { y: () => -window.innerHeight * 0.8, x: () => gsap.utils.random(-160, 160), rotate: () => gsap.utils.random(-120, 120), opacity: 0 },
          { y: 0, x: 0, rotate: 0, opacity: 1, stagger: 0.3, ease: "bounce.out" },
        );

      // 07 가계부: 영수증 → 스캔 → 내역 채우기 → 남은 예산 계산
      const counter = q("#ledger [data-count]")[0] as HTMLElement;
      const num = { v: Number(counter.dataset.countFrom) };
      counter.textContent = num.v.toLocaleString("ko-KR");
      gsap
        .timeline({ scrollTrigger: { trigger: "#ledger", start: "top top", end: "+=240%", scrub: 0.8, pin: true } })
        .from(q("#ledger [data-receipt]"), { x: 260, y: -60, rotate: 25, opacity: 0, duration: 1 })
        .to(q("#ledger [data-scan]"), { opacity: 1, duration: 0.1 })
        .fromTo(q("#ledger [data-scan]"), { y: 0 }, { y: 260, duration: 1, ease: "none" })
        .to(q("#ledger [data-scan]"), { opacity: 0, duration: 0.1 })
        .from(q("#ledger [data-row]"), { x: -60, opacity: 0, stagger: 0.35 })
        .from(q("#ledger [data-bar]"), { width: 0, duration: 1, ease: "power2.out" }, "<0.4")
        .to(num, { v: Number(counter.dataset.count), duration: 1, ease: "power2.out", onUpdate: () => (counter.textContent = Math.round(num.v).toLocaleString("ko-KR")) }, "<")
        .from(q("#ledger [data-piggy]"), { width: 0, duration: 0.8 });

      // 08 캘린더와 타임캡슐: 선이 그려지며 추억이 시간순으로
      gsap.from(q("#timeline [data-line]"), { scaleY: 0, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: "#timeline [data-tl]", start: "top 70%", end: "bottom 60%", scrub: true } });
      (q("#timeline [data-tl-item]") as HTMLElement[]).forEach((el, i) => {
        gsap.from(el, { x: i % 2 ? 60 : -60, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } });
      });
    },
    { scope: root },
  );

  return (
    <SmoothScroll>
      <div ref={root} className="overflow-x-clip">
        {/* 헤더 */}
        <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur-md md:px-10">
          <Link href="/" className="text-lg font-black tracking-tight">
            오늘의 최애<span className="text-pink">.</span>
          </Link>
          <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
            시작하기
          </Link>
        </header>

        {/* 01 히어로 */}
        <section className="relative flex min-h-svh items-center px-6 pt-20 md:px-16">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_80%_20%,#ffd6e6_0%,transparent_70%),radial-gradient(50%_50%_at_10%_90%,#e4ddff_0%,transparent_70%)]" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <Eyebrow n="01">FOR EVERY FAN</Eyebrow>
              <h1 className="text-4xl font-black leading-[1.15] md:text-6xl">
                <span data-hero-line className="block">최애의 오늘을</span>
                <span data-hero-line className="block">
                  가장 먼저 <span className="text-pink">챙겨요</span>
                </span>
              </h1>
              <p data-hero-line className="mt-5 max-w-md text-ink-soft md:text-lg">
                컴백 일정, 생일시, 덕질 예산부터 앨범·포카·굿즈까지. 아티스트만 고르면 나머지는 알아서 정리돼요.
              </p>
              <div data-hero-line className="mt-8 flex gap-3">
                <Link href="/login" className="rounded-2xl bg-pink px-6 py-3.5 font-bold text-white shadow-lg shadow-pink/30">
                  내 덕질 방 만들기
                </Link>
                <a href="#summary" className="rounded-2xl bg-paper px-6 py-3.5 font-bold shadow">
                  둘러보기
                </a>
              </div>
            </div>

            {/* 폰 잠금화면 + 알림 미리보기 */}
            <div className="relative mx-auto w-[300px]">
              <div data-float className="absolute -left-10 top-10 h-16 w-16 rounded-full bg-butter/70 blur-sm" />
              <div data-float className="absolute -right-6 bottom-16 h-12 w-12 rounded-full bg-sky/60 blur-sm" />
              <div className="relative h-[600px] rounded-[48px] bg-ink p-3 shadow-2xl">
                <div className="h-full overflow-hidden rounded-[38px] bg-gradient-to-b from-[#ffb3cf] via-[#c9b8ff] to-[#9b8cff] px-4 pt-14">
                  <p className="text-center text-sm font-semibold text-white/80">11월 18일 수요일</p>
                  <p className="text-center text-7xl font-light text-white">5:16</p>
                  <div className="mt-8 space-y-2.5">
                    {[
                      { t: "지금은 하린시예요", d: "05:16 · 오늘 출석 도장 23일째", c: "#ff8fb8" },
                      { t: "LUMI 리패키지 MV 공개 D-7", d: "11/25 오후 6시 · 캘린더에 추가됨", c: "#9b8cff" },
                      { t: "새 일정 1개가 추가됐어요", d: "연말 시상식 출연 확정 (기사 3건)", c: "#5cc8ff" },
                      { t: "이번 달 덕질 예산 12,700원 남음", d: "생일카페 영수증이 기록됐어요", c: "#ffb347" },
                    ].map((n) => (
                      <div key={n.t} data-noti className="flex gap-3 rounded-2xl bg-white/85 p-3 shadow-sm backdrop-blur">
                        <span className="mt-1 h-7 w-7 flex-none rounded-lg" style={{ background: n.c }} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{n.t}</p>
                          <p className="truncate text-[11px] text-ink-soft">{n.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 오늘의 덕질 요약 */}
        <section id="summary" className="flex min-h-svh items-center px-6 md:px-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.3fr]">
            <div>
              <Eyebrow n="02">TODAY</Eyebrow>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                아침마다
                <br />
                오늘의 덕질을 한 장으로
              </h2>
              <p className="mt-4 text-ink-soft">일정, 남은 예산, 다음 생일시까지. 뉴스와 공식 채널에서 알아서 모아와요.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div data-sum className="rounded-3xl bg-paper p-5 shadow-lg">
                <p className="text-xs font-bold text-ink-soft">오늘 일정</p>
                <p className="mt-3 text-3xl font-black">2개</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 rounded-full bg-lilac" />18:00 음악방송 출연</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 rounded-full bg-pink" />20:00 위버스 라이브</li>
                </ul>
                <p className="mt-3 rounded-full bg-mint/20 px-2 py-1 text-center text-[11px] font-bold text-[#2f8f6a]">새 일정 1개 · 중복 3건 걸러짐</p>
              </div>
              <div data-sum className="rounded-3xl bg-paper p-5 shadow-lg">
                <p className="text-xs font-bold text-ink-soft">남은 예산</p>
                <p className="mt-3 text-3xl font-black text-pink">12,700원</p>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-line">
                  <div data-sum-fill className="h-full w-[92%] rounded-full bg-gradient-to-r from-pink to-lilac" />
                </div>
                <p className="mt-2 text-[11px] text-ink-soft">150,000원 중 92% 사용</p>
              </div>
              <div data-sum className="rounded-3xl bg-ink p-5 text-white shadow-lg">
                <p className="text-xs font-bold text-white/60">다음 생일시</p>
                <p className="mt-3 text-3xl font-black">17:16</p>
                <p className="mt-1 text-sm text-white/80">하린시까지 2시간 14분</p>
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className={`h-6 flex-1 rounded-md ${i < 5 ? "bg-pink" : "bg-white/15"}`} />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-white/60">이번 주 출석 도장 5/7</p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 나의 덕질 방 (가로 스크롤) */}
        <section id="room" className="relative h-svh overflow-hidden bg-[#fff1f6]">
          <div data-track className="flex h-full w-max items-center gap-8 px-6 md:px-16">
            <div className="w-[80vw] max-w-md flex-none">
              <Eyebrow n="03">MY ROOM</Eyebrow>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                아티스트마다
                <br />
                나만의 방이 생겨요
              </h2>
              <p className="mt-4 text-ink-soft">방마다 아티스트 컬러로 꾸며지고, 앨범 선반·포카 바인더·굿즈 진열장이 들어 있어요.</p>
              <div className="mt-6 flex gap-2">
                {ARTISTS.map((a) => (
                  <span key={a.id} className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: a.color }}>
                    {a.name} 방
                  </span>
                ))}
              </div>
            </div>
            {[
              { t: "앨범 선반", d: "발매순 · 색깔순으로 꽂아요", node: <AlbumShelf albums={ALBUMS.slice(0, 8)} interactive={false} /> },
              { t: "포카 바인더", d: "빈 포켓은 미보유 도감", node: (
                <div className="grid grid-cols-4 gap-2 rounded-2xl bg-paper p-3">
                  {CARDS.slice(0, 8).map((c) => (
                    <div key={c.id} className="aspect-[55/85] rounded-md" style={{ background: c.owned ? `linear-gradient(160deg, ${ARTISTS[0].members.find((m) => m.id === c.memberId)?.color}, #fff)` : "#f1eef6" }} />
                  ))}
                </div>
              ) },
              { t: "굿즈 진열장", d: "응원봉부터 시즌그리팅까지", node: (
                <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-paper p-4">
                  {GOODS.slice(0, 6).map((g) => (
                    <GoodsIcon key={g.id} category={g.category} color={g.color} size={64} />
                  ))}
                </div>
              ) },
            ].map((p) => (
              <div key={p.t} className="flex h-[70vh] w-[82vw] max-w-xl flex-none flex-col justify-between rounded-[36px] p-6 shadow-xl md:p-8" style={{ background: "linear-gradient(180deg,#ffffff,#fff6fa)" }}>
                <div>
                  <p className="text-2xl font-black">{p.t}</p>
                  <p className="text-sm text-ink-soft">{p.d}</p>
                </div>
                <div className="pointer-events-none">{p.node}</div>
              </div>
            ))}
            <div className="w-[10vw] flex-none" />
          </div>
        </section>

        {/* 04 앨범 선반 */}
        <section id="shelf" className="flex min-h-svh items-center px-6 md:px-16">
          <div className="mx-auto w-full max-w-5xl">
            <Eyebrow n="04">ALBUM SHELF</Eyebrow>
            <h2 className="text-3xl font-black md:text-5xl">앨범이 책장에 꽂혀요</h2>
            <p className="mt-3 text-ink-soft">포토북은 두껍게, 플랫폼 앨범은 얇게. 책등을 누르면 앨범을 꺼내 볼 수 있어요.</p>
            <div className="mt-8 overflow-x-auto pb-2">
              <div className="min-w-[620px]">
                <AlbumShelf albums={ALBUMS} />
              </div>
            </div>
            <p data-shelf-note className="mt-4 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-semibold shadow">
              <span className="inline-block h-4 w-2 rounded-sm bg-ink/20 outline outline-1 outline-dashed outline-ink/40" />
              반투명 책등 = 아직 없는 버전 (4개)
            </p>
          </div>
        </section>

        {/* 05 포카 바인더 */}
        <section id="binder" className="flex min-h-svh items-center bg-[#f5f2ff] px-6 md:px-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.4fr]">
            <div>
              <Eyebrow n="05">PHOTOCARD BINDER</Eyebrow>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                바인더를 펼치면
                <br />
                포카가 한 장씩
              </h2>
              <p className="mt-4 text-ink-soft">사진을 찍으면 포카 비율로 잘라 멤버·앨범 태그까지 추천해요. 럭드·특전은 홀로그램으로 반짝여요.</p>
              <p data-binder-note className="mt-6 inline-block rounded-full bg-paper px-4 py-2 text-sm font-semibold shadow">
                12장 중 9장 보유 · 빈 포켓 3칸
              </p>
            </div>
            <div className="relative" style={{ perspective: 1800 }}>
              <PhotocardBinder cards={CARDS} coverColor={ARTISTS[0].color} title="LUMI" />
              {/* 페이지 넘김 연출용 낱장 */}
              <div
                data-leaf
                className="pointer-events-none absolute right-0 top-0 h-[calc(100%-56px)] w-1/2 rounded-r-2xl border border-[#e3e1ec] bg-gradient-to-r from-[#eceaf4] to-[#fbfbfd] opacity-0"
                style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
              />
            </div>
          </div>
        </section>

        {/* 06 굿즈 진열장 */}
        <section id="goods" className="flex min-h-svh items-center px-6 md:px-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.5fr]">
            <div>
              <Eyebrow n="06">GOODS CABINET</Eyebrow>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                굿즈는
                <br />
                칸마다 착착
              </h2>
              <p className="mt-4 text-ink-soft">응원봉, 인형, 키링, 슬로건까지 종류별로 정리하고 보관 위치도 적어둘 수 있어요. 무료 특전은 0원으로.</p>
            </div>
            <GoodsCabinet goods={GOODS} />
          </div>
        </section>

        {/* 07 가계부와 저금통 */}
        <section id="ledger" className="flex min-h-svh items-center bg-[#fffaf0] px-6 md:px-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_auto_1fr]">
            <div>
              <Eyebrow n="07">BUDGET</Eyebrow>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                영수증 한 장이면
                <br />
                가계부 끝
              </h2>
              <p className="mt-4 text-ink-soft">영수증 사진이나 결제 화면 캡처를 올리면 AI가 날짜·금액·품목을 읽어 채우고, 남은 예산을 바로 계산해요.</p>
            </div>
            <div className="flex justify-center">
              <Receipt items={RECEIPT} />
            </div>
            <ReceiptLedger items={RECEIPT} budget={MONTHLY_BUDGET} savedGoal={{ label: "하린 생일 적금", saved: 23400, target: 50000 }} />
          </div>
        </section>

        {/* 08 캘린더와 타임캡슐 */}
        <section id="timeline" className="px-6 py-28 md:px-16">
          <div className="mx-auto max-w-3xl">
            <Eyebrow n="08">TIME CAPSULE</Eyebrow>
            <h2 className="text-3xl font-black md:text-5xl">날짜와 추억이 시간순으로</h2>
            <p className="mt-3 text-ink-soft">N년 전 오늘 공식 영상, 기념일, 내가 다녀온 콘서트, 다가오는 일정을 한 줄에.</p>
            <div data-tl className="relative mt-14">
              <div data-line className="absolute bottom-0 left-4 top-0 w-1 rounded-full bg-gradient-to-b from-pink via-lilac to-sky md:left-1/2 md:-translate-x-1/2" />
              <ol className="space-y-10">
                {TIMELINE.map((t, i) => (
                  <li key={t.date} data-tl-item className={`relative pl-12 md:w-1/2 md:pl-0 ${i % 2 ? "md:ml-auto md:pl-10" : "md:pr-10 md:text-right"}`}>
                    <span className={`absolute left-[9px] top-3 h-4 w-4 rounded-full border-4 border-cream bg-pink md:left-auto ${i % 2 ? "md:-left-2" : "md:-right-2"}`} />
                    <div className="rounded-3xl bg-paper p-5 shadow-md">
                      <p className="text-xs font-bold text-pink">{t.kind}</p>
                      <p className="mt-1 text-lg font-black">{t.label}</p>
                      <p className="text-sm text-ink-soft">
                        {t.date} · {t.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 09 CTA */}
        <section className="px-6 pb-24 md:px-16">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[40px] bg-ink px-8 py-16 text-center text-white md:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_20%_0%,rgba(255,111,168,.45),transparent),radial-gradient(40%_60%_at_90%_100%,rgba(155,140,255,.45),transparent)]" />
            <div className="relative flex justify-center gap-1.5">
              {ALBUMS.slice(0, 6).map((a) => (
                <div key={a.id} className="pointer-events-none origin-bottom scale-75">
                  <Spine album={{ ...a, owned: true }} />
                </div>
              ))}
            </div>
            <p className="relative mt-2 text-xs font-bold tracking-[0.2em] text-pink">09 · START</p>
            <h2 className="relative mt-3 text-3xl font-black md:text-5xl">나만의 덕질 방 만들기</h2>
            <p className="relative mt-3 text-white/70">아티스트를 고르면 생일·데뷔일·앨범이 자동으로 채워져요.</p>
            <motion.div className="relative mt-8 inline-block" whileHover={{ scale: 1.05, rotate: -1 }} whileTap={{ scale: 0.97 }}>
              <Link href="/login" className="inline-block rounded-2xl bg-pink px-8 py-4 text-lg font-black text-white shadow-lg shadow-pink/40">
                무료로 시작하기
              </Link>
            </motion.div>
          </div>
          <p className="mt-8 text-center text-xs text-ink-soft">목업 화면 · 등장하는 아티스트와 앨범은 모두 가상의 예시예요.</p>
        </section>
      </div>
    </SmoothScroll>
  );
}
