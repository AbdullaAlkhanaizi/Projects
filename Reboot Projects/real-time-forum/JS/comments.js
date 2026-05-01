// ===== comments.js =====
globalThis.loadComments = async function (postId) {
    const list = document.getElementById('commentsList');
    list.textContent = 'Loading comments…';
    try {
        const comments = await globalThis.fetchJSON(`/api/posts/${postId}/comments`);
        if (!comments || comments.length === 0) {
            list.innerHTML = '<p>No comments yet.</p>';
            return;
        }
        list.innerHTML = '';
        comments.forEach(globalThis.appendComment);
    } catch (e) {
        list.textContent = 'Failed to load comments.';
    }
};

globalThis.appendComment = function (c) {
    const list = document.getElementById('commentsList');
    const wrap = document.createElement('div');
    wrap.className = 'comment';

    const head = document.createElement('div');
    head.className = 'comment-head';
    // handle both ISO strings and Unix timestamps
    const date = c.created_at
        ? new Date(isNaN(c.created_at) ? c.created_at : c.created_at * 1000).toLocaleString()
        : '';
    head.textContent = `${c.author || c.username || 'anon'} • ${date}`;

    const body = document.createElement('div');
    body.className = 'comment-body';
    body.textContent = c.content || '';

    wrap.append(head, body);
    list.appendChild(wrap);
};

// ===== comment form handler =====
globalThis.initCommentForm = function (postId) {
    const form = document.getElementById('commentForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const content = fd.get('content')?.trim();
        if (!content) return;

        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!res.ok) throw new Error('Failed to post comment');

            // instead of appending incomplete data, reload the whole list
            await globalThis.loadComments(postId);

            form.reset();
        } catch (err) {
            alert('Could not save comment. Please try again.');
        }
    });
};
