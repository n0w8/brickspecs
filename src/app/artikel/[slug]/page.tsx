import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/data/articles";
import ArticleReader from "@/components/ArticleReader";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

/** Kürzt einen Text auf ~155 Zeichen (Wortgrenze) für Meta-Descriptions. */
function truncateDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()} …`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);

  // Unbekannter Slug → neutrale Fallback-Metadata (die Page rendert notFound)
  if (!article) {
    return {
      title: "Artikel | BrickSpecs",
      description:
        "Info-Artikel rund um LEGO: Vintage, Retro, Neuheiten, Investment, City und Wissen - im BrickSpecs-Magazin.",
    };
  }

  const title = `${article.title.de} | BrickSpecs`;
  const description = truncateDescription(article.teaser.de);
  return {
    title,
    description,
    openGraph: {
      title: article.title.de,
      description,
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exists = ARTICLES.some((a) => a.slug === slug);
  if (!exists) notFound();
  return <ArticleReader slug={slug} />;
}
