export function bindEvent(target, type, handler) {
  const prop = `on${type}`;
  const existing = target[prop];
  if (typeof existing === 'function') {
    target[prop] = (event) => {
      existing.call(target, event);
      handler.call(target, event);
    };
  } else {
    target[prop] = handler;
  }
}
