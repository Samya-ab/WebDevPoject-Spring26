
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
const author = users.find(u => u.id === post.authorId) || {
    username: 'unknown'
};
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
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   RENDER POST
============================================================ */
function renderPost() {
    // Set author info
    const authorName = document.querySelector('.post-header h2');
    const authorUsername = document.querySelector('.post-header .post-meta span:first-child');
    const authorAvatar = document.querySelector('.post-header .avatar');
    const postTime = document.querySelector('.post-header .post-meta span:last-child');
    
    if (authorName) authorName.textContent = author.username;
    if (authorUsername) authorUsername.textContent = '@' + author.username;
    if (authorAvatar) authorAvatar.textContent = author.username.charAt(0).toUpperCase();
    if (postTime) postTime.textContent = ' ' + timeAgo(post.timestamp);
    
    // Set post content
    const postContent = document.querySelector('.post-content');
    if (postContent) postContent.textContent = post.caption || '';

    const postImage = document.getElementById('post-image');
    if (post.imageUrl) {
        postImage.src = post.imageUrl;
        postImage.style.display = 'block';
    } else {
        postImage.style.display = 'none';
    }
    
    // Set stats
    const likeStat = document.querySelector('.post-stats span:first-child');
    const commentStat = document.querySelector('.post-stats span:last-child');
    
    if (likeStat) likeStat.textContent = `❤️ ${(post.likes || []).length} likes`;
    if (commentStat) commentStat.textContent = `💬 ${(post.comments || []).length} comments`;
    
    // Set like button state
    const likeBtn = document.querySelector('.like-btn');
    if ((post.likes || []).includes(currentUser.id)) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '❤️ Liked';
    }
    
    // Show delete button if owner
    if (post.authorId === currentUser.id) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Post';
        deleteBtn.className = 'like-btn';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.style.borderColor = '#ed4956';
        deleteBtn.style.color = '#ed4956';
        deleteBtn.onclick = () => {
            if (confirm('Delete this post?')) {
                const updatedPosts = posts.filter(p => p.id !== post.id);
                localStorage.setItem('posts', JSON.stringify(updatedPosts));
                window.location.href = 'feed.html';
            }
        };
        document.querySelector('.post-card').appendChild(deleteBtn);
    }
    
    // Update comment count in comments section
    const commentsTitle = document.querySelector('.comments h3');
    if (commentsTitle) commentsTitle.textContent = `Comments (${(post.comments || []).length})`;
    
    // Render comments
    renderComments();
}

/* ============================================================
   RENDER COMMENTS
============================================================ */
function renderComments() {
    const commentsList = document.querySelector('.comments');
    const comments = post.comments || [];

 
    
    // Remove existing comments except the form
    const existingComments = commentsList.querySelectorAll('.comment-item');
    existingComments.forEach(c => c.remove());

    // Remove old "no comments" message if exists
    const oldMsg = commentsList.querySelector('.no-comments');
    if (oldMsg) oldMsg.remove();

    if (comments.length === 0) {
    const noComments = document.createElement('p');
    noComments.className = 'no-comments';
    noComments.textContent = 'No comments yet. Be the first to comment!';
    noComments.style.color = 'var(--color-text-muted)';
    noComments.style.padding = '20px';
    noComments.style.textAlign = 'center';
    commentsList.insertBefore(noComments, commentsList.querySelector('.comment-form'));
    return;
}
    
    comments.forEach(comment => {
        const commentUser = users.find(u => u.id === comment.authorId);
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="avatar avatar-sm">${(commentUser?.username || '?').charAt(0).toUpperCase()}</div>
            <div>
                <strong>${esc(commentUser?.username || 'unknown')}</strong> <small>${timeAgo(comment.timestamp)}</small>
                <p>${esc(comment.text)}</p>
            </div>
        `;
        const form = commentsList.querySelector('.comment-form');
        if (form) {
            commentsList.insertBefore(commentDiv, form);
        } else {
            commentsList.appendChild(commentDiv);
        }    });
}

/* ============================================================
   LIKE FUNCTION
============================================================ */
function toggleLike() {
    const postIndex = posts.findIndex(p => p.id === post.id);
    if (postIndex === -1) return;
    
    posts[postIndex].likes = posts[postIndex].likes || [];
    const likeIndex = posts[postIndex].likes.indexOf(currentUser.id);
    const likeBtn = document.querySelector('.like-btn');
    const likeStat = document.querySelector('.post-stats span:first-child');
    
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
    if (likeStat) likeStat.textContent = `❤️ ${posts[postIndex].likes.length} likes`;
    //Post is updated after a like
    post.likes = posts[postIndex].likes;
}

/* ============================================================
   ADD COMMENT
============================================================ */
function addComment() {
    const input = document.querySelector('.comment-form input');
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
    
    // Update stats
    const commentStat = document.querySelector('.post-stats span:last-child');
    if (commentStat) commentStat.textContent = `💬 ${posts[postIndex].comments.length} comments`;
    
    // Update comments title
    const commentsTitle = document.querySelector('.comments h3');
    if (commentsTitle) commentsTitle.textContent = `Comments (${posts[postIndex].comments.length})`;
    
    //Post is updated after a comment
    post.comments = posts[postIndex].comments;
    // Reload comments UI
    renderComments();
}

/* ============================================================
   UPDATE SIDEBAR WITH CURRENT USER
============================================================ */
function updateSidebar() {
    const sidebarAvatar = document.querySelector('.sidebar-profile-card .avatar');
    const sidebarName = document.querySelector('.sidebar-user-info strong');
    const sidebarHandle = document.querySelector('.sidebar-user-info .handle');
    const navAvatar = document.querySelector('.nav-actions .avatar');
    
    if (sidebarAvatar) sidebarAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    if (sidebarName) sidebarName.textContent = currentUser.username;
    if (sidebarHandle) sidebarHandle.textContent = '@' + currentUser.username;
    if (navAvatar) navAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
}

/* ============================================================
   LOGOUT
============================================================ */
function setupLogout() {
    const logoutBtn = document.querySelector('.nav-actions button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('session');
            window.location.href = 'login.html';
        });
    }
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderPost();
    updateSidebar();
    setupLogout();
    
    // Setup event listeners
    const likeBtn = document.querySelector('.like-btn');
    if (likeBtn) likeBtn.addEventListener('click', toggleLike);
    
    const submitBtn = document.querySelector('.comment-form button');
    if (submitBtn) submitBtn.addEventListener('click', addComment);
    
    const commentInput = document.querySelector('.comment-form input');
    if (commentInput) {
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addComment();
            }
        });
    }
});