"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Spine } from "@/components/room/AlbumShelf";
import { ALBUMS } from "@/lib/mock";

export default function LoginPage() {
  const router = useRouter();
  const go = () => router.push("/onboarding");

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-between overflow-hidden px-6 pb-10 pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_10%,#ffd6e6_0%,transparent_70%)]" />

      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* 미니 선반 로고 */}
        <div className="flex items-end gap-1 rounded-b-md border-b-[6px] border-wood-dark px-3">
          {ALBUMS.slice(0, 7).map((a, i) => (
            <motion.div
              key={a.id}
              className="pointer-events-none origin-bottom scale-[0.55]"
              initial={{ y: -80, opacity: 0, rotate: i % 2 ? 20 : -20 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.1 * i, type: "spring", stiffness: 220, damping: 14 }}
            >
              <Spine album={{ ...a, owned: true }} />
            </motion.div>
          ))}
        </div>
        <h1 className="mt-8 text-3xl font-black">
          오늘의 최애<span className="text-pink">.</span>
        </h1>
        <p className="mt-2 text-ink-soft">
          최애의 오늘을 가장 먼저 챙기는
          <br />
          나만의 덕질 방
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button onClick={go} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-4 font-bold text-[#191919]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#191919" d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7S17 4 12 4z" />
          </svg>
          카카오로 시작하기
        </button>
        <button onClick={go} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-paper py-4 font-bold shadow-sm ring-1 ring-line">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z" />
            <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7C4.4 19.7 7.9 22 12 22z" />
            <path fill="#FBBC05" d="M6.2 13.6c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.3H2.7C2 8.7 1.6 10.3 1.6 12s.4 3.3 1.1 4.7l3.5-3.1z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3C17.2 2.8 14.8 1.9 12 1.9 7.9 1.9 4.4 4.3 2.7 7.6l3.5 2.7C7 7.7 9.3 5.9 12 5.9z" />
          </svg>
          Google로 시작하기
        </button>
        <button onClick={go} className="w-full rounded-2xl bg-ink py-4 font-bold text-white">
          Apple로 시작하기
        </button>
        <p className="pt-2 text-center text-xs text-ink-soft">
          목업 화면이라 어떤 버튼을 눌러도 다음 단계로 넘어가요.{" "}
          <Link href="/" className="underline">
            처음으로
          </Link>
        </p>
      </div>
    </main>
  );
}
