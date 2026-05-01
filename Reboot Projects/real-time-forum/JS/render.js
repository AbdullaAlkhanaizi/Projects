// ===== rendering.js =====

globalThis.renderLogin = function () {

  document.body.classList.add('auth-page');

  globalThis.app.innerHTML = `
    <section class="auth-wrap">
      <div class="card auth-card">
        <h2 style="margin-top:0;">Login</h2>
        <form id="loginForm" class="form-grid">
          <input class="input user" name="email" placeholder="Email or Nickname" required />
          <input class="input lock" name="password" type="password" placeholder="Password" required />
          
          <button class="btn-wide" type="submit">LOGIN</button>
          <p class="muted" style="text-align:center;margin:.5rem 0 0;">
            Don’t have an account? <a href="#/signup">Sign up</a>
          </p>
        </form>
      </div>
    </section>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email')?.trim();
    const password = fd.get('password')?.trim();
    if (!email || !password) return;

    try {
      await globalThis.fetchJSON('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await globalThis.hydrateUser();
      globalThis.navigate('#/feed');
    } catch (err) {
      globalThis.showMessage('Login failed', 'error');
      console.error(err);
    }
  });
};

globalThis.renderSignup = function () {
  document.body.classList.add('auth-page');

  globalThis.app.innerHTML = `
    <section class="auth-wrap">
      <div class="card auth-card">
        <h2 style="margin-top:0;">Sign Up</h2>
        <form id="signupForm" class="form-grid">
          <input class="input user" name="nickname" placeholder="Nickname" required />
          <input class="input user" name="email" type="email" placeholder="Email" required />
          <input class="input user" name="firstName" placeholder="First Name" required />
          <input class="input user" name="lastName" placeholder="Last Name" required />
          <input class="input" name="age" type="number" min="13" placeholder="Age" required />
          <select class="form-select" name="gender" required>
            
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input class="input lock" name="password" type="password" placeholder="Password" required />
          <button class="btn-wide" type="submit">SIGN UP</button>
          <p class="muted" style="text-align:center;margin:.5rem 0 0;">
            Already have an account? <a href="#/login">Login here</a>
          </p>
        </form>
      </div>
    </section>
  `;

  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      nickname: fd.get('nickname')?.trim(),
      email: fd.get('email')?.trim(),
      firstName: fd.get('firstName')?.trim(),
      lastName: fd.get('lastName')?.trim(),
      age: parseInt(fd.get('age'), 10),
      gender: fd.get('gender'),
      password: fd.get('password')?.trim()
    };

    try {
      await globalThis.fetchJSON('/api/signup', { method: 'POST', body: JSON.stringify(payload) });
      console.log('🎉 Registration successful, hydrating user...');
      await globalThis.hydrateUser();
      console.log('🚀 User hydrated, navigating to feed...');

      setTimeout(() => {
        if (globalThis.CURRENT_USER && globalThis.wsManager && !globalThis.wsManager.isConnected) {
          console.log('🔄 Ensuring WebSocket connection after registration...');
          globalThis.initializeWebSocket();
        }
      }, 1000);

      globalThis.navigate('#/feed');
      globalThis.showMessage('Welcome! Your account has been created and you are now online!', 'success');
    } catch (err) {
      globalThis.showMessage('Sign up failed', 'error');
      console.error(err);
    }
  });
};

globalThis.renderFeed = function (items, cats) {
  document.body.classList.remove('auth-page');

  const categories = Array.isArray(cats) ? cats : (globalThis.ALL_CATEGORIES || []);
  globalThis.FEED_CACHE = Array.isArray(items) ? items.slice() : [];

  console.log('renderFeed categories:', categories);

  // 🔑 Get URL parameter for filtering
  const u = new URL(location.href);
  const catFromURL = u.searchParams.get('categoryId') || '';

  // 🔑 Filter the posts before rendering
  let filteredItems = globalThis.FEED_CACHE;
  if (catFromURL) {
    const catId = parseInt(catFromURL, 10);
    filteredItems = globalThis.FEED_CACHE.filter(p =>
      (p.categories || []).some(c => c.id === catId)
    );
    console.log(`🔍 Filtering by category ${catId}: ${filteredItems.length} posts found`);
  }

  const checkboxList = categories.map(c => `
    <label style="display:inline-flex; gap:.4rem; align-items:center; margin:.2rem .8rem .2rem 0">
      <input type="checkbox" name="cats" value="${c.id}" />
      <span>${globalThis.escapeHTML(c.name)}</span>
    </label>
  `).join('');

  const filterOptions = ['<option value="">All</option>']
    .concat(categories.map(c => `<option value="${c.id}">${globalThis.escapeHTML(c.name)}</option>`))
    .join('');

  globalThis.app.innerHTML = `
    <section>
      < h2 id ="createposth2">Create Post</h2>

      <form id="newPost" style="display:grid; gap:.5rem; max-width:600px; margin-bottom:1rem;">
      <h2>Create New Post</h2>
        <input name="title" placeholder="Title" required />
        <textarea id="postContent" name="content" placeholder="Write something..." required rows="4"></textarea>
        <small id="postCounter" style="color:#777">0/256</small>
        <div>
          <div style="font-size:.9rem; color:#555; margin-bottom:.25rem;">Categories (pick 1–3):</div>
          ${checkboxList || '<div style="color:#a00">No categories available</div>'}
        </div>
        <button class="btn-primary">Post</button>
      </form>

      <div style="display:flex; gap:.5rem; align-items:center; margin:.5rem 0 1rem;">
        <label for="catFilter" style="font-size:.9rem; color:#555; margin-left:8rem">Filter:</label>
        <select id="catFilter">${filterOptions}</select>
        <button class="btn-primary" id="clearFilter" type="button">Clear</button>
      </div>

      <section id="posts">
        ${filteredItems.map(p => `
          <article class="post-card" data-post-id="${p.id}" style="background:#fff; padding:12px; border-radius:6px; margin-bottom:10px; box-shadow:0 1px 4px rgba(0,0,0,.05);">
            <h3 style="margin:0 0 4px 0">${globalThis.escapeHTML(p.title)}</h3>
            <small style="color:#666">by ${globalThis.escapeHTML(p.author || '')} • ${new Date((p.createdAt || 0) * 1000).toLocaleString()}</small>
            <p style="margin:.5rem 0 0 0">${globalThis.escapeHTML(p.content)}</p>
            <div style="margin-top:.5rem; display:flex; flex-wrap:wrap; gap:.4rem;">
              ${(p.categories || []).map(c => `<span style="background:#eef; color:#334; padding:.15rem .45rem; border-radius:9999px; font-size:.75rem;">${globalThis.escapeHTML(c.name)}</span>`).join('')}
            </div>
          </article>
        `).join('')}
      </section>
    </section>
  `;

  document.getElementById('newPost').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title')?.toString().trim();
    const content = fd.get('content')?.toString().trim();

    const categoryIds = Array.from(document.querySelectorAll('input[name="cats"]:checked'))
      .map(i => parseInt(i.value, 10))
      .filter(Number.isInteger);

    if (categoryIds.length < 1 || categoryIds.length > 3) {
      globalThis.showMessage('Pick 1–3 categories', 'error');
      return;
    }
    if (!title || !content) return;
    if (content.length > 256) {
      globalThis.showMessage('Post content too long (max 256)', 'error');
      return;
    }

    try {
      await globalThis.fetchJSON('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content, categoryIds })
      });
      e.target.reset();
      await globalThis.loadFeed();
      globalThis.showMessage('Posted!');
    } catch (err) {
      if (err.status === 401) { globalThis.showMessage('Please log in to post', 'error'); globalThis.navigate('#/login'); }
      else { globalThis.showMessage('Failed to create post', 'error'); }
      console.error(err);
    }
  });

  const catFilter = document.getElementById('catFilter');
  globalThis.attachLimiter(document.getElementById('postContent'), 256, document.getElementById('postCounter'));
  catFilter.value = catFromURL;
  catFilter.addEventListener('change', () => {
    const v = catFilter.value;
    const u2 = new URL(location.href);
    if (v) u2.searchParams.set('categoryId', v); else u2.searchParams.delete('categoryId');
    history.replaceState(null, '', u2.toString());
    globalThis.loadFeed();
  });
  document.getElementById('clearFilter').addEventListener('click', () => {
    const u2 = new URL(location.href);
    u2.searchParams.delete('categoryId');
    history.replaceState(null, '', u2.toString());
    catFilter.value = '';
    globalThis.loadFeed();
  });
  document.querySelectorAll('[data-post-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-post-id');
      globalThis.navigate(`#/post/${id}`);
    });
  });
};

globalThis.renderPostPage = async function (postId) {
  let post = (globalThis.FEED_CACHE || []).find(p => p.id === postId);

  if (!post) {
    try {
      const data = await globalThis.fetchJSON('/api/posts?limit=20');
      globalThis.FEED_CACHE = data?.items || [];
      post = globalThis.FEED_CACHE.find(p => p.id === postId);
    } catch { }
  }
  if (!post) {
    return globalThis.renderErrorPage(404, 'Post Not Found', `The post with ID "${postId}" could not be found.`);
  }

  globalThis.app.innerHTML = `
      <section>
        <button class="btn-primary back-btn" id="backToFeed">← Back</button>
        <div class="post-detail">
          <h2>${globalThis.escapeHTML(post.title)}</h2>
          <div class="meta">
            by ${globalThis.escapeHTML(post.author || 'anon')} • ${new Date((post.createdAt || 0) * 1000).toLocaleString()}
            ${(post.categories || []).length ? ' • ' + post.categories.map(c => globalThis.escapeHTML(c.name)).join(', ') : ''}
          </div>
          <p>${globalThis.escapeHTML(post.content)}</p>
        </div>

        <div class="comments">
          <h3>Comments</h3>
          <div id="commentsList">Loading…</div>

          <div id="commentForm" class="comment-form" style="${globalThis.CURRENT_USER ? '' : 'display:none'}">
            <textarea id="commentInput" placeholder="Write a comment…"></textarea>
            <button class="btn-primary" id="commentSend">Send</button>
          </div>
          <p id="commentGuest" style="${globalThis.CURRENT_USER ? 'display:none' : ''}">You must be logged in to comment.</p>
        </div>
      </section>
    `;

  document.getElementById('backToFeed').addEventListener('click', () => globalThis.navigate('#/feed'));
  await globalThis.loadComments(postId);

  const sendBtn = document.getElementById('commentSend');
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      if (!globalThis.CURRENT_USER) { globalThis.navigate('#/login'); return; }
      const ta = document.getElementById('commentInput');
      const content = (ta.value || '').trim();
      if (!content) return;
      try {
        const newComment = await globalThis.fetchJSON(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
        globalThis.appendComment(newComment);
        ta.value = '';
      } catch (e) {
        globalThis.showMessage('Failed to post comment', 'error');
      }
    });
  }
};

// ===== Error Pages =====
globalThis.renderErrorPage = function (errorCode, title, message, showBackButton = true) {
  document.body.classList.remove('auth-page');

  const errorMessages = {
    400: { title: 'Bad Request', message: 'The request could not be understood by the server.' },
    401: { title: 'Unauthorized', message: 'You need to log in to access this page.' },
    403: { title: 'Forbidden', message: 'You do not have permission to access this resource.' },
    404: { title: 'Page Not Found', message: 'The page you are looking for could not be found.' },
    429: { title: 'Too Many Requests', message: 'You have made too many requests. Please try again later.' },
    500: { title: 'Internal Server Error', message: 'Something went wrong on our end. Please try again later.' },
    503: { title: 'Service Unavailable', message: 'The service is temporarily unavailable. Please try again later.' }
  };

  const errorInfo = errorMessages[errorCode] || { title: 'Error', message: 'An unexpected error occurred.' };
  const finalTitle = title || errorInfo.title;
  const finalMessage = message || errorInfo.message;

  globalThis.app.innerHTML = `
    <section class="error-page">
      <div class="error-container">
        <div class="error-icon">
          <span class="error-code">${errorCode}</span>
        </div>
        <h1 class="error-title">${globalThis.escapeHTML(finalTitle)}</h1>
        <p class="error-message">${globalThis.escapeHTML(finalMessage)}</p>
        <div class="error-actions">
          ${showBackButton ? '<button class="btn-primary" id="goBack">← Go Back</button>' : ''}
          <button class="btn-primary" id="goHome">🏠 Home</button>
          ${errorCode === 401 ? '<button class="btn-primary" id="goLogin">🔐 Login</button>' : ''}
        </div>
      </div>
    </section>
  `;

  // Add event listeners
  const goBackBtn = document.getElementById('goBack');
  const goHomeBtn = document.getElementById('goHome');
  const goLoginBtn = document.getElementById('goLogin');

  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        globalThis.navigate('#/feed');
      }
    });
  }

  if (goHomeBtn) {
    goHomeBtn.addEventListener('click', () => {
      globalThis.navigate('#/feed');
    });
  }

  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => {
      globalThis.navigate('#/login');
    });
  }
};
