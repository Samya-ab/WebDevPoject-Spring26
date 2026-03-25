
// Get post ID from URL
const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

// Check if user is logged in
const session = JSON.parse(localStorage.getItem("session"));
if (!session) {
    window.location.href = 'login.html';
}

// Load data
const users = JSON.parse(localStorage.getItem("users")) || [];
const posts = JSON.parse(localStorage.getItem("posts")) || [];
const currentUser = users.find(u => u.id === session.userId);

if (!currentUser) {
    window.location.href = 'login.html';
}

// Find the post
const post = posts.find(p => p.id === postId);
if (!post) {
    window.location.href = 'feed.html';
}

// Find the author
const author = users.find(u => u.id === post.authorId);

// Helper: time ago function (same as profile.js)
function timeAgo(timestamp) {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
}

// Helper: escape HTML
function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   RENDER POST
============================================================ */
function renderPost() {
    // Set author info
    document.getElementById('post-author-name').textContent = author.username;
    document.getElementById('post-author-username').textContent = '@' + author.username;
    document.getElementById('post-author-avatar').textContent = author.username.charAt(0).toUpperCase();
    document.getElementById('post-timestamp').textContent = timeAgo(post.timestamp);
    
    // Set post content
    if (post.imageUrl) {
        document.getElementById('post-image').src = post.imageUrl;
        document.getElementById('post-image').style.display = 'block';
    }
    document.getElementById('post-caption').textContent = post.caption || '';
    
    // Set stats
    document.getElementById('likes-count').textContent = `❤️ ${(post.likes || []).length} likes`;
    document.getElementById('comments-count').textContent = `💬 ${(post.comments || []).length} comments`;
    
    // Set like button state
    const likeBtn = document.getElementById('like-button');
    if ((post.likes || []).includes(currentUser.id)) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '❤️ Liked';
    }
    
    // Show delete button if owner
    if (post.authorId === currentUser.id) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Post';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
            if (confirm('Delete this post?')) {
                const updatedPosts = posts.filter(p => p.id !== post.id);
                localStorage.setItem('posts', JSON.stringify(updatedPosts));
                window.location.href = 'feed.html';
            }
        };
        document.querySelector('.post-actions').appendChild(deleteBtn);
    }
    
    // Render comments
    renderComments();
}

/* ============================================================
   RENDER COMMENTS
============================================================ */
function renderComments() {
    const commentsList = document.getElementById('comments-list');
    const comments = post.comments || [];
    
    document.getElementById('comment-count').textContent = `(${comments.length})`;
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    commentsList.innerHTML = '';
    comments.forEach(comment => {
        const commentUser = users.find(u => u.id === comment.authorId);
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="avatar avatar-sm">${(commentUser?.username || '?').charAt(0).toUpperCase()}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${esc(commentUser?.username || 'unknown')}</span>
                    <span class="comment-time">${timeAgo(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${esc(comment.text)}</p>
            </div>
        `;
        commentsList.appendChild(commentDiv);
    });
}

/* ============================================================
   LIKE FUNCTION
============================================================ */
function toggleLike() {
    const postIndex = posts.findIndex(p => p.id === post.id);
    if (postIndex === -1) return;
    
    posts[postIndex].likes = posts[postIndex].likes || [];
    const likeIndex = posts[postIndex].likes.indexOf(currentUser.id);
    
    if (likeIndex === -1) {
        posts[postIndex].likes.push(currentUser.id);
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '❤️ Liked';
    } else {
        posts[postIndex].likes.splice(likeIndex, 1);
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = '❤️ Like';
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    document.getElementById('likes-count').textContent = `❤️ ${posts[postIndex].likes.length} likes`;
}

/* ============================================================
   ADD COMMENT
============================================================ */
function addComment() {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;
    
    const postIndex = posts.findIndex(p => p.id === post.id);
    if (postIndex === -1) return;
    
    const newComment = {
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        authorId: currentUser.id,
        text: text,
        timestamp: Date.now()
    };
    
    posts[postIndex].comments = posts[postIndex].comments || [];
    posts[postIndex].comments.push(newComment);
    
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // Clear input and reload comments
    input.value = '';
    document.getElementById('comments-count').textContent = `💬 ${posts[postIndex].comments.length} comments`;
    renderComments();
}

/* ============================================================
   BACK TO FEED
============================================================ */
function goBack() {
    window.location.href = 'feed.html';
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderPost();
    
    // Setup event listeners
    document.getElementById('like-button').addEventListener('click', toggleLike);
    document.getElementById('submit-comment').addEventListener('click', addComment);
    document.getElementById('back-link').addEventListener('click', goBack);
    
    // Enter key in comment input
    document.getElementById('comment-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addComment();
        }
    });
    
    // Update user info in sidebar (like feed.html)
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarHandle = document.getElementById('sidebar-handle');
    const navAvatar = document.getElementById('nav-avatar');
    
    if (sidebarAvatar) sidebarAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    if (sidebarUsername) sidebarUsername.textContent = currentUser.username;
    if (sidebarHandle) sidebarHandle.textContent = '@' + currentUser.username;
    if (navAvatar) navAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('session');
            window.location.href = 'login.html';
        });
    }
});