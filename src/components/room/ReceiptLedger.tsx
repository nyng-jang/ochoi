import type { MockExpense } from "@/lib/mock";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 영수증 카드. data-scan 줄은 랜딩에서 위아래로 훑는 연출에 사용 */
export function Receipt({ items }: { items: MockExpense[] }) {
  const total = items.reduce((s, e) => s + e.amount, 0);
  return (
    <div data-receipt className="relative w-60 rotate-[-3deg] rounded-t-md bg-paper px-5 pb-8 pt-5 font-mono text-[11px] text-ink shadow-xl">
      <p className="text-center text-xs font-bold tracking-widest">RECEIPT</p>
      <p className="mb-3 text-center text-[10px] text-ink-soft">2026.11.14 - 11.17</p>
      <div className="space-y-1.5 border-y border-dashed border-ink/30 py-3">
        {items.map((e) => (
          <div key={e.id} className="flex justify-between gap-2">
            <span className="truncate">{e.item}</span>
            <span>{e.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{total.toLocaleString()}</span>
      </div>
      <div data-scan className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-pink/0 via-pink/35 to-pink/0 opacity-0" />
      {/* 지그재그 하단 */}
      <div
        className="absolute inset-x-0 -bottom-2 h-3 bg-paper"
        style={{ clipPath: "polygon(0 0,5% 100%,10% 0,15% 100%,20% 0,25% 100%,30% 0,35% 100%,40% 0,45% 100%,50% 0,55% 100%,60% 0,65% 100%,70% 0,75% 100%,80% 0,85% 100%,90% 0,95% 100%,100% 0)" }}
      />
    </div>
  );
}

type Props = { items: MockExpense[]; budget: number; savedGoal?: { label: string; saved: number; target: number } };

/** 가계부 카드: 지출 행 + 예산 막대 + 저금통. 숫자는 data-count로 랜딩에서 카운트 애니메이션 */
export default function ReceiptLedger({ items, budget, savedGoal }: Props) {
  const spent = items.reduce((s, e) => s + e.amount, 0);
  const left = budget - spent;
  return (
    <div className="w-full max-w-sm rounded-3xl bg-paper p-5 shadow-[0_24px_60px_-30px_rgba(80,40,90,.5)]" data-ledger>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">11월 덕질 가계부</p>
        <p className="text-xs text-ink-soft">예산 {won(budget)}</p>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((e) => (
          <li key={e.id} data-row className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2.5">
            <span className="w-10 text-[11px] text-ink-soft">{e.date}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.item}</p>
              <p className="text-[11px] text-ink-soft">
                {e.category} · {e.merchant}
              </p>
            </div>
            <span className="text-sm font-bold tabular-nums">-{e.amount.toLocaleString()}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs text-ink-soft">남은 예산</p>
          <p className="text-2xl font-black tabular-nums text-pink">
            <span data-count={left} data-count-from={budget}>
              {left.toLocaleString("ko-KR")}
            </span>
            원
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-line">
          <div data-bar className="h-full rounded-full bg-gradient-to-r from-pink to-lilac" style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
        </div>
        <p className="mt-1 text-right text-[11px] text-ink-soft">
          {Math.round((spent / budget) * 100)}% 사용 · {won(spent)}
        </p>
      </div>

      {savedGoal && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-butter/25 p-3">
          <svg viewBox="0 0 48 40" className="h-10 w-12 flex-none" aria-hidden>
            <ellipse cx="24" cy="22" rx="18" ry="14" fill="#ff9cc2" />
            <circle cx="38" cy="20" r="6" fill="#ff8fb8" />
            <circle cx="40" cy="19" r="1.2" fill="#2a2233" />
            <rect x="20" y="7" width="10" height="3" rx="1.5" fill="#2a2233" opacity=".6" />
            <rect x="12" y="32" width="5" height="6" rx="2" fill="#ff8fb8" />
            <rect x="28" y="32" width="5" height="6" rx="2" fill="#ff8fb8" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-bold">{savedGoal.label}</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
              <div data-piggy className="h-full rounded-full bg-butter" style={{ width: `${(savedGoal.saved / savedGoal.target) * 100}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-ink-soft">
              {won(savedGoal.saved)} / {won(savedGoal.target)} · 폐지줍기로 모으는 중
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
