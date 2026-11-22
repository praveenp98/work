import type { Metadata } from "next";
import Link from "next/link";
import { ANSWERS, type Answer } from "@/lib/answers";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Amazon seller answers: ads, listings, inventory and AI",
  description: "Straight answers from Rocco, the AI Amazon manager: ACoS, TACoS, negatives, Buy Box, suppressed listings, restock, and how an AI Amazon manager works.",
  alternates: { canonical: "/answers" },
};

const TOPICS: Answer["topic"][] = ["AI & connectors", "Ads", "Listings", "Inventory"];

export default function Page() {
  return (
    <section className="answers-index">
      <h1>Ask me anything about Amazon.</h1>
      <p className="hello-lede">Straight answers, the way a senior Amazon manager would give them. For your own numbers, text me.</p>
      {TOPICS.map((t) => (
        <div key={t}>
          <h2>{t}</h2>
          <ul className="answer-list">{ANSWERS.filter((a) => a.topic === t).map((a) => <li key={a.slug}><Link href={`/answers/${a.slug}`}><b>{a.q}</b><span>{a.short.slice(0, 120)}…</span></Link></li>)}</ul>
        </div>
      ))}
      <h2>Longer guides</h2>
      <ul className="answer-list">{GUIDES.map((g) => <li key={g.slug}><Link href={`/guides/${g.slug}`}><b>{g.title}</b><span>{g.description}</span></Link></li>)}</ul>
    </section>
  );
}
