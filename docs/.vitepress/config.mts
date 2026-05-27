import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'agent_api',
  description:
    'FiveM MCP resource: filesystem, lifecycle, live-player testing, NUI screenshots, and framework bridges (ESX, ox_lib, oxmysql).',
  base: '/5m-mcp/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:title', content: 'agent_api — FiveM MCP server' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'A FiveM resource that exposes a Model Context Protocol surface so any MCP-aware agent can develop, debug, and live-test FiveM resources.',
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/quick-start' },
      { text: 'Clients', link: '/clients/claude-code' },
      { text: 'Tools', link: '/reference/tools' },
      { text: 'Plugins', link: '/plugins/overview' },
      { text: 'GitHub', link: 'https://github.com/mysbryce/5m-mcp' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Get started',
          items: [
            { text: 'What is agent_api?', link: '/guide/what-is' },
            { text: 'Quick start', link: '/guide/quick-start' },
            { text: 'Install on a server', link: '/guide/install' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'ACE permissions', link: '/guide/ace' },
          ],
        },
        {
          text: 'Workflows',
          items: [
            { text: 'Scaffold a new resource', link: '/guide/scaffold' },
            { text: 'Live UI testing', link: '/guide/ui-testing' },
            { text: 'Iteration loop', link: '/guide/iteration' },
          ],
        },
      ],
      '/clients/': [
        {
          text: 'Client integration',
          items: [
            { text: 'Claude Code (HTTP)', link: '/clients/claude-code' },
            { text: 'Claude Code (stdio shim)', link: '/clients/claude-code-stdio' },
            { text: 'Codex CLI', link: '/clients/codex' },
            { text: 'Cursor', link: '/clients/cursor' },
            { text: 'Cline / Continue / Zed', link: '/clients/others' },
            { text: 'Custom client (raw HTTP)', link: '/clients/custom' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Tool catalog', link: '/reference/tools' },
            { text: 'Convars', link: '/reference/convars' },
            { text: 'Error codes', link: '/reference/errors' },
            { text: 'Envelope shape', link: '/reference/envelope' },
            { text: 'Security model', link: '/reference/security' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Overview', link: '/plugins/overview' },
            { text: 'ESX', link: '/plugins/esx' },
            { text: 'ox_lib', link: '/plugins/oxlib' },
            { text: 'oxmysql', link: '/plugins/oxmysql' },
            { text: 'Write your own', link: '/plugins/authoring' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/mysbryce/5m-mcp' }],
    footer: {
      message: 'Released under the PolyForm Noncommercial 1.0.0 license.',
      copyright: 'Copyright © 2026 — agent_api contributors',
    },
    editLink: {
      pattern: 'https://github.com/mysbryce/5m-mcp/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    search: { provider: 'local' },
  },
});
