import { GOODS_CATEGORIES, type GoodsCategory, type MockGoods } from "@/lib/mock";

/** 카테고리별 단순 일러스트 아이콘 (SVG) */
export function GoodsIcon({ category, color, size = 56 }: { category: GoodsCategory; color: string; size?: number }) {
  const s = { width: size, height: size };
  switch (category) {
    case "lightstick":
      return (
        <svg viewBox="0 0 60 60" style={s} aria-hidden>
          <circle cx="30" cy="20" r="15" fill={color} opacity="0.25" />
          <circle cx="30" cy="20" r="11" fill={color} />
          <circle cx="26" cy="16" r="3" fill="#fff" opacity="0.8" />
          <rect x="27" y="31" width="6" height="25" rx="3" fill="#3a3346" />
        </svg>
      );
    case "doll":
      return (
        <svg viewBox="0 0 60 60" style={s} aria-hidden>
          <circle cx="18" cy="14" r="6" fill={color} />
          <circle cx="42" cy="14" r="6" fill={color} />
          <circle cx="30" cy="26" r="15" fill={color} />
          <ellipse cx="30" cy="48" rx="13" ry="10" fill={color} />
          <circle cx="25" cy="25" r="2" fill="#2a2233" />
          <circle cx="35" cy="25" r="2" fill="#2a2233" />
          <ellipse cx="30" cy="31" rx="3" ry="2" fill="#fff" />
        </svg>
      );
    case "keyring":
      return (
        <svg viewBox="0 0 60 60" style={s} aria-hidden>
          <circle cx="30" cy="10" r="6" fill="none" stroke="#b9b2c8" strokeWidth="3" />
          <path d="M30 16 L30 22" stroke="#b9b2c8" strokeWidth="3" />
          <path d="M30 24 l10 7 -4 12 h-12 l-4 -12z" fill={color} />
          <path d="M30 24 l10 7 -4 12 h-12 l-4 -12z" fill="#fff" opacity="0.35" transform="translate(2 2) scale(.9)" />
        </svg>
      );
    case "slogan":
      return (
        <svg viewBox="0 0 60 60" style={s} aria-hidden>
          <rect x="4" y="18" width="52" height="22" rx="4" fill={color} />
          <rect x="10" y="25" width="26" height="4" rx="2" fill="#fff" />
          <rect x="10" y="32" width="16" height="3" rx="1.5" fill="#fff" opacity="0.7" />
          <circle cx="46" cy="29" r="5" fill="#fff" opacity="0.8" />
        </svg>
      );
    case "poster":
      return (
        <svg viewBox="0 0 60 60" style={s} aria-hidden>
          <rect x="14" y="6" width="32" height="46" rx="3" fill={color} />
          <circle cx="30" cy="22" r="8" fill="#fff" opacity="0.7" />
          <rect x="19" y="36" width="22" height="3" rx="1.5" fill="#fff" />
          <rect x="22" y="42" width="16" height="3" rx="1.5" fill="#fff" opacity="0.7" />
        </svg>
      );
    case "season":
      return (
        <svg viewBox="0 0 60 60" style={s} aria-hidden>
          <rect x="8" y="16" width="44" height="34" rx="5" fill={color} />
          <rect x="8" y="16" width="44" height="10" rx="5" fill="#2a2233" opacity="0.15" />
          <rect x="16" y="10" width="4" height="10" rx="2" fill="#3a3346" />
          <rect x="40" y="10" width="4" height="10" rx="2" fill="#3a3346" />
          <text x="30" y="43" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">26</text>
        </svg>
      );
  }
}

type Props = { goods: MockGoods[]; className?: string };

/** 카테고리별 진열장. 각 아이템은 data-goods로 랜딩 애니메이션에서 잡음 */
export default function GoodsCabinet({ goods, className = "" }: Props) {
  return (
    <div className={`cabinet grid grid-cols-2 gap-3 sm:grid-cols-3 ${className}`} data-cabinet>
      {GOODS_CATEGORIES.map((cat) => {
        const items = goods.filter((g) => g.category === cat.id);
        return (
          <div key={cat.id} className="cabinet-cell" data-cabinet-cell={cat.id}>
            <p className="mb-2 text-xs font-bold text-ink-soft">
              {cat.label} <span className="text-ink-soft/60">{items.length}</span>
            </p>
            <div className="flex flex-wrap items-end gap-2">
              {items.map((g) => (
                <div key={g.id} data-goods className="flex w-[64px] flex-col items-center text-center">
                  <GoodsIcon category={g.category} color={g.color} />
                  <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-ink">{g.name}</p>
                </div>
              ))}
            </div>
            <div className="cabinet-glass" />
          </div>
        );
      })}
    </div>
  );
}
