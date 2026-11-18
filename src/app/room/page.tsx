import { Suspense } from "react";
import { getRoomData } from "@/lib/artists/queries";
import RoomView from "./RoomView";

// 기본: IVE(Q109375061) 방, 최애 장원영(Q56476186). ?artist=Q...&bias=Q... 로 바꿀 수 있음
const DEFAULT_ARTIST = "Q109375061";
const DEFAULT_BIAS = "Q56476186";

async function RoomData({ searchParams }: { searchParams: Promise<{ artist?: string; bias?: string }> }) {
  const sp = await searchParams;
  const data = await getRoomData(sp.artist ?? DEFAULT_ARTIST);
  if (!data) return <p className="p-10 text-center text-ink-soft">아직 등록되지 않은 아티스트예요.</p>;
  return <RoomView data={data} biasWikidataId={sp.bias ?? DEFAULT_BIAS} />;
}

export default function RoomPage({ searchParams }: { searchParams: Promise<{ artist?: string; bias?: string }> }) {
  return (
    <Suspense fallback={<p className="p-10 text-center text-ink-soft">방 불러오는 중...</p>}>
      <RoomData searchParams={searchParams} />
    </Suspense>
  );
}
