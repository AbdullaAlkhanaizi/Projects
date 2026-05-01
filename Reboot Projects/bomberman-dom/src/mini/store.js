export function createStore(initialState) {
  let state = { ...initialState };
  const subs = new Set();
  let batching = false;
  let pending = false;

  function getState() {
    return state;
  }

  function setState(next) {
    const update = typeof next === 'function' ? next(state) : next;
    state = { ...state, ...update };
    if (batching) {
      pending = true;
      return;
    }
    subs.forEach((fn) => fn(state));
  }

  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  function batch(fn) {
    batching = true;
    try {
      fn();
    } finally {
      batching = false;
      if (pending) {
        pending = false;
        subs.forEach((cb) => cb(state));
      }
    }
  }

  return { getState, setState, subscribe, batch };
}
