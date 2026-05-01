// TodoMVC app using Mini framework
(function () {
    const { h, createStore, createRouter, createApp } = window.Mini;

    const STORAGE_KEY = 'mini-todos-v1';

    function loadTodos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    const store = createStore({
        todos: loadTodos(),
        filter: 'all',
        newTitle: '',
        editingId: null,
        editingText: ''
    });

    store.subscribe(s => localStorage.setItem(STORAGE_KEY, JSON.stringify(s.todos)));

    const router = createRouter({
        '/': { filter: 'all' },
        '/active': { filter: 'active' },
        '/completed': { filter: 'completed' }
    });

    function routeToFilter(route) {
        return route && route.filter ? route.filter : 'all';
    }

    function uid() { return Math.random().toString(36).slice(2, 9); }

    function addTodo(title) {
        const trimmed = (title || '').trim();
        if (!trimmed) return;
        store.setState(s => ({
            todos: s.todos.concat({ id: uid(), title: trimmed, completed: false }),
            newTitle: ''
        }));
    }

    function updateNewTitle(value) {
        store.setState({ newTitle: value });
    }

    function toggleTodo(id, checked) {
        store.setState(s => ({
            todos: s.todos.map(t => t.id === id ? Object.assign({}, t, { completed: checked }) : t)
        }));
    }

    function toggleAll(checked) {
        store.setState(s => ({
            todos: s.todos.map(t => Object.assign({}, t, { completed: checked }))
        }));
    }

    function removeTodo(id) {
        store.setState(s => ({ todos: s.todos.filter(t => t.id !== id) }));
    }

    function clearCompleted() {
        store.setState(s => ({ todos: s.todos.filter(t => !t.completed) }));
    }

    function startEdit(todo) {
        store.setState({ editingId: todo.id, editingText: todo.title });
    }

    function updateEdit(value) {
        store.setState({ editingText: value });
    }

    function cancelEdit() {
        store.setState({ editingId: null, editingText: '' });
    }

    function saveEdit(id, value) {
        const trimmed = (value || '').trim();
        if (!trimmed) {
            removeTodo(id);
            return;
        }
        store.setState(s => ({
            todos: s.todos.map(t => t.id === id ? Object.assign({}, t, { title: trimmed }) : t),
            editingId: null,
            editingText: ''
        }));
    }

    function visibleTodos(state) {
        if (state.filter === 'active') return state.todos.filter(t => !t.completed);
        if (state.filter === 'completed') return state.todos.filter(t => t.completed);
        return state.todos;
    }

    function Header(state) {
        return h('header', { class: 'header' },
            h('h1', null, 'todos'),
            h('input', {
                class: 'new-todo',
                placeholder: 'What needs to be done?',
                autofocus: true,
                value: state.newTitle,
                onInput: (e) => updateNewTitle(e.target.value),
                onKeydown: (e) => {
                    if (e.key === 'Enter') addTodo(e.target.value);
                }
            })
        );
    }

    function TodoItem(todo, state) {
        const isEditing = state.editingId === todo.id;
        const className = (todo.completed ? 'completed ' : '') + (isEditing ? 'editing' : '');
        const editValue = isEditing ? state.editingText : todo.title;

        return h('li', { class: className.trim(), dataset: { id: todo.id } },
            h('div', { class: 'view' },
                h('input', {
                    class: 'toggle',
                    type: 'checkbox',
                    checked: todo.completed,
                    onChange: (e) => toggleTodo(todo.id, e.target.checked)
                }),
                h('label', { onDblClick: () => startEdit(todo) }, todo.title),
                h('button', { class: 'destroy', onClick: () => removeTodo(todo.id) })
            ),
            h('input', {
                class: 'edit',
                value: editValue,
                onInput: (e) => updateEdit(e.target.value),
                onKeydown: (e) => {
                    if (e.key === 'Enter') saveEdit(todo.id, e.target.value);
                    if (e.key === 'Escape') cancelEdit();
                },
                onBlur: (e) => {
                    if (state.editingId === todo.id) saveEdit(todo.id, e.target.value);
                },
                autofocus: isEditing
            })
        );
    }

    function Main(state) {
        const todos = state.todos;
        const allCompleted = todos.length > 0 && todos.every(t => t.completed);
        const visible = visibleTodos(state);
        const hiddenStyle = { display: todos.length ? '' : 'none' };

        return h('section', { class: 'main', style: hiddenStyle },
            h('input', {
                id: 'toggle-all',
                class: 'toggle-all',
                type: 'checkbox',
                checked: allCompleted,
                onChange: (e) => toggleAll(e.target.checked)
            }),
            h('label', { 'for': 'toggle-all' }, 'Mark all as complete'),
            h('ul', { class: 'todo-list' },
                visible.map(t => TodoItem(t, state))
            )
        );
    }

    function Footer(state) {
        const todos = state.todos;
        const remaining = todos.filter(t => !t.completed).length;
        const completed = todos.length - remaining;
        const hiddenStyle = { display: todos.length ? '' : 'none' };

        return h('footer', { class: 'footer', style: hiddenStyle },
            h('span', { class: 'todo-count' },
                h('strong', null, String(remaining)),
                ' ',
                remaining === 1 ? 'item' : 'items',
                ' left'
            ),
            h('ul', { class: 'filters' },
                h('li', null, h('a', { href: '#/', class: state.filter === 'all' ? 'selected' : '' }, 'All')),
                h('li', null, h('a', { href: '#/active', class: state.filter === 'active' ? 'selected' : '' }, 'Active')),
                h('li', null, h('a', { href: '#/completed', class: state.filter === 'completed' ? 'selected' : '' }, 'Completed'))
            ),
            h('button', {
                class: 'clear-completed',
                onClick: clearCompleted,
                style: { display: completed ? '' : 'none' }
            }, 'Clear completed')
        );
    }

    function App(ctx) {
        const state = ctx.state;
        return h('section', { class: 'todoapp' },
            Header(state),
            Main(state),
            Footer(state)
        );
    }

    createApp({
        root: document.getElementById('app'),
        store,
        router,
        onRoute: (path, data) => {
            store.setState({ filter: routeToFilter(data) });
            return false;
        },
        view: App
    });

    router.start();
})();
