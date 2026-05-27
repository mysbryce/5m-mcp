import { notFound } from 'next/navigation';
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { getMDXComponents } from '@/mdx-components';
import { source } from '@/lib/source';

type PageData = {
  title?: string;
  description?: string;
  body: React.ComponentType<{ components?: unknown }>;
  toc?: unknown;
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

  return (
    <DocsPage toc={data.toc as never} full={data.full}>
      <DocsTitle>{data.title}</DocsTitle>
      <DocsDescription>{data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
