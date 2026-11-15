import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Game } from "@/components/Game";

// Only Chapter 1 is built; the title screen shows the others as coming soon (see CHAPTERS in engine/story.ts).
const playable = ["1"];

export function generateStaticParams() {
  return playable.map((chapter) => ({ chapter }));
}

async function Chapter({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  if (!playable.includes(chapter)) notFound();
  return <Game />;
}

// With Cache Components, route params must be read inside a Suspense boundary.
export default function PlayPage({ params }: { params: Promise<{ chapter: string }> }) {
  return (
    <Suspense>
      <Chapter params={params} />
    </Suspense>
  );
}
