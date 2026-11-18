"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Receipt } from "@/components/room/ReceiptLedger";
import { RECEIPT } from "@/lib/mock";

const SLIDES = [
  {
    title: "아티스트만 고르면\n나머지는 알아서",
    body: "멤버, 생일, 앨범, 공식 채널까지 자동으로 불러와요. 틀린 정보는 팬들이 함께 고쳐요.",
    art: (
      <div className="space-y-2">
        {["멤버 5명", "생일 5개 → 생일시 10개", "앨범 12장", "공식 링크 6개"].map((t, i) => (
          <motion.div
            key={t}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 shadow"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-black text-white">✓</span>
            <span className="font-semibold">{t}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "영수증 한 장으로\n덕질 가계부",
    body: "영수증 사진이나 결제 화면 캡처를 올리면 금액과 품목을 읽어 기록해요.",
    art: (
      <div className="flex justify-center">
        <Receipt items={RECEIPT.slice(0, 3)} />
      </div>
    ),
  },
  {
    title: "생일시도\n놓치지 않게",
    body: "5월 16일생 멤버라면 매일 05:16, 17:16에 알려줘요. 홈 화면에 추가하면 푸시를 받을 수 있어요.",
    art: (
      <div className="mx-auto w-64 rounded-[28px] bg-ink p-5 text-center text-white shadow-xl">
        <p className="text-6xl font-light">5:16</p>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="mt-4 rounded-2xl bg-white/90 p-3 text-left text-ink"
        >
          <p className="text-sm font-bold">지금은 하린시예요</p>
          <p className="text-xs text-ink-soft">출석 도장 찍고 연속 기록 이어가기</p>
        </motion.div>
      </div>
    ),
  },
];

export default function OnboardingIntro() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const next = () => (last ? router.push("/onboarding/artist") : setI(i + 1));

  return (
    <main className="mx-auto w-full flex min-h-svh max-w-md flex-col px-6 pb-10 pt-6">
      <div className="flex justify-end">
        <button onClick={() => router.push("/onboarding/artist")} className="text-sm font-semibold text-ink-soft">
          건너뛰기
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.35 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) next();
              if (info.offset.x > 60 && i > 0) setI(i - 1);
            }}
            className="flex h-full flex-col"
          >
            <div className="flex min-h-[340px] items-center justify-center py-8">{SLIDES[i].art}</div>
            <h1 className="whitespace-pre-line text-3xl font-black leading-tight">{SLIDES[i].title}</h1>
            <p className="mt-3 text-ink-soft">{SLIDES[i].body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-1.5">
          {SLIDES.map((_, k) => (
            <span key={k} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-pink" : "w-2 bg-line"}`} />
          ))}
        </div>
        <button onClick={next} className="rounded-2xl bg-ink px-6 py-3.5 font-bold text-white">
          {last ? "아티스트 고르기" : "다음"}
        </button>
      </div>
    </main>
  );
}
