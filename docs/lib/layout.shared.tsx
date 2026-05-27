import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
        <span
          aria-hidden
          className="inline-block size-2 rounded-full bg-[oklch(0.6049_0.1419_276.7)] shadow-[0_0_12px_oklch(0.6049_0.1419_276.7/0.8)]"
        />
        agent_api
      </span>
    ),
  },
  githubUrl: 'https://github.com/mysbryce/5m-mcp',
  links: [
    { text: 'Guide', url: '/docs/guide/quick-start' },
    { text: 'Clients', url: '/docs/clients/claude-code' },
    { text: 'Tools', url: '/docs/reference/tools' },
    { text: 'Plugins', url: '/docs/plugins/overview' },
  ],
};
