import { bindEvent } from './events.js';

const globalListeners = new Set();
const eventHandlers = new WeakMap();
const windowEventHandlers = new Set();
const HTML_NS = 'http://www.w3.org/1999/xhtml';

function createDomElement(tag) {
  return document.createElementNS(HTML_NS, tag);
}

function ensureGlobalListener(type) {
  if (globalListeners.has(type)) return;
  bindEvent(document, type, (event) => {
    let node = event.target;
    while (node) {
      const handlers = eventHandlers.get(node);
      if (handlers && handlers[type]) {
        handlers[type](event);
        if (event.cancelBubble) return;
      }
      node = node.parentElement;
    }
  });
  globalListeners.add(type);
}

function isTextVNode(vnode) {
  return vnode && vnode.tag == null;
}

function normalizeChildren(children) {
  const out = [];
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      out.push({ tag: null, text: String(child), attrs: {}, children: [] });
    } else {
      out.push(child);
    }
  }
  return out;
}

export function createElement(tag, attrs, ...children) {
  return {
    tag,
    attrs: attrs || {},
    children: normalizeChildren(children),
    key: attrs && attrs.key != null ? attrs.key : null,
    el: null,
  };
}

export const h = createElement;

function setAttr(el, name, value) {
  if (name === 'on') {
    const handlers = value || {};
    eventHandlers.set(el, handlers);
    Object.keys(handlers).forEach((type) => ensureGlobalListener(type));
    return;
  }
  if (name === 'onWindow') {
    const handlers = value || {};
    windowEventHandlers.add(handlers);
    Object.keys(handlers).forEach((type) => {
      if (!globalListeners.has(`window:${type}`)) {
        bindEvent(window, type, (event) => {
          windowEventHandlers.forEach((group) => {
            if (group[type]) group[type](event);
          });
        });
        globalListeners.add(`window:${type}`);
      }
    });
    return;
  }
  if (name === 'ref' && typeof value === 'function') {
    value(el);
    return;
  }
  if (name === 'class') {
    el.className = value || '';
    return;
  }
  if (name === 'style') {
    if (value && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (value == null) {
      el.removeAttribute('style');
    } else {
      el.setAttribute('style', value);
    }
    return;
  }
  if (name === 'value' || name === 'checked' || name === 'disabled') {
    el[name] = value;
    return;
  }
  if (value == null || value === false) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
}

function updateAttrs(el, newAttrs, oldAttrs) {
  const all = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);
  for (const name of all) {
    if (newAttrs[name] !== oldAttrs[name]) {
      setAttr(el, name, newAttrs[name]);
    }
  }
}

function createVNodeElement(vnode) {
  if (isTextVNode(vnode)) {
    const el = document.createTextNode(vnode.text || '');
    vnode.el = el;
    return el;
  }
  const el = createDomElement(vnode.tag);
  vnode.el = el;
  const attrs = vnode.attrs || {};
  Object.keys(attrs).forEach((name) => setAttr(el, name, attrs[name]));
  vnode.children.forEach((child) => el.appendChild(createVNodeElement(child)));
  return el;
}

function patchChildren(parent, newChildren, oldChildren) {
  const oldKeyed = new Map();
  const oldUnkeyed = [];

  oldChildren.forEach((child) => {
    if (child && child.key != null) {
      oldKeyed.set(child.key, child);
    } else {
      oldUnkeyed.push(child);
    }
  });

  const newEls = [];
  let unkeyedIndex = 0;

  newChildren.forEach((newChild) => {
    let oldChild = null;
    if (newChild && newChild.key != null) {
      oldChild = oldKeyed.get(newChild.key) || null;
      if (oldChild) oldKeyed.delete(newChild.key);
    } else if (oldUnkeyed[unkeyedIndex]) {
      oldChild = oldUnkeyed[unkeyedIndex];
      unkeyedIndex += 1;
    }

    const patched = patch(parent, newChild, oldChild);
    newEls.push(patched);
  });

  for (const leftover of oldKeyed.values()) {
    if (leftover && leftover.el && leftover.el.parentNode) {
      leftover.el.parentNode.removeChild(leftover.el);
    }
  }
  for (let i = unkeyedIndex; i < oldUnkeyed.length; i += 1) {
    const leftover = oldUnkeyed[i];
    if (leftover && leftover.el && leftover.el.parentNode) {
      leftover.el.parentNode.removeChild(leftover.el);
    }
  }

  let cursor = parent.firstChild;
  newEls.forEach((childEl) => {
    if (!childEl) return;
    if (childEl === cursor) {
      cursor = cursor.nextSibling;
      return;
    }
    parent.insertBefore(childEl, cursor);
  });
}

function patch(parent, newVNode, oldVNode) {
  if (!oldVNode) {
    const el = createVNodeElement(newVNode);
    parent.appendChild(el);
    return el;
  }
  if (!newVNode) {
    if (oldVNode.el && oldVNode.el.parentNode) {
      oldVNode.el.parentNode.removeChild(oldVNode.el);
    }
    return null;
  }
  if (isTextVNode(newVNode) && isTextVNode(oldVNode)) {
    if (newVNode.text !== oldVNode.text) {
      oldVNode.el.textContent = newVNode.text;
    }
    newVNode.el = oldVNode.el;
    return newVNode.el;
  }
  if (newVNode.tag !== oldVNode.tag) {
    const el = createVNodeElement(newVNode);
    parent.replaceChild(el, oldVNode.el);
    return el;
  }

  const el = (newVNode.el = oldVNode.el);
  updateAttrs(el, newVNode.attrs || {}, oldVNode.attrs || {});
  patchChildren(el, newVNode.children || [], oldVNode.children || []);
  return el;
}

export function render(vnode, container) {
  const prev = container.__vnode || null;
  if (prev) {
    patch(container, vnode, prev);
  } else {
    container.textContent = '';
    container.appendChild(createVNodeElement(vnode));
  }
  container.__vnode = vnode;
}
