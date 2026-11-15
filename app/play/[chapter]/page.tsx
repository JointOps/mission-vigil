import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Game } from "@/components/Game";
import { CHAPTERS, TITLE } from "@/engine/story";

// Only Chapter 1 is built; the title screen shows the others as coming soon (see CHAPTERS in engine/story.ts).
const playable = ["1"];

// ponytail: fixed to Chapter 1 since it is the only playable one; switch to generateMetadata when a second chapter ships.
export const metadata: Metadata = {
  title: `${TITLE.chapter("1")}: ${CHAPTERS[0].name}`,
  description: CHAPTERS[0].teaser,
  alternates: { canonical: "/play/1" },
};

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
