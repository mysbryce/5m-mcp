import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { findNeighbour } from 'fumadocs-core/server';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { DocsBody } from 'fumadocs-ui/page';

import { getMDXComponents } from '@/mdx-components';
import { source } from '@/lib/source';
import { DocsTOC } from '@/components/docs-toc';

type PageData = {
  title?: string;
  description?: string;
  body: React.ComponentType<{ components?: unknown }>;
  toc?: import('fumadocs-core/server').TOCItemType[];
  full?: boolean;
};

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) return {};
  const data = page.data as PageData;
  return {
    title: data.title,
    description: data.description,
  };
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data as PageData;
  const MDX = data.body;
  const neighbours = await findNeighbour(source.pageTree, page.url);
  const toc = data.toc ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-12 px-4 py-8 lg:px-8">
      <article className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8 text-[15px] leading-relaxed">
        {/* Title + prev/next mini */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight md:text-4xl">
              {data.title}
            </h1>
            <div className="flex shrink-0 items-center gap-1 pt-1.5">
              {neighbours.previous && (
                <Link
                  href={neighbours.previous.url}
                  aria-label="Previous"
                  className="inline-flex size-7 items-center justify-center rounded-md border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                </Link>
              )}
              {neighbours.next && (
                <Link
                  href={neighbours.next.url}
                  aria-label="Next"
                  className="inline-flex size-7 items-center justify-center rounded-md border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                >
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          </div>
          {data.description && (
            <p className="text-balance text-base text-fd-muted-foreground">
              {data.description}
            </p>
          )}
          <div className="border-b border-fd-border pt-2 pb-4" />
        </div>

        {/* MDX body — DocsBody supplies the prose typography */}
        <DocsBody className="w-full">
          <MDX components={getMDXComponents()} />
        </DocsBody>

        {/* Big prev/next cards */}
        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {neighbours.previous ? (
            <Link
              href={neighbours.previous.url}
              className="group flex flex-1 flex-col gap-2 rounded-lg border border-fd-border bg-fd-card/40 px-4 py-3 transition hover:border-fd-accent-foreground/30 hover:bg-fd-card"
            >
              <span className="inline-flex items-center gap-1 text-xs text-fd-muted-foreground">
                <ChevronLeft className="size-3.5" />
                Previous
              </span>
              <span className="font-medium">{neighbours.previous.name}</span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {neighbours.next ? (
            <Link
              href={neighbours.next.url}
              className="group flex flex-1 flex-col items-end gap-2 rounded-lg border border-fd-border bg-fd-card/40 px-4 py-3 text-right transition hover:border-fd-accent-foreground/30 hover:bg-fd-card"
            >
              <span className="inline-flex items-center gap-1 text-xs text-fd-muted-foreground">
                Next
                <ChevronRight className="size-3.5" />
              </span>
              <span className="font-medium">{neighbours.next.name}</span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </article>

      {/* TOC */}
      {toc.length > 0 && (
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto pt-2 xl:block">
          <DocsTOC items={toc} />
        </aside>
      )}
    </div>
  );
}
