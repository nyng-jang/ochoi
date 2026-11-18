import type { MetadataRoute } from "next";

// 홈 화면에 추가(PWA)해야 아이폰에서 생일시·일정 푸시를 받을 수 있음
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "오늘의 최애",
    short_name: "오최",
    description: "최애 일정, 덕질 가계부, 앨범 선반과 포카 바인더를 한곳에",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7fb",
    theme_color: "#ff6fa8",
    lang: "ko",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
