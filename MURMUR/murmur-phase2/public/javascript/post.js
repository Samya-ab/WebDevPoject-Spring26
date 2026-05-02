// Get post ID from URL
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

let post = null;
let currentUser = null;

async function loadCurrentUser() {
    const userId = localStorage.getItem("currentUserId");

    if (!userId) {
        window.location.href = "login.html";
        return;
    }

    currentUser = await api(`/api/users/${userId}`);
}

async function loadPost() {
    if (!postId) {
        window.location.href = "feed.html";
        return;
    }

    post = await api(`/api/posts/${postId}`);
}

// Helper: time ago function (same as profile.js)
function timeAgo(timestamp) {
    const time = new Date(timestamp).getTime();
    const s = Math.floor((Date.now() - time) / 1000);

    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
}

// Helper: escape HTML
function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

/* ============================================================
   RENDER POST
============================================================ */
function renderPost() {
    const author = post.author || post.user || {
        username: "unknown",
        avatarUrl: "",
    };

    const likeCount = post._count?.likes ?? post.likes?.length ?? 0;
    const commentCount = post._count?.comments ?? post.comments?.length ?? 0;
    const isLiked = post.likedByMe || post.isLiked || false;
    const isOwner = post.isOwner || post.authorId === currentUser?.id;

    document.getElementById("post-author-name").textContent = author.username;
    document.getElementById("post-author-username").textContent = "@" + author.username;
    document.getElementById("post-timestamp").textContent =
        timeAgo(post.createdAt || post.timestamp);

    const authorAvatar = document.getElementById("post-author-avatar");

    if (author.avatarUrl) {
        authorAvatar.innerHTML = `<img src="${esc(author.avatarUrl)}" alt="avatar">`;
    } else {
        authorAvatar.textContent = author.username.charAt(0).toUpperCase();
    }

    document.getElementById("post-content").textContent = post.caption || "";

    const postImage = document.getElementById("post-image");

    if (post.imageUrl) {
        postImage.src = post.imageUrl;
        postImage.style.display = "block";
    } else {
        postImage.style.display = "none";
    }

    document.getElementById("likes-count").textContent = `❤️ ${likeCount} likes`;
    document.getElementById("comments-count").textContent = `💬 ${commentCount} comments`;
    document.getElementById("comment-count").textContent = `(${commentCount})`;

    const likeBtn = document.getElementById("like-btn");
    likeBtn.classList.toggle("liked", isLiked);
    likeBtn.innerHTML = isLiked ? "❤️ Liked" : "❤️ Like";

    const commentAvatar = document.getElementById("comment-avatar");

    if (currentUser?.avatarUrl) {
        commentAvatar.innerHTML = `<img src="${esc(currentUser.avatarUrl)}" alt="avatar">`;
    } else {
        commentAvatar.textContent = currentUser?.username?.charAt(0).toUpperCase() || "?";
    }

    const oldDeleteBtn = document.getElementById("delete-post-btn");
    if (oldDeleteBtn) oldDeleteBtn.remove();

    if (isOwner) {
        const deleteBtn = document.createElement("button");
        deleteBtn.id = "delete-post-btn";
        deleteBtn.textContent = "Delete Post";
        deleteBtn.className = "like-btn";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.style.borderColor = "#ed4956";
        deleteBtn.style.color = "#ed4956";

        deleteBtn.onclick = () => {
            showConfirm("Delete this post?", async () => {
                await deletePost();
            }, "Delete post");
        };

        document.querySelector(".post-card").appendChild(deleteBtn);
    }

    renderComments();
}

async function deletePost() {
    try {
        await api(`/api/posts/${postId}`, {
            method: "DELETE",
        });

        window.location.href = "feed.html"
    } catch (err) {
        console.error(err);
    }
}

/* ============================================================
   RENDER COMMENTS
============================================================ */
function renderComments() {
    const commentsList = document.querySelector(".comments");
    const comments = post.comments || [];

    const existingComments = commentsList.querySelectorAll(".comment-item");
    existingComments.forEach((c) => c.remove());

    const oldMsg = commentsList.querySelector(".no-comments");
    if (oldMsg) oldMsg.remove();

    if (comments.length === 0) {
        const noComments = document.createElement("p");
        noComments.className = "no-comments";
        noComments.textContent = "No comments yet. Be the first to comment!";
        noComments.style.color = "var(--color-text-muted)";
        noComments.style.padding = "20px";
        noComments.style.textAlign = "center";

        commentsList.insertBefore(
            noComments,
            commentsList.querySelector(".comment-form")
        );

        return;
    }

    comments.forEach((comment) => {
        const commentUser = comment.author || comment.user || {
            username: "unknown",
            avatarUrl: "",
        };

        const isMyComment =
            comment.isOwner ||
            comment.authorId === currentUser?.id ||
            comment.userId === currentUser?.id;

        const commentDiv = document.createElement("div");
        commentDiv.className = "comment-item";

        const avatarContent = commentUser.avatarUrl
            ? `<img src="${esc(commentUser.avatarUrl)}" alt="avatar">`
            : commentUser.username.charAt(0).toUpperCase();

        commentDiv.innerHTML = `
            <div class="avatar avatar-sm">${avatarContent}</div>
            <div class="comment-body">
                <div class="comment-top-row">
                    <div>
                        <strong>${esc(commentUser.username)}</strong>
                        <small>${timeAgo(comment.createdAt || comment.timestamp)}</small>
                    </div>
                    ${isMyComment
                ? `<button class="comment-delete-btn" data-comment-id="${comment.id}">Delete</button>`
                : ""
            }
                </div>
                <p>${esc(comment.text || comment.content || "")}</p>
            </div>
        `;

        const form = commentsList.querySelector(".comment-form");
        commentsList.insertBefore(commentDiv, form);

        const deleteBtn = commentDiv.querySelector(".comment-delete-btn");

        if (deleteBtn) {
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await deleteComment(comment.id);
            });
        }
    });
}

/* ============================================================
   LIKE FUNCTION
============================================================ */
async function toggleLike() {
    try {
        await api(`/api/posts/${postId}/like`, {
            method: "POST",
        });

        await loadPost();
        renderPost();
    } catch (err) {
        console.error(err);
    }
}

/* ============================================================
   ADD COMMENT
============================================================ */
async function addComment() {
    const input = document.getElementById("comment-input");
    const text = input.value.trim();

    if (!text) return;

    try {
        await api(`/api/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ text }),
        });

        input.value = "";

        await loadPost();
        renderPost();
    } catch (err) {
        console.error(err);
    }
}

async function deleteComment(commentId) {
    try {
        await api(`/api/posts/${postId}/comments/${commentId}`, {
            method: "DELETE",
        });

        await loadPost();
        renderPost();
    } catch (err) {
        console.error(err);
    }
}


/* ============================================================
   UPDATE SIDEBAR WITH CURRENT USER
============================================================ */
function updateSidebar() {
    if (!currentUser) return;

    const sidebarUsername = document.getElementById("sidebar-username");
    const sidebarHandle = document.getElementById("sidebar-handle");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    const navAvatar = document.getElementById("nav-avatar");
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
}

/* ============================================================
   LOGOUT
============================================================ */
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("currentUserId");
            window.location.href = "login.html";
        });
    }
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadCurrentUser();
        await loadPost();

        renderPost();
        updateSidebar();
        setupLogout();

        document.getElementById("like-btn").addEventListener("click", toggleLike);

        document
            .getElementById("submit-comment")
            .addEventListener("click", addComment);

        document.getElementById("comment-input").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addComment();
            }
        });

    } catch (err) {
        console.error(err);
        window.location.href = "login.html";
    }
});