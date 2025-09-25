// HTML parsing & metric extraction (T05)
// Uses parse5 to gather structural signals for scoring.
import * as parse5 from 'parse5';
import { RawMetrics } from '../types/report';

interface WalkContext {
  h1Count: number;
  headingSequence: number[];
  imgTotal: number;
  imgWithAlt: number;
  hasLang: boolean;
  landmarks: number; // count of landmark element occurrences
  metaDescriptionChars: number;
  titleChars: number;
  pageTitle?: string;
  hasCanonical: boolean;
  h1Exists: boolean;
  hasViewport: boolean;
  hasFavicon: boolean;
  fontDisplayHits: number;
  fontDisplayTotal: number;
  googleFontLinks: number;
  googleFontDisplaySwap: number;
  mixedContent: number;
  scriptCount: number;
  cssCount: number;
  imageCount: number;
  inlineScriptBytes: number;
  inlineStyleFontFaceBlocks: number;
  inlineStyleFontFaceWithDisplay: number;
}

function createInitialContext(): WalkContext {
  return {
    h1Count: 0,
    headingSequence: [],
    imgTotal: 0,
    imgWithAlt: 0,
    hasLang: false,
    landmarks: 0,
    metaDescriptionChars: 0,
    titleChars: 0,
    hasCanonical: false,
    h1Exists: false,
    hasViewport: false,
    hasFavicon: false,
    fontDisplayHits: 0,
    fontDisplayTotal: 0,
    googleFontLinks: 0,
    googleFontDisplaySwap: 0,
    mixedContent: 0,
    scriptCount: 0,
    cssCount: 0,
    imageCount: 0,
    inlineScriptBytes: 0,
    inlineStyleFontFaceBlocks: 0,
    inlineStyleFontFaceWithDisplay: 0,
  };
}

type Node = any; // parse5 typings are loose, keep pragmatic

export function extractMetrics(html: string, pageUrl: string): RawMetrics {
  const doc = parse5.parse(html) as Node;
  const ctx = createInitialContext();
  const isHttpsPage = /^https:/i.test(pageUrl);

  function getAttr(node: Node, name: string): string | undefined {
    if (!node.attrs) return undefined;
    const found = node.attrs.find((a: any) => a.name.toLowerCase() === name.toLowerCase());
    return found?.value;
  }

  function walk(node: Node) {
    if (node.nodeName === '#text') return;
    if (node.tagName) {
      const tag = node.tagName.toLowerCase();
      // html lang
      if (tag === 'html') {
        const lang = getAttr(node, 'lang');
        if (lang) ctx.hasLang = true;
      }
      // title
      if (tag === 'title' && node.childNodes) {
        const text = node.childNodes.map((c: any) => c.value || '').join('').trim();
        if (text) {
          ctx.titleChars = text.length;
          ctx.pageTitle = text;
        }
      }
      // meta elements
      if (tag === 'meta') {
        const name = (getAttr(node, 'name') || '').toLowerCase();
        if (name === 'description') {
          const content = getAttr(node, 'content') || '';
            ctx.metaDescriptionChars = content.trim().length;
        }
        if (name === 'viewport') ctx.hasViewport = true;
      }
      // link elements
      if (tag === 'link') {
        const rel = (getAttr(node, 'rel') || '').toLowerCase();
        if (rel.split(/\s+/).includes('canonical')) ctx.hasCanonical = true;
        if (rel.includes('icon')) ctx.hasFavicon = true;
        const href = getAttr(node, 'href') || '';
        if (href.includes('fonts.googleapis.com')) {
          ctx.googleFontLinks++;
          if (/display=swap/.test(href)) ctx.googleFontDisplaySwap++;
          ctx.fontDisplayTotal++;
          if (/display=swap/.test(href)) ctx.fontDisplayHits++;
        }
        if (isHttpsPage && /^http:\/\//i.test(href)) ctx.mixedContent++;
        if (rel.split(/\s+/).includes('stylesheet')) ctx.cssCount++;
      }
      // img
      if (tag === 'img') {
        ctx.imgTotal++;
        ctx.imageCount++;
        const alt = getAttr(node, 'alt');
        if (typeof alt === 'string' && alt.trim().length > 0) ctx.imgWithAlt++;
        const src = getAttr(node, 'src') || '';
        if (isHttpsPage && /^http:\/\//i.test(src)) ctx.mixedContent++;
      }
      // script
      if (tag === 'script') {
        ctx.scriptCount++;
        if (!getAttr(node, 'src') && node.childNodes) {
          const code = node.childNodes.map((c: any) => c.value || '').join('');
          ctx.inlineScriptBytes += Buffer.byteLength(code, 'utf8');
        } else {
          const src = getAttr(node, 'src') || '';
          if (isHttpsPage && /^http:\/\//i.test(src)) ctx.mixedContent++;
        }
      }
      // style (inline)
      if (tag === 'style' && node.childNodes) {
        const css = node.childNodes.map((c: any) => c.value || '').join('');
        // Rough font-face detection
        const faceBlocks = css.match(/@font-face/gi)?.length || 0;
        if (faceBlocks) ctx.inlineStyleFontFaceBlocks += faceBlocks;
        const displayMatches = css.match(/font-display:\s*(swap|optional|fallback)/gi)?.length || 0;
        if (displayMatches) ctx.inlineStyleFontFaceWithDisplay += displayMatches;
        if (faceBlocks) {
          ctx.fontDisplayTotal += faceBlocks;
          ctx.fontDisplayHits += Math.min(displayMatches, faceBlocks);
        }
      }
      // headings
      if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1], 10);
        if (level === 1) {
          ctx.h1Count++;
          ctx.h1Exists = true;
        }
        ctx.headingSequence.push(level);
      }
      // landmarks
      if (['header', 'nav', 'main', 'footer'].includes(tag)) ctx.landmarks++;
    }
    if (node.childNodes) node.childNodes.forEach((c: Node) => walk(c));
  }

  walk(doc);

  // Outline issues heuristic: count of level jumps >1 + extra h1 occurrences beyond first
  let outlineIssues = 0;
  let prev = 0;
  for (const lvl of ctx.headingSequence) {
    if (prev && lvl > prev + 1) outlineIssues++;
    prev = lvl;
  }
  if (ctx.h1Count > 1) outlineIssues += (ctx.h1Count - 1);

  // Alt coverage
  const altCoverage = ctx.imgTotal === 0 ? 1 : ctx.imgWithAlt / ctx.imgTotal;

  // Font display percent
  let fontDisplayPercent = 0;
  if (ctx.fontDisplayTotal > 0) {
    fontDisplayPercent = (ctx.fontDisplayHits / ctx.fontDisplayTotal) * 100;
  }

  // Basic request counts (HTML + resource tags), refined in later phases when we fetch assets.
  const requests = 1 + ctx.scriptCount + ctx.cssCount + ctx.imageCount; // html + resources

  const metrics: RawMetrics = {
    timing: { ttfbMs: 0 }, // to be filled externally from fetchHtml
    size: {
      totalBytes: Buffer.byteLength(html, 'utf8'),
      imagesBytes: 0, // filled later (T07)
      cssBytes: 0,
      jsBytes: ctx.inlineScriptBytes
    },
    counts: {
      requests,
      img: ctx.imageCount,
      script: ctx.scriptCount,
      css: ctx.cssCount
    },
    accessibility: {
      altCoverage,
      h1Count: ctx.h1Count,
      outlineIssues,
      landmarks: ctx.landmarks,
      hasLang: ctx.hasLang
    },
    seo: {
      titleChars: ctx.titleChars,
      metaDescriptionChars: ctx.metaDescriptionChars,
      hasCanonical: ctx.hasCanonical,
      h1Exists: ctx.h1Exists
    },
    security: {
      https: isHttpsPage,
      headers: { csp: false, xfo: false, referrer: false, permissions: false }, // filled later when integrating response headers
      mixedContent: ctx.mixedContent
    },
    ux: {
      hasViewport: ctx.hasViewport,
      hasFavicon: ctx.hasFavicon,
      fontDisplayPercent,
      jsWeightKb: ctx.inlineScriptBytes / 1024
    },
    pageTitle: ctx.pageTitle
  };

  return metrics;
}
