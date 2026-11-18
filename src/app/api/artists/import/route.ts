import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { importArtist } from "@/lib/artists/import";

// POST /api/artists/import  { "wikidataId": "Q25056945" }
// 로그인한 사용자만 호출 가능. 공유 테이블 쓰기는 서버 키로 처리하고, 내 아티스트 목록에 추가한다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const { wikidataId } = (await request.json()) as { wikidataId?: string };
  if (!wikidataId || !/^Q\d+$/.test(wikidataId)) {
    return NextResponse.json({ error: "wikidataId 형식이 올바르지 않아요" }, { status: 400 });
  }

  try {
    const artistId = await importArtist(createServiceClient(), wikidataId);
    await supabase.from("user_artists").upsert({ user_id: user.id, artist_id: artistId });
    return NextResponse.json({ artistId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
