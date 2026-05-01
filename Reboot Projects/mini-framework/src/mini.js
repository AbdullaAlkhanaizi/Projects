// mini-framework: virtual DOM, simple router, store, event system
(function (global) {
    const Mini = {};

    // Utility
    function isEventProp(name) { return /^on[A-Z]/.test(name); }
    function extractEventName(name) { return name.slice(2).toLowerCase(); }

    // Hyperscript-like function
    function h(tag, props, ...children) {
        props = props || {};
        const flat = [];
        children.forEach(c => {
            if (Array.isArray(c)) flat.push(...c);
            else flat.push(c);
        });
        const cleaned = flat.filter(c => c !== null && c !== undefined && c !== false && c !== true);
        return { tag, props, children: cleaned };
    }

    // Event handler storage and id gen
    let handlerId = 1;
    function nextHandlerId() { return 'h' + (handlerId++); }

    // Render / diff
    function createElement(vnode, ctx) {
        if (vnode === undefined || vnode === null) return document.createTextNode('');
        if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(String(vnode));

        const el = document.createElement(vnode.tag);
        setProps(el, vnode.props || {}, ctx);
        vnode.children.forEach(child => el.appendChild(createElement(child, ctx)));
        return el;
    }

    function setProps(el, props, ctx) {
        for (let k in props) {
            const val = props[k];
            if (isEventProp(k) && typeof val === 'function') {
                const id = nextHandlerId();
                // store handler in context map
                ctx.handlers[id] = val;
                const domEvent = extractEventName(k);
                // attach data attribute to element for delegation
                el.setAttribute('data-on-' + domEvent, id);
            } else if (k === 'class' || k === 'className') {
                el.className = val;
            } else if (k === 'style' && typeof val === 'object') {
                Object.assign(el.style, val);
            } else if (k === 'checked') {
                el.checked = Boolean(val);
                if (val) el.setAttribute('checked', '');
                else el.removeAttribute('checked');
            } else if (k === 'value') {
                el.value = val;
                el.setAttribute('value', val);
            } else if (k === 'dataset' && typeof val === 'object') {
                for (let dk in val) el.dataset[dk] = val[dk];
            } else if (typeof val === 'boolean') {
                if (val) el.setAttribute(k, '');
                else el.removeAttribute(k);
            } else {
                el.setAttribute(k, String(val));
            }
        }
    }

    function updateProps(el, newProps, oldProps, ctx) {
        oldProps = oldProps || {};
        newProps = newProps || {};
        // remove old props
        for (let k in oldProps) {
            if (!(k in newProps)) {
                if (isEventProp(k)) {
                    const ev = extractEventName(k);
                    el.removeAttribute('data-on-' + ev);
                } else if (k === 'class' || k === 'className') el.className = '';
                else el.removeAttribute(k);
            }
        }
        // set new props
        setProps(el, newProps, ctx);
    }

    function isTextVNode(vnode) {
        return (typeof vnode === 'string' || typeof vnode === 'number');
    }

    function diffNode(parent, newVNode, oldVNode, index, ctx) {
        const node = parent.childNodes[index];

        if (oldVNode === undefined || oldVNode === null) {
            if (newVNode !== undefined && newVNode !== null) {
                parent.appendChild(createElement(newVNode, ctx));
            }
            return;
        }

        if (newVNode === undefined || newVNode === null) {
            if (node) parent.removeChild(node);
            return;
        }

        const newIsText = isTextVNode(newVNode);
        const oldIsText = isTextVNode(oldVNode);
        if (newIsText || oldIsText) {
            if (!newIsText || !oldIsText || String(newVNode) !== String(oldVNode)) {
                parent.replaceChild(createElement(newVNode, ctx), node);
            }
            return;
        }

        if (newVNode.tag !== oldVNode.tag) {
            parent.replaceChild(createElement(newVNode, ctx), node);
            return;
        }

        updateProps(node, newVNode.props, oldVNode.props, ctx);
        const newChildren = newVNode.children || [];
        const oldChildren = oldVNode.children || [];

        // Patch stable indices first, then append/remove to avoid index-shift bugs.
        const common = Math.min(newChildren.length, oldChildren.length);
        for (let i = 0; i < common; i++) {
            diffNode(node, newChildren[i], oldChildren[i], i, ctx);
        }

        for (let i = common; i < newChildren.length; i++) {
            node.appendChild(createElement(newChildren[i], ctx));
        }

        for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
            const child = node.childNodes[i];
            if (child) node.removeChild(child);
        }
    }

    // Renderer: stores vnode on container._vnode and handlers map
    function collectEvents(vnode, set) {
        if (vnode === undefined || vnode === null) return;
        if (typeof vnode === 'string' || typeof vnode === 'number') return;
        const props = vnode.props || {};
        for (let k in props) {
            if (isEventProp(k) && typeof props[k] === 'function') {
                set.add(extractEventName(k));
            }
        }
        (vnode.children || []).forEach(child => collectEvents(child, set));
    }

    function ensureDelegated(container, ctx, eventName) {
        if (ctx._delegatedEvents.has(eventName)) return;
        ctx._delegatedEvents.add(eventName);
        const useCapture = (eventName === 'blur' || eventName === 'focus');
        container.addEventListener(eventName, function (e) {
            let node = e.target;
            while (node && node !== container) {
                const attr = node.getAttribute && (node.getAttribute('data-on-' + eventName));
                if (attr && ctx.handlers[attr]) { ctx.handlers[attr](e); return; }
                node = node.parentNode;
            }
        }, useCapture);
    }

    function render(vnode, container) {
        if (!container._ctx) container._ctx = { handlers: {}, _delegatedEvents: new Set() };
        const ctx = container._ctx;
        // Reset handler map on each render
        ctx.handlers = {};

        // Ensure delegation listeners for events used in this tree
        const events = new Set();
        collectEvents(vnode, events);
        events.forEach(ev => ensureDelegated(container, ctx, ev));

        const oldVNode = container._vnode;
        // For simplicity, when no oldVNode just mount fresh
        if (!oldVNode) {
            container.innerHTML = '';
            const el = createElement(vnode, ctx);
            container.appendChild(el);
            container._vnode = vnode;
            return;
        }
        // diff root vnode at child index 0 of container
        diffNode(container, vnode, oldVNode, 0, ctx);
        container._vnode = vnode;
    }

    // Simple store
    function createStore(initial) {
        let state = initial || {};
        const subs = new Set();
        return {
            getState() { return state; },
            setState(patch) {
                const partial = (typeof patch === 'function') ? patch(state) : patch;
                const next = Object.assign({}, state, partial);
                state = next;
                subs.forEach(s => s(state));
            },
            subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
        };
    }

    // Router (hash-based)
    function createRouter(routes) {
        const table = routes || {};
        function normalize(path) {
            if (!path) return '/';
            if (path[0] !== '/') return '/' + path;
            return path;
        }
        function parsePath() {
            const hash = location.hash.replace(/^#/, '') || '/';
            return normalize(hash);
        }
        function resolve(path) {
            const p = normalize(path || parsePath());
            return table[p] || table['/'] || null;
        }
        function notify() {
            if (router._onChange) router._onChange(parsePath(), resolve());
        }
        window.addEventListener('hashchange', notify);
        const router = {
            getPath: () => parsePath(),
            getRoute: () => resolve(),
            navigate: (p) => { location.hash = p; },
            onChange: (fn) => { router._onChange = fn; },
            start: () => notify()
        };
        return router;
    }

    function createApp(options) {
        const root = options.root;
        const view = options.view;
        const store = options.store || null;
        const router = options.router || null;
        const onRoute = options.onRoute || null;
        let route = router ? router.getPath() : null;

        function commit() {
            const state = store ? store.getState() : {};
            const vnode = view({ state, route, store, router });
            render(vnode, root);
        }

        if (store) store.subscribe(commit);
        if (router) {
            router.onChange((path, data) => {
                route = path;
                const shouldRender = onRoute ? onRoute(path, data, store) !== false : true;
                if (shouldRender) commit();
            });
        }

        commit();
        return { redraw: commit };
    }

    Mini.h = h;
    Mini.render = render;
    Mini.createStore = createStore;
    Mini.createRouter = createRouter;
    Mini.createApp = createApp;

    global.Mini = Mini;
})(window);
