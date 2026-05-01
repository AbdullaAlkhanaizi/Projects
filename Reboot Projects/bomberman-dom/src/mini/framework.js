import { createElement, render } from './dom.js';
import { createStore } from './store.js';
import { createRouter } from './router.js';

export function createFramework(options = {}) {
  const { store, state } = options;
  const rootOption = options.root;
  const routes = {};
  const appStore = store || createStore(state || {});
  let router = null;
  let unsubscribe = null;
  let currentRoute = { path: '/', view: null };
  let rootNode = rootOption || null;
  let started = false;
  let api = null;

  function normalizePath(path) {
    if (!path) return '/';
    if (path === '*') return '*';
    let normalized = String(path).replace(/^#/, '');
    if (!normalized) return '/';
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    if (normalized === '/index.html') return '/';
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  function route(path, view) {
    const key = normalizePath(path);
    routes[key] = view;
    if (started && currentRoute.path === key) {
      currentRoute = { path: key, view };
      renderApp();
    }
    return api;
  }

  function resolveRoot() {
    if (rootNode) return rootNode;
    if (typeof rootOption === 'string') {
      rootNode = document.querySelector(rootOption);
      return rootNode;
    }
    if (!rootOption) {
      rootNode = document.getElementById('app');
      return rootNode;
    }
    rootNode = rootOption;
    return rootNode;
  }

  function resolveView() {
    return currentRoute.view || routes['*'] || null;
  }

  function renderApp() {
    const root = resolveRoot();
    if (!root) return;
    const view = resolveView();
    if (!view) {
      render(
        createElement('div', {}, `Route not found: ${currentRoute.path}`),
        root
      );
      return;
    }
    render(view(appStore.getState(), currentRoute), root);
  }

  function handleRoute(match) {
    currentRoute = { path: match.path, view: match.value || null };
    renderApp();
  }

  function start() {
    const root = resolveRoot();
    if (!root) {
      throw new Error('createFramework requires a root element or selector');
    }
    if (!router) {
      router = createRouter(routes, handleRoute);
    }
    router.start();
    if (!unsubscribe) {
      unsubscribe = appStore.subscribe(renderApp);
    }
    started = true;
  }

  function mount(target) {
    rootNode =
      typeof target === 'string' ? document.querySelector(target) : target;
    start();
    return api;
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  function navigate(path) {
    if (!router) return;
    router.navigate(normalizePath(path));
  }

  api = {
    createElement,
    route,
    start,
    mount,
    stop,
    navigate,
    store: appStore,
  };

  return api;
}
