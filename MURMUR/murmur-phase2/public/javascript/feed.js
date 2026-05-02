

// ============================================================
// HELPERS
// ============================================================
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

async function loadCurrentUser() {
    const userId = localStorage.getItem("currentUserId");

    if (!userId) {
        window.location.href = "login.html";
        return;
    }

    currentUser = await api(`/api/users/${userId}`);
}

// ============================================================
// BOOTSTRAP & SESSION
// ============================================================

async function loadFeed() {
    try {
        const posts =
            activeTab === "following" ?
                await api("/api/posts/following") :
                await api("/api/posts");

        renderPosts(posts);
    } catch (err) {
        window.location.href = "login.html";
    }
}

function bootstrap() { return true; }

// ============================================================
// RENDER POSTS (depends on activeTab)
// ============================================================
function renderPosts(posts) {
    const container = document.getElementById("posts-container");
    const emptyDiv = document.getElementById("feed-empty");

    if (!container) return;

    container.innerHTML = "";

    if (!posts || posts.length === 0) {
        if (emptyDiv) emptyDiv.hidden = false;
        container.style.display = "none";
        return;
    }

    if (emptyDiv) emptyDiv.hidden = true;
    container.style.display = "flex";

    posts.forEach((post) => {
        container.appendChild(createPostElement(post));
    });
}

function createPostElement(post) {
    const author = post.author || post.user || {
        username: "unknown",
        avatarUrl: "",
    };

    const likeCount = post._count?.likes ?? post.likes?.length ?? 0;
    const commentCount = post._count?.comments ?? post.comments?.length ?? 0;
    const isLiked = post.likedByMe || post.isLiked || false;
    const isOwner = post.isOwner || post.authorId === currentUser?.id;

    const div = document.createElement("article");
    div.className = "post-card";
    div.setAttribute("data-post-id", post.id);

    const header = document.createElement("header");
    header.className = "post-header";

    const avatar = document.createElement("div");
    avatar.className = "avatar avatar-md";

    if (author.avatarUrl) {
        avatar.innerHTML = `<img src="${esc(author.avatarUrl)}" alt="avatar">`;
    } else {
        avatar.textContent = author.username?.charAt(0).toUpperCase() || "?";
    }

    const authorInfo = document.createElement("div");
    authorInfo.innerHTML = `
        <strong>${esc(author.username || "unknown")}</strong>
        <div class="post-meta">
            <span>@${esc(author.username || "unknown")}</span> · 
            <span>${timeAgo(new Date(post.createdAt || post.timestamp).getTime())}</span>
        </div>
    `;

    header.appendChild(avatar);
    header.appendChild(authorInfo);

    const content = document.createElement("p");
    content.className = "post-content";
    content.textContent = post.caption || "";

    const stats = document.createElement("div");
    stats.className = "post-stats";
    stats.innerHTML = `
        <span>❤️ ${likeCount} likes</span>
        <span>💬 ${commentCount} comments</span>
    `;

    const actions = document.createElement("div");
    actions.className = "post-actions";
    actions.style.display = "flex";
    actions.style.gap = "12px";
    actions.style.marginTop = "12px";

    const likeBtn = document.createElement("button");
    likeBtn.className = "like-btn";
    likeBtn.innerHTML = isLiked ? "❤️ Liked" : "❤️ Like";

    likeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await toggleLike(post.id);
    });

    actions.appendChild(likeBtn);

    if (isOwner) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "🗑️ Delete";
        deleteBtn.style.border = "none";
        deleteBtn.style.background = "none";
        deleteBtn.style.color = "var(--danger)";
        deleteBtn.style.cursor = "pointer";

        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showConfirm("Delete this post?", async () => {
                await deletePost(post.id);
            }, "Delete post");
        });

        actions.appendChild(deleteBtn);
    }

    div.appendChild(header);
    div.appendChild(content);

    if (post.imageUrl) {
        const img = document.createElement("img");
        img.src = post.imageUrl;
        img.alt = "post image";
        img.className = "post-image";
        div.appendChild(img);
    }

    div.appendChild(stats);
    div.appendChild(actions);

    div.style.cursor = "pointer";
    div.addEventListener("click", () => {
        window.location.href = `post.html?id=${post.id}`;
    });

    return div;
}

// ============================================================
// LIKE / UNLIKE
// ============================================================
async function toggleLike(postId) {
    try {
        await api(`/api/posts/${postId}/like`, {
            method: "POST",
        });

        await loadFeed();
    } catch (err) {
        toast(err.message);
    }
}

// ============================================================
// DELETE POST
// ============================================================
async function deletePost(postId) {
    try {
        await api(`/api/posts/${postId}`, {
            method: "DELETE",
        });

        await loadFeed();
        toast("Post deleted");
    } catch (err) {
        toast(err.message);
    }
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

    submitBtn.addEventListener("click", async () => {
        const caption = textarea.value.trim();
        const file = imageFileInput ? imageFileInput.files[0] : null;

        if (!caption && !file) return;

        let imageUrl = "";
        if (file) {
            imageUrl = await fileToDataUrl(file);
        }

        try {
            await api("/api/posts", {
                method: "POST",
                body: JSON.stringify({
                    caption,
                    imageUrl,
                }),
            });

            textarea.value = "";
            if (imageFileInput) imageFileInput.value = "";
            updateCharCount();

            await loadFeed();
            toast("Post published!");
        } catch (err) {
            toast(err.message);
        }
    });
}

// ============================================================
// FOLLOW / UNFOLLOW (for suggestions)
// ============================================================
async function toggleFollow(targetUserId) {
    try {
        await api(`/api/follows/${targetUserId}`, {
            method: "POST",
        });

        await renderSuggestions();
        await loadFeed();

        toast("Follow updated");
    } catch (err) {
        toast(err.message);
    }
}

// ============================================================
// SUGGESTIONS (Who to Follow)
// ============================================================
async function renderSuggestions() {
    const suggestionsList = document.getElementById("suggestions-list");
    if (!suggestionsList) return;

    try {
        const suggestions = await api("/api/users/suggestions");

        if (!suggestions.length) {
            suggestionsList.innerHTML = '<li style="color: var(--color-text-muted);">No suggestions for now</li>';
            return;
        }

        suggestionsList.innerHTML = "";

        suggestions.forEach((user) => {
            const li = document.createElement("li");
            li.className = "suggestion-item";
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.gap = "12px";
            li.style.padding = "8px 0";
            li.style.borderBottom = "1px solid var(--color-border)";

            const avatar = document.createElement("div");
            avatar.className = "avatar avatar-sm";

            if (user.avatarUrl) {
                avatar.innerHTML = `<img src="${esc(user.avatarUrl)}" alt="avatar">`;
            } else {
                avatar.textContent = user.username.charAt(0).toUpperCase();
            }

            const info = document.createElement("div");
            info.style.flex = "1";
            info.innerHTML = `
                <div><strong>${esc(user.username)}</strong></div>
                <div style="font-size: 12px; color: var(--color-text-muted);">@${esc(user.username)}</div>
            `;

            const followBtn = document.createElement("button");
            followBtn.textContent = "Follow";
            followBtn.className = "btn btn-primary";
            followBtn.style.padding = "4px 12px";
            followBtn.style.fontSize = "12px";

            followBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await toggleFollow(user.id);
            });

            li.addEventListener("click", () => {
                window.location.href = `profile.html?uid=${user.id}`;
            });

            li.appendChild(avatar);
            li.appendChild(info);
            li.appendChild(followBtn);
            suggestionsList.appendChild(li);
        });
    } catch (err) {
        suggestionsList.innerHTML = '<li style="color: var(--color-text-muted);">Could not load suggestions</li>';
    }
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

        debounceTimeout = setTimeout(async () => {
            try {
                const matches = await api(`/api/users/search?q=${encodeURIComponent(query)}`);

                if (matches.length === 0) {
                    searchResults.innerHTML = '<li style="padding: 8px;">No users found</li>';
                    searchResults.hidden = false;
                    return;
                }

                searchResults.innerHTML = "";

                matches.forEach((user) => {
                    const li = document.createElement("li");
                    li.style.padding = "8px";
                    li.style.cursor = "pointer";
                    li.style.borderBottom = "1px solid var(--color-border)";
                    li.textContent = `@${user.username}`;

                    li.addEventListener("click", () => {
                        window.location.href = `profile.html?uid=${user.id}`;
                    });

                    searchResults.appendChild(li);
                });

                searchResults.hidden = false;
            } catch (err) {
                searchResults.innerHTML = '<li style="padding: 8px;">Search failed</li>';
                searchResults.hidden = false;
            }
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
    if (!currentUser) return;

    const sidebarUsername = document.getElementById("sidebar-username");
    const sidebarHandle = document.getElementById("sidebar-handle");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    const navAvatar = document.getElementById("nav-avatar");
    const createPostAvatar = document.getElementById("create-post-avatar");
    const navProfileLink = document.getElementById("nav-profile-link");

    if (sidebarUsername) sidebarUsername.textContent = currentUser.username;
    if (sidebarHandle) sidebarHandle.textContent = `@${currentUser.username}`;
    if (navProfileLink) navProfileLink.href = `profile.html?uid=${currentUser.id}`;

    function fillAvatar(el) {
        if (!el) return;

        if (currentUser.avatarUrl) {
            el.innerHTML = `<img src="${esc(currentUser.avatarUrl)}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:99px;">`;
        } else {
            el.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }

    fillAvatar(sidebarAvatar);
    fillAvatar(navAvatar);
    fillAvatar(createPostAvatar);
}

function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("currentUserId");
            window.location.href = "login.html";
        });
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll(".feed-tab");
    if (tabs.length === 0) return;

    tabs.forEach((tab, idx) => {
        tab.addEventListener("click", async () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            activeTab = idx === 0 ? "following" : "everyone";
            await loadFeed();
        });
    });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadCurrentUser();

        updateSidebar();
        setupLogout();
        setupCreatePost();
        setupTabs();
        setupSearch();

        await renderSuggestions();
        await loadFeed();
    } catch (err) {
        console.error(err);
        window.location.href = "login.html";
    }
});