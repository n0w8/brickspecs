import LexiconBrowser from "@/components/LexiconBrowser";

export default async function LexiconPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const { q, year } = await searchParams;
  const initialYear = year && /^\d{4}$/.test(year) ? Number(year) : null;
  return <LexiconBrowser initialQuery={q ?? ""} initialYear={initialYear} />;
}
