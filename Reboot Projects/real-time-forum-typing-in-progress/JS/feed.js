// ===== feed.js =====

// Load categories once
globalThis.loadCategories = async function () {
    const data = await globalThis.fetchJSON('/api/categories');
    globalThis.ALL_CATEGORIES = data?.items || [];
    return globalThis.ALL_CATEGORIES;
};

// Fetch ALL posts (no filter)
globalThis.fetchAllPosts = async function () {
    const data = await globalThis.fetchJSON('/api/posts?limit=1000'); // large enough to get all
    return data?.items || [];
};

// Fetch filtered posts (optional if you want backend filtering)
globalThis.fetchPostsByCategory = async function (catId) {
    const qs = `?limit=20&categoryId=${encodeURIComponent(catId)}`;
    const data = await globalThis.fetchJSON('/api/posts' + qs);
    return data?.items || [];
};

// Main feed loader
globalThis.loadFeed = async function () {
    const [cats, items] = await Promise.all([
        globalThis.loadCategories(),
        globalThis.fetchAllPosts()
    ]);

    // Save originals
    globalThis.ALL_POSTS = items;
    globalThis.CURRENT_POSTS = [...items];

    globalThis.renderFeed(globalThis.CURRENT_POSTS, cats);
};

// Apply filter (client-side)
globalThis.applyFilter = function (criteriaFn) {
    globalThis.CURRENT_POSTS = globalThis.ALL_POSTS.filter(criteriaFn);
    globalThis.renderFeed(globalThis.CURRENT_POSTS, globalThis.ALL_CATEGORIES);
};

// Reset to all posts
globalThis.resetFilter = function () {
    globalThis.CURRENT_POSTS = [...globalThis.ALL_POSTS];
    globalThis.renderFeed(globalThis.CURRENT_POSTS, globalThis.ALL_CATEGORIES);
};
