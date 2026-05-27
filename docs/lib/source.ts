import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

const mdxSource = docs.toFumadocsSource() as { files: unknown };
const rawFiles = mdxSource.files;
const files = typeof rawFiles === 'function' ? (rawFiles as () => unknown[])() : rawFiles;

export const source = loader({
  baseUrl: '/docs',
  source: { files } as never,
});
