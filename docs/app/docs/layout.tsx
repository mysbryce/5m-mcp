import { DocsSidebar } from '@/components/docs-sidebar';
import { DocsHeader } from '@/components/docs-header';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-fd-background">
      <DocsSidebar tree={source.pageTree} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[240px]">
        <DocsHeader />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
