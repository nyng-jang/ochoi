import { NextResponse, type NextRequest } from "next/server";
import { searchArtists } from "@/lib/sources/wikidata";

// GET /api/artists/search?q=블랙핑크
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    const results = await searchArtists(q);
    // 그룹을 먼저 보여준다 (멤버는 그룹을 고른 뒤 선택하는 흐름이 더 정확함)
    results.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "group" ? -1 : 1));
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
