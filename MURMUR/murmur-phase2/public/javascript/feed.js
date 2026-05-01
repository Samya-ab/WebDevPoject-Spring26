

// ============================================================
// HELPERS
// ============================================================
const ls = {
    get: (k) => {
        try {
            return JSON.parse(localStorage.getItem(k));
        } catch {
            return null;
        }
    },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function showConfirm(message, onConfirm, title = 'Confirm action') {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    if (!modal || !titleEl || !messageEl || !okBtn || !cancelBtn) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add('open');

    const closeModal = () => {
        modal.classList.remove('open');
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.onclick = null;
    };

    okBtn.onclick = () => {
        closeModal();
        onConfirm();
    };

    cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

function esc(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function uid() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// ============================================================
// GLOBAL STATE
// ============================================================
let currentUser = null;
let activeTab = 'following'; // 'following' or 'everyone'

// ============================================================
// BOOTSTRAP & SESSION
// ============================================================
function bootstrap() {
    // Ensure data structures exist
    if (!ls.get('users')) ls.set('users', []);
    if (!ls.get('posts')) ls.set('posts', []);

    const session = ls.get('session');
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }

    const users = ls.get('users');
    currentUser = users.find((u) => u.id === session.userId);
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

// ============================================================
// RENDER POSTS (depends on activeTab)
// ============================================================
function renderPosts() {
    const posts = ls.get('posts') || [];
    let filtered = [];

    if (activeTab === 'following') {
        const followingIds = currentUser.following || [];
        filtered = posts.filter((p) => followingIds.includes(p.authorId));
    } else {
        filtered = [...posts];
    }

    // Sort newest first
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    const container = document.getElementById('posts-container');
    const emptyDiv = document.getElementById('feed-empty');

    if (!container) return;

    container.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyDiv) emptyDiv.hidden = false;
        container.style.display = 'none';
        return;
    }

    if (emptyDiv) emptyDiv.hidden = true;
    container.style.display = 'flex';

    filtered.forEach((post) => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

function createPostElement(post) {
    const users = ls.get('users') || [];
    const author = users.find((u) => u.id === post.authorId) || {
        username: 'unknown',
        avatarUrl: '',
    };

    const div = document.createElement('article');
    div.className = 'post-card';
    div.setAttribute('data-post-id', post.id);

    // Header: avatar + author info
    const header = document.createElement('header');
    header.className = 'post-header';

    const avatar = document.createElement('div');
    avatar.className = 'avatar avatar-md';

    if (author.avatarUrl) {
        avatar.innerHTML = `<img src="${author.avatarUrl}" alt="avatar">`;
    } else {
        avatar.textContent = author.username.charAt(0).toUpperCase();
    }

    const authorInfo = document.createElement('div');
    authorInfo.innerHTML = `
        <strong>${esc(author.username)}</strong>
        <div class="post-meta">
            <span>@${esc(author.username)}</span> · <span>${timeAgo(post.timestamp)}</span>
        </div>
    `;
    header.appendChild(avatar);
    header.appendChild(authorInfo);

    // Content (caption)
    const content = document.createElement('p');
    content.className = 'post-content';
    content.textContent = post.caption || '';

    // Stats (likes & comments)
    const stats = document.createElement('div');
    stats.className = 'post-stats';
    stats.innerHTML = `
        <span>❤️ ${(post.likes || []).length} likes</span>
        <span>💬 ${(post.comments || []).length} comments</span>
    `;

    // Action row: Like button + Delete (if owner)
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    actions.style.display = 'flex';
    actions.style.gap = '12px';
    actions.style.marginTop = '12px';

    const likeBtn = document.createElement('button');
    const isLiked = (post.likes || []).includes(currentUser.id);
    likeBtn.className = 'like-btn';
    likeBtn.innerHTML = isLiked ? '❤️ Liked' : '❤️ Like';
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(post.id);
    });

    actions.appendChild(likeBtn);

    if (post.authorId === currentUser.id) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.style.border = 'none';
        deleteBtn.style.background = 'none';
        deleteBtn.style.color = 'var(--danger)';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm('Delete this post?', () => {
                deletePost(post.id);
            }, 'Delete post');
        });
        actions.appendChild(deleteBtn);
    }

    div.appendChild(header);
    div.appendChild(content);
    if (post.imageUrl) {
        const img = document.createElement('img');
        img.src = post.imageUrl;
        img.alt = 'post image';
        img.className = 'post-image';

        div.appendChild(img);
    }

    div.appendChild(stats);
    div.appendChild(actions);

    // Make whole post clickable to go to single view
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
        window.location.href = `post.html?id=${post.id}`;
    });

    return div;
}

// ============================================================
// LIKE / UNLIKE
// ============================================================
function toggleLike(postId) {
    const posts = ls.get('posts') || [];
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) return;

    posts[index].likes = posts[index].likes || [];
    const likedIndex = posts[index].likes.indexOf(currentUser.id);

    if (likedIndex === -1) {
        posts[index].likes.push(currentUser.id);
    } else {
        posts[index].likes.splice(likedIndex, 1);
    }

    ls.set('posts', posts);

    // Re-render posts to update like counts and button states
    renderPosts();
    // Also refresh suggestions if needed (no)
}

// ============================================================
// DELETE POST
// ============================================================
function deletePost(postId) {
    let posts = ls.get('posts') || [];
    posts = posts.filter((p) => p.id !== postId);
    ls.set('posts', posts);
    renderPosts();
    toast('Post deleted');
}

// ============================================================
// CREATE NEW POST
// ============================================================
function setupCreatePost() {
    const textarea = document.getElementById('post-content');
    const submitBtn = document.getElementById('submit-post-btn');
    const imageFileInput = document.getElementById('post-image-file');
    const charCountSpan = document.getElementById('char-count');
    if (!textarea || !submitBtn) return;

    const updateCharCount = () => {
        const remaining = 280 - textarea.value.length;
        if (charCountSpan) charCountSpan.textContent = remaining;
        submitBtn.disabled = textarea.value.trim().length === 0;
    };

    textarea.addEventListener('input', updateCharCount);
    updateCharCount();

    submitBtn.addEventListener('click', async () => {
        const content = textarea.value.trim();
        const file = imageFileInput ? imageFileInput.files[0] : null;

        if (!content && !file) return;

        let imageUrl = '';
        if (file) {
            imageUrl = await fileToDataUrl(file);
        }

        const newPost = {
            id: uid(),
            authorId: currentUser.id,
            caption: content,
            timestamp: Date.now(),
            likes: [],
            comments: [],
            imageUrl: imageUrl,
        };

        const posts = ls.get('posts') || [];
        posts.unshift(newPost);
        ls.set('posts', posts);

        textarea.value = '';
        if (imageFileInput) imageFileInput.value = '';
        updateCharCount();

        renderPosts();
        toast('Post published!');
    });
}

// ============================================================
// FOLLOW / UNFOLLOW (for suggestions)
// ============================================================
function toggleFollow(targetUserId, btn) {
    const users = ls.get('users') || [];
    const currentUserIdx = users.findIndex((u) => u.id === currentUser.id);
    const targetUserIdx = users.findIndex((u) => u.id === targetUserId);

    if (currentUserIdx === -1 || targetUserIdx === -1) return;

    const cu = users[currentUserIdx];
    const tu = users[targetUserIdx];

    cu.following = cu.following || [];
    tu.followers = tu.followers || [];

    const alreadyFollowing = cu.following.includes(targetUserId);
    if (alreadyFollowing) {
        cu.following = cu.following.filter((id) => id !== targetUserId);
        tu.followers = tu.followers.filter((id) => id !== cu.id);
        btn.textContent = 'Follow';
        btn.className = 'btn btn-primary';
        toast(`Unfollowed @${tu.username}`);
    } else {
        cu.following.push(targetUserId);
        tu.followers.push(cu.id);
        btn.textContent = 'Following';
        btn.className = 'btn btn-secondary';
        toast(`Followed @${tu.username}`);
    }

    ls.set('users', users);
    // Update currentUser reference
    currentUser = cu;
    // Re-render suggestions and feed (feed depends on following list)
    renderSuggestions();
    renderPosts();
}

// ============================================================
// SUGGESTIONS (Who to Follow)
// ============================================================
function renderSuggestions() {
    const users = ls.get('users') || [];
    const suggestionsList = document.getElementById('suggestions-list');
    if (!suggestionsList) return;

    // Users not followed by current user and not the current user
    const followingIds = currentUser.following || [];
    const suggestions = users.filter(
        (u) => u.id !== currentUser.id && !followingIds.includes(u.id)
    );

    // Take first 5 suggestions
    const topSuggestions = suggestions.slice(0, 5);

    if (topSuggestions.length === 0) {
        suggestionsList.innerHTML = '<li style="color: var(--color-text-muted);">No suggestions for now</li>';
        return;
    }

    suggestionsList.innerHTML = '';
    topSuggestions.forEach((user) => {
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '12px';
        li.style.padding = '8px 0';
        li.style.borderBottom = '1px solid var(--color-border)';

        const avatar = document.createElement('div');
        avatar.className = 'avatar avatar-sm';
        if (user.avatarUrl) {
            avatar.innerHTML = `<img src="${user.avatarUrl}" alt="avatar">`;
        } else {
            avatar.textContent = user.username.charAt(0).toUpperCase();
        }

        const info = document.createElement('div');
        info.style.flex = '1';
        info.innerHTML = `
            <div><strong>${esc(user.username)}</strong></div>
            <div style="font-size: 12px; color: var(--color-text-muted);">@${esc(user.username)}</div>
        `;

        const followBtn = document.createElement('button');
        followBtn.textContent = 'Follow';
        followBtn.className = 'btn btn-primary';
        followBtn.style.padding = '4px 12px';
        followBtn.style.fontSize = '12px';
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFollow(user.id, followBtn);
        });

        li.appendChild(avatar);
        li.appendChild(info);
        li.appendChild(followBtn);
        suggestionsList.appendChild(li);
    });
}

// ============================================================
// SEARCH USERS
// ============================================================
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    let debounceTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
            searchResults.hidden = true;
            searchResults.innerHTML = '';
            return;
        }

        debounceTimeout = setTimeout(() => {
            const users = ls.get('users') || [];
            const matches = users.filter(
                (u) => u.username.toLowerCase().includes(query) && u.id !== currentUser.id
            );

            if (matches.length === 0) {
                searchResults.innerHTML = '<li style="padding: 8px;">No users found</li>';
                searchResults.hidden = false;
                return;
            }

            searchResults.innerHTML = '';
            matches.forEach((user) => {
                const li = document.createElement('li');
                li.style.padding = '8px';
                li.style.cursor = 'pointer';
                li.style.borderBottom = '1px solid var(--color-border)';
                li.textContent = `@${user.username}`;
                li.addEventListener('click', () => {
                    window.location.href = `profile.html?uid=${user.id}`;
                });
                searchResults.appendChild(li);
            });
            searchResults.hidden = false;
        }, 300);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput) {
            searchResults.hidden = true;
        }
    });
}

// ============================================================
// SIDEBAR & NAVIGATION
// ============================================================
function updateSidebar() {
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarHandle = document.getElementById('sidebar-handle');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const navAvatar = document.getElementById('nav-avatar');
    const createPostAvatar = document.getElementById('create-post-avatar');
    const navProfileLink = document.getElementById('nav-profile-link');

    if (sidebarUsername) sidebarUsername.textContent = currentUser.username;
    if (sidebarHandle) sidebarHandle.textContent = `@${currentUser.username}`;
    if (navProfileLink) navProfileLink.href = `profile.html?uid=${currentUser.id}`;

    // Helper: fill an avatar element with either an img or initials
    function fillAvatar(el) {
        if (!el) return;
        if (currentUser.avatarUrl) {
            el.innerHTML = `<img src="${currentUser.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:99px;">`;
        } else {
            el.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }

    fillAvatar(sidebarAvatar);
    fillAvatar(navAvatar);
    fillAvatar(createPostAvatar);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('session');
            window.location.href = 'login.html';
        });
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.feed-tab');
    if (tabs.length === 0) return;

    tabs.forEach((tab, idx) => {
        tab.addEventListener('click', () => {
            // Update active class
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = idx === 0 ? 'following' : 'everyone';
            renderPosts();
        });
    });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!bootstrap()) return;

    updateSidebar();
    setupLogout();
    setupCreatePost();
    setupTabs();
    renderSuggestions();
    setupSearch();
    renderPosts(); // initial render
});