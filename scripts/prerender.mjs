import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = path.join(projectRoot, 'dist');
const publicRoutes = [
  {
    path: '/',
    output: 'index.html',
    title: 'WorkforceAI — AI Employees for Local Service Businesses',
    description: 'WorkforceAI helps plumbing, HVAC, electrical, roofing, and contracting businesses answer customers, capture leads, and record appointment requests 24/7.',
  },
  {
    path: '/about',
    output: 'about/index.html',
    title: 'About WorkforceAI',
    description: 'Learn how WorkforceAI helps local service businesses respond to customers, capture leads, and manage appointment requests.',
  },
  {
    path: '/privacy',
    output: 'privacy/index.html',
    title: 'Privacy Policy — WorkforceAI',
    description: 'Read how WorkforceAI handles and protects information.',
  },
  {
    path: '/terms',
    output: 'terms/index.html',
    title: 'Terms of Service — WorkforceAI',
    description: 'Review the terms for using WorkforceAI.',
  },
  {
    path: '/refund',
    output: 'refund/index.html',
    title: 'Refund Policy — WorkforceAI',
    description: 'Review the WorkforceAI refund policy.',
  },
  {
    path: '/contact',
    output: 'contact/index.html',
    title: 'Contact WorkforceAI',
    description: 'Contact the WorkforceAI team for help, questions, or a product demo.',
  },
];

function replaceMeta(html, expression, replacement) {
  if (!expression.test(html)) {
    throw new Error(`Could not find expected metadata pattern: ${expression}`);
  }
  return html.replace(expression, replacement);
}

const template = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
const server = await createServer({
  root: projectRoot,
  configFile: path.join(projectRoot, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const [{ default: App }, { useAppStore, viewFromPath }] = await Promise.all([
    server.ssrLoadModule('/src/App.tsx'),
    server.ssrLoadModule('/src/lib/store.ts'),
  ]);

  for (const route of publicRoutes) {
    useAppStore.setState({
      view: viewFromPath(route.path),
      user: null,
      isAdmin: false,
      mobileNavOpen: false,
    });

    const markup = renderToString(React.createElement(App, { initialPath: route.path }));
    const canonical = `https://planetlion.com${route.path === '/' ? '/' : route.path}`;
    let html = template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    html = replaceMeta(html, /<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
    html = replaceMeta(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${route.description}" />`);
    html = replaceMeta(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`);
    html = replaceMeta(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${route.title}" />`);
    html = replaceMeta(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${route.description}" />`);
    html = replaceMeta(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`);
    html = replaceMeta(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${route.title}" />`);
    html = replaceMeta(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${route.description}" />`);

    const outputPath = path.join(outputRoot, route.output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }
} finally {
  await server.close();
}
