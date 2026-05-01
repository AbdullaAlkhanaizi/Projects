# Mini Framework Documentation

Mini is a tiny framework that provides:
- DOM abstraction with virtual nodes and a simple diffing renderer.
- Routing tied to the URL hash.
- Centralized state management with subscriptions.
- Event handling through delegated events (no direct addEventListener in app code).
- Inversion of control via `createApp`, which calls your view when state or route changes.

This repo also includes a TodoMVC app built with Mini (`src/app.js`).

## Quick start
1) Start a static server at the repo root.
   - Go: `go run main.go`
2) Open `http://localhost:8000` in a browser.

## Project structure
```
mini-framework/
  index.html
  style.css
  src/
    mini.js   // framework source
    app.js    // TodoMVC built with the framework
  main.go     // static file server
```
Run from the project root so relative paths in `index.html` resolve correctly.

## Core concepts

### Virtual nodes (DOM abstraction)
Mini represents the DOM as plain objects:
```
{
  tag: 'div',
  props: { class: 'card' },
  children: ['Hello']
}
```
`Mini.h()` creates these nodes, and `Mini.render()` turns them into real DOM.
Mini uses the field name `props` (same role as `attrs` in other virtual DOM examples).

Why this works:
- The virtual nodes are a complete description of the UI.
- When state changes, Mini creates a new tree and diffs it against the old one.
- Only the necessary DOM updates are applied.

### Event handling
Use props like `onClick`, `onInput`, `onKeydown`, etc. Mini uses event delegation:
- It attaches a single listener per event type to the root container.
- Each element stores a `data-on-<event>` handler id.
- When an event fires, Mini walks up the DOM to find the handler.

Why this works:
- Fewer listeners are attached.
- You never call `addEventListener` in app code.
- New elements added by re-rendering still work automatically.

### State management
`Mini.createStore()` is a tiny store with `getState`, `setState`, and `subscribe`.

Why this works:
- State is centralized and shared across views.
- Subscribers re-render on changes, so UI stays in sync.

### Routing
`Mini.createRouter()` uses hash-based routing.
- `#/, #/active, #/completed` map to routes.
- You can update state when the route changes.
- Paths are normalized to leading `/` (`active` becomes `/active`).

Why this works:
- The URL becomes the source of truth for navigation.
- Route changes trigger a re-render like any other state change.

### Inversion of control
`Mini.createApp()` owns the render loop and calls your view function whenever
state or route changes.

Why this works:
- Your code describes "what" the UI is for a given state.
- The framework decides "when" to render.

## API reference

### `Mini.h(tag, props, ...children)`
Creates a virtual node.

### `Mini.render(vnode, container)`
Renders a virtual node tree into a real DOM container.

### `Mini.createStore(initialState)`
Creates a store:
- `getState()`
- `setState(patch)` (object or function returning an object; result is shallow-merged into state)
- `subscribe(fn)` (returns unsubscribe)

### `Mini.createRouter(routes)`
Creates a hash router:
- `getPath()`
- `getRoute()`
Returns values from the `routes` table.
- `navigate(path)`
- `onChange(fn)`
- `start()`

Example:
```
const router = Mini.createRouter({
  '/': { filter: 'all' },
  '/active': { filter: 'active' },
  '/completed': { filter: 'completed' }
});
```

### `Mini.createApp({ root, view, store, router, onRoute })`
Bootstraps the app. The framework calls `view({ state, route, store, router })`
and renders the result.

If `onRoute` returns `false`, Mini will skip an extra render (useful when
`onRoute` updates the store and the store subscription already re-renders).

## Required examples

### Create an element
```
const node = Mini.h('div', null, 'Hello Mini');
Mini.render(node, document.getElementById('app'));
```
This creates a `<div>` with a text child and mounts it.

### Create an event
```
const button = Mini.h(
  'button',
  { onClick: () => alert('Clicked!') },
  'Click me'
);
Mini.render(button, document.getElementById('app'));
```
Events are declared in props using `onX` names.

### Nest elements
```
const list = Mini.h(
  'ul',
  null,
  Mini.h('li', null, 'First'),
  Mini.h('li', null, 'Second')
);
```
Children can be nested by passing more virtual nodes.

### Add attributes to an element
```
const input = Mini.h('input', {
  type: 'text',
  placeholder: 'Your name',
  class: 'field',
  dataset: { id: 'user-1' }
});
```
Attributes are provided in the `props` object.

## Example app flow (TodoMVC)
- The input updates `store.newTitle`.
- Pressing Enter adds a todo and clears the input.
- Clicking filters updates the hash; the router updates `store.filter`.
- The app re-renders whenever state changes.
