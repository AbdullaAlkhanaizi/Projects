// ===== routing.js =====
globalThis.safeLoadFeed = async function () {
    try {
        await globalThis.loadFeed();
    }
    catch (e) {
        console.error('loadFeed failed:', e);

        // Check if it's a critical HTTP error that should show an error page
        if (e.status && globalThis.handleHttpError(e, 'page-load')) {
            return; // Error page was shown
        }

        // For other errors, show empty feed
        if (typeof globalThis.renderFeed === 'function') {
            globalThis.renderFeed([]);
        }
    }
};

globalThis.onRouteChange = async function () {
    let route = location.hash || '';

    // Handle empty route - check authentication and redirect appropriately
    if (!route || route === '#' || route === '#/') {
        console.log('🔍 Empty route detected, checking authentication...');
        const user = await globalThis.hydrateUser();
        if (user) {
            console.log('✅ User authenticated, redirecting to feed');
            return globalThis.navigate('#/feed');
        } else {
            console.log('❌ User not authenticated, redirecting to login');
            return globalThis.navigate('#/login');
        }
    }

    // Handle login and signup pages - redirect if already authenticated
    if (route.startsWith('#/login')) {
        const user = await globalThis.hydrateUser();
        if (user) {
            console.log('✅ User already authenticated, redirecting from login to feed');
            return globalThis.navigate('#/feed');
        }
        return globalThis.renderLogin();
    }

    if (route.startsWith('#/signup')) {
        const user = await globalThis.hydrateUser();
        if (user) {
            console.log('✅ User already authenticated, redirecting from signup to feed');
            return globalThis.navigate('#/feed');
        }
        return globalThis.renderSignup();
    }

    // For all other routes, check if user is authenticated
    const user = await globalThis.hydrateUser();

    if (!user) {
        console.log('🔒 User not authenticated, redirecting to login');
        return globalThis.navigate('#/login');
    }

    if (route.startsWith('#/feed')) {
        await globalThis.safeLoadFeed();
        return;
    }

    if (route.startsWith('#/post/')) {
        const id = route.split('/')[2];
        await globalThis.renderPostPage(id);
        return;
    }

    // Handle unknown routes with 404 error page
    console.log('❌ Unknown route:', route);
    return globalThis.renderErrorPage(404, 'Page Not Found', `The page "${route}" could not be found.`);
};
