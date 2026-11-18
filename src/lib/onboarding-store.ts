"use client";

// 목업용 온보딩 상태 (sessionStorage). 실제 서비스에서는 Supabase user_artists로 대체
export type OnboardingState = {
  artistIds: string[];
  bias: Record<string, string>; // artistId → memberId
  budget: number;
  birthdayAlerts: string[]; // memberId
};

const KEY = "ochoi-onboarding";
const DEFAULT: OnboardingState = { artistIds: [], bias: {}, budget: 150000, birthdayAlerts: [] };

export function loadOnboarding(): OnboardingState {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function saveOnboarding(patch: Partial<OnboardingState>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...loadOnboarding(), ...patch }));
  } catch {
    // 저장이 안 되는 환경(시크릿 모드 등)에서는 그냥 넘어감
  }
}
