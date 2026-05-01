import { bindEvent } from './events.js';

export function createRouter(routes, onChange) {
  function normalizePathname(pathname) {
    let path = pathname || '/';
    if (path === '/index.html') return '/';
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path;
  }

  function matchRoute(path) {
    if (routes[path]) return { path, value: routes[path] };
    if (routes['*']) return { path, value: routes['*'] };
    return { path, value: null };
  }

  function readPath() {
    return normalizePathname(window.location.pathname);
  }

  function handleChange() {
    const path = readPath();
    onChange(matchRoute(path));
  }

  function handleLinkClick(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    let anchor = event.target;
    while (anchor && anchor.tagName !== 'A') {
      anchor = anchor.parentElement;
    }
    if (!anchor) return;
    if (anchor.hasAttribute('download')) return;
    if (anchor.target && anchor.target !== '_self') return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    navigate(`${url.pathname}${url.search}`);
  }

  function start() {
    bindEvent(window, 'popstate', handleChange);
    bindEvent(document, 'click', handleLinkClick);
    handleChange();
  }

  function navigate(path) {
    const url = new URL(path, window.location.origin);
    const pathname = normalizePathname(url.pathname);
    const nextUrl = `${pathname}${url.search}`;
    if (
      nextUrl ===
      `${window.location.pathname}${window.location.search}`
    ) {
      handleChange();
      return;
    }
    window.history.pushState(null, '', nextUrl);
    handleChange();
  }

  return { start, navigate };
}
