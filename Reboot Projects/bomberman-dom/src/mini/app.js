import { render } from './dom.js';

export function createApp({ root, view, store }) {
  let unsubscribe = null;

  function renderApp() {
    render(view(store.getState()), root);
  }

  function start() {
    renderApp();
    unsubscribe = store.subscribe(renderApp);
  }

  function stop() {
    if (unsubscribe) unsubscribe();
  }

  return { start, stop };
}
