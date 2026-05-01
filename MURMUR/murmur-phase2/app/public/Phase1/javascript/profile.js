/* ============================================================
   HELPERS
============================================================ */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
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
    okBtn.onclick = null; cancelBtn.onclick = null; modal.onclick = null;
  };
  okBtn.onclick = () => { closeModal(); onConfirm(); };
  cancelBtn.onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   API WRAPPER  (uses credentials: 'include' to send the cookie)
============================================================ */
async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Something went wrong');
  return data;
}


/* ============================================================
   STATE
============================================================ */
let currentUser = null;   // logged-in user object  (from /api/users/[id])
let profileUser = null;   // user whose profile we're viewing
let isOwnProfile = false;
let activePostId = null;


/* ============================================================
   INIT
============================================================ */
async function init() {
  const meId = getCookieValue('userId');
  if (!meId) { window.location.href = 'login.html'; return; }

  try {
    currentUser = await api(`/api/users/${meId}`);
  } catch {
    window.location.href = 'login.html'; return;
  }

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('uid') || meId;
  try {
    profileUser = await api(`/api/users/${targetId}`);
  } catch {
    profileUser = currentUser;
  }
  isOwnProfile = (profileUser.id === currentUser.id);


  renderProfile();
  renderPosts();


  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
    window.location.href = 'login.html';
  });

  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  let debounceTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();
    if (!query) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }

    debounceTimeout = setTimeout(async () => {
      try {
        const users = await api(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (!users.length) {
          searchResults.innerHTML = '<li style="padding:8px">No users found</li>';
          searchResults.hidden = false; return;
        }
        searchResults.innerHTML = '';
        users.forEach(user => {
          const li = document.createElement('li');
          li.style.cssText = 'padding:8px;cursor:pointer;border-bottom:1px solid var(--color-border)';
          li.textContent = '@' + user.username;
          li.addEventListener('click', () => { window.location.href = `profile.html?uid=${user.id}`; });
          searchResults.appendChild(li);
        });
        searchResults.hidden = false;
      } catch { /* ignore search errors */ }
    }, 300);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim())
      window.location.href = 'feed.html?q=' + encodeURIComponent(e.target.value.trim());
  });
  document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) searchResults.hidden = true;
  });

  /* Modal close on overlay click */
  document.getElementById('post-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('add-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeAddModal(); });

  /* Comment input */
  document.getElementById('comment-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(); });
  document.getElementById('comment-input').addEventListener('input', e => {
    document.getElementById('comment-submit-btn').disabled = !e.target.value.trim();
  });

  /* Image preview & caption counter */
  document.getElementById('post-img-file').addEventListener('change', previewImage);
  document.getElementById('post-caption').addEventListener('input', function () {
    document.getElementById('caption-counter').textContent = this.value.length + ' / 300';
  });

  document.getElementById('save-edit-btn').addEventListener('click', saveProfile);
  document.getElementById('cancel-edit-btn').addEventListener('click', hideEditForm);
}

function getCookieValue(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}


/* ============================================================
   RENDER PROFILE
============================================================ */
function renderProfile() {
  const banner = document.getElementById('cover-banner');
  banner.style.backgroundImage = profileUser.bannerUrl ? `url(${profileUser.bannerUrl})` : '';

  if (profileUser.avatarUrl) {
    document.getElementById('avatar-img').src = profileUser.avatarUrl;
    document.getElementById('avatar-img').style.display = 'block';
    document.getElementById('avatar-placeholder').style.display = 'none';
  } else {
    document.getElementById('avatar-img').style.display = 'none';
    document.getElementById('avatar-placeholder').style.display = 'inline';
  }

  document.getElementById('profile-username').textContent = '@' + profileUser.username;
  document.getElementById('profile-bio').textContent = profileUser.bio || 'No bio yet.';

  document.getElementById('stat-posts').textContent = profileUser._count?.posts ?? 0;
  document.getElementById('stat-followers').textContent = profileUser._count?.followers ?? 0;
  document.getElementById('stat-following').textContent = profileUser._count?.following ?? 0;

  const area = document.getElementById('action-btns');
  area.innerHTML = '';

  if (isOwnProfile) {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = 'Edit Profile';
    editBtn.onclick = showEditForm;

    const newBtn = document.createElement('button');
    newBtn.className = 'btn btn-primary';
    newBtn.textContent = '+ New Post';
    newBtn.onclick = openAddModal;

    area.appendChild(editBtn);
    area.appendChild(newBtn);
  } else {
    const isFollowing = profileUser.isFollowedByMe ?? false;
    const btn = document.createElement('button');
    btn.className = 'btn ' + (isFollowing ? 'btn-secondary' : 'btn-primary');
    btn.textContent = isFollowing ? 'Following' : 'Follow';
    btn.onclick = () => toggleFollow(btn);
    area.appendChild(btn);
  }
}


/* ============================================================
   FOLLOW / UNFOLLOW
============================================================ */
async function toggleFollow(btn) {
  try {
    const result = await api(`/api/follows/${profileUser.id}`, { method: 'POST' });
    const nowFollowing = result.following;

    btn.textContent = nowFollowing ? 'Following' : 'Follow';
    btn.className = 'btn ' + (nowFollowing ? 'btn-secondary' : 'btn-primary');
    profileUser.isFollowedByMe = nowFollowing;

    const fresh = await api(`/api/users/${profileUser.id}`);
    profileUser = fresh;
    document.getElementById('stat-followers').textContent = fresh._count?.followers ?? 0;

    toast(nowFollowing ? 'Followed @' + profileUser.username : 'Unfollowed @' + profileUser.username);
  } catch (err) {
    toast(err.message);
  }
}


/* ============================================================
   EDIT FORM
============================================================ */
function showEditForm() {
  document.getElementById('edit-username').value = profileUser.username || '';
  document.getElementById('edit-bio').value = profileUser.bio || '';
  document.getElementById('edit-avatar').value = profileUser.avatarUrl || '';
  document.getElementById('edit-banner').value = profileUser.bannerUrl || '';
  document.getElementById('edit-form').style.display = 'block';
  document.getElementById('edit-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideEditForm() { document.getElementById('edit-form').style.display = 'none'; }

async function saveProfile() {
  const newUsername = document.getElementById('edit-username').value.trim();
  if (!newUsername) { toast('Username cannot be empty'); return; }

  try {
    const updated = await api(`/api/users/${profileUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        username: newUsername,
        bio: document.getElementById('edit-bio').value.trim(),
        avatarUrl: document.getElementById('edit-avatar').value.trim(),
        bannerUrl: document.getElementById('edit-banner').value.trim(),
      }),
    });
    currentUser = profileUser = updated;
    renderProfile();
    hideEditForm();
    toast('Profile saved');
  } catch (err) {
    toast(err.message);
  }
}


/* ============================================================
   TABS
============================================================ */
function switchTab(tab) {
  document.getElementById('posts-section').style.display = tab === 'posts' ? 'block' : 'none';
  document.getElementById('liked-section').style.display = tab === 'liked' ? 'block' : 'none';
  document.getElementById('tab-posts').classList.toggle('active', tab === 'posts');
  document.getElementById('tab-liked').classList.toggle('active', tab === 'liked');
  if (tab === 'liked') renderLikedPosts();
}


/* ============================================================
   POSTS GRID
============================================================ */
async function renderPosts() {
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = '<p style="color:var(--color-text-muted);padding:8px">Loading…</p>';

  try {
    const allPosts = await api('/api/posts');
    const posts = allPosts
      .filter(p => p.authorId === profileUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    grid.innerHTML = '';
    document.getElementById('stat-posts').textContent = posts.length;

    if (!posts.length) {
      grid.innerHTML =
        '<div class="empty-state"><div class="ei">&#x1F4F7;</div>' +
        '<p>' + (isOwnProfile ? 'No posts yet.' : '@' + esc(profileUser.username) + ' hasn\'t posted yet.') + '</p></div>';
      return;
    }
    posts.forEach(p => grid.appendChild(makeThumb(p)));
  } catch (err) {
    grid.innerHTML = '<p style="color:red;padding:8px">' + esc(err.message) + '</p>';
  }
}

async function renderLikedPosts() {
  const grid = document.getElementById('liked-grid');
  grid.innerHTML = '<p style="color:var(--color-text-muted);padding:8px">Loading…</p>';

  try {
    const allPosts = await api('/api/posts');
    const liked = allPosts
      .filter(p => p.likedByMe)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    grid.innerHTML = '';
    if (!liked.length) {
      grid.innerHTML = '<div class="empty-state"><div class="ei">&#x2764;&#xFE0F;</div><p>No liked posts yet.</p></div>';
      return;
    }
    liked.forEach(p => grid.appendChild(makeThumb(p)));
  } catch (err) {
    grid.innerHTML = '<p style="color:red;padding:8px">' + esc(err.message) + '</p>';
  }
}

function makeThumb(post) {
  const div = document.createElement('div');
  div.className = 'post-thumb';
  const likeCount = post._count?.likes ?? post.likes?.length ?? 0;
  const commentCount = post._count?.comments ?? post.comments?.length ?? 0;

  if (post.imageUrl) {
    div.innerHTML =
      '<img src="' + esc(post.imageUrl) + '" loading="lazy" />' +
      '<div class="thumb-overlay">' +
      '<span class="thumb-stat">&#x2764;&#xFE0F; ' + likeCount + '</span>' +
      '<span class="thumb-stat">&#x1F4AC; ' + commentCount + '</span></div>';
  } else {
    div.innerHTML =
      '<div class="thumb-text">' + esc(post.caption || '') + '</div>' +
      '<div class="thumb-overlay">' +
      '<span class="thumb-stat">&#x2764;&#xFE0F; ' + likeCount + '</span>' +
      '<span class="thumb-stat">&#x1F4AC; ' + commentCount + '</span></div>';
  }
  div.onclick = () => { window.location.href = 'post.html?id=' + post.id; };
  return div;
}


/* ============================================================
   ADD POST MODAL
============================================================ */
function openAddModal() {
  document.getElementById('post-img-file').value = '';
  document.getElementById('post-caption').value = '';
  document.getElementById('caption-counter').textContent = '0 / 300';
  document.getElementById('preview-img').style.display = 'none';
  document.getElementById('img-ph').style.display = 'flex';
  document.getElementById('add-modal').classList.add('open');
}
function closeAddModal() { document.getElementById('add-modal').classList.remove('open'); }

function previewImage() {
  const file = document.getElementById('post-img-file').files[0];
  const img = document.getElementById('preview-img');
  const ph = document.getElementById('img-ph');
  if (!file) { img.style.display = 'none'; img.src = ''; ph.style.display = 'flex'; return; }
  const reader = new FileReader();
  reader.onload = () => { img.src = reader.result; img.style.display = 'block'; ph.style.display = 'none'; };
  reader.onerror = () => { img.style.display = 'none'; img.src = ''; ph.style.display = 'flex'; };
  reader.readAsDataURL(file);
}

async function submitPost() {
  const file = document.getElementById('post-img-file').files[0];
  const caption = document.getElementById('post-caption').value.trim();

  if (!caption && !file) { toast('Add an image or a caption'); return; }

  let imageUrl = '';
  if (file) imageUrl = await fileToDataUrl(file);

  try {
    await api('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ caption, imageUrl }),
    });
    closeAddModal();
    renderPosts();
    toast('Post shared!');
  } catch (err) {
    toast(err.message);
  }
}


/* ============================================================
   POST DETAIL MODAL
============================================================ */
async function openModal(postId) {
  activePostId = postId;

  try {
    /* GET /api/posts/[id] — returns post with author, comments, likedByMe */
    const post = await api(`/api/posts/${postId}`);

    const author = post.author || { username: 'unknown', avatarUrl: '' };

    const pmiImg = document.getElementById('pmi-img');
    const pmiNoImg = document.getElementById('pmi-no-image');
    if (post.imageUrl) {
      pmiImg.src = post.imageUrl; pmiImg.style.display = 'block'; pmiNoImg.style.display = 'none';
    } else {
      pmiImg.style.display = 'none'; pmiNoImg.style.display = 'flex';
    }

    document.getElementById('pmi-author').textContent = '@' + author.username;
    document.getElementById('pmi-time').textContent = fmtDate(post.createdAt);
    document.getElementById('pmi-av-inner').innerHTML = author.avatarUrl
      ? '<img src="' + esc(author.avatarUrl) + '" />' : '&#x1F464;';

    document.getElementById('pmi-caption').innerHTML =
      '<span class="pmi-caption-author">@' + esc(author.username) + '</span>' + esc(post.caption || '');

    const liked = post.likedByMe ?? false;
    const likeCount = post._count?.likes ?? 0;
    document.getElementById('pmi-like-icon').textContent = liked ? '\u2764\uFE0F' : '\u{1F90D}';
    document.getElementById('pmi-like-count').textContent = likeCount;
    document.getElementById('pmi-like-btn').className = 'pmi-like-btn' + (liked ? ' liked' : '');
    document.getElementById('pmi-del-btn').style.display = post.authorId === currentUser.id ? 'inline' : 'none';

    renderModalComments(post.comments || []);
    document.getElementById('post-modal').classList.add('open');
    document.getElementById('comment-input').value = '';
    document.getElementById('comment-submit-btn').disabled = true;
  } catch (err) {
    toast(err.message);
  }
}

function closeModal() {
  document.getElementById('post-modal').classList.remove('open');
  activePostId = null;
}

function renderModalComments(comments) {
  const container = document.getElementById('pmi-comments');
  if (!comments.length) {
    container.innerHTML = '<p style="color:var(--color-text-muted);font-size:12px;padding:4px 0">No comments yet. Be the first!</p>';
    return;
  }
  container.innerHTML = '';
  comments.forEach(c => {
    const author = c.author || { username: '?' };
    const d = document.createElement('div');
    d.className = 'pmi-comment-item';
    d.innerHTML =
      '<div><span class="pmi-comment-author">@' + esc(author.username) + '</span>' +
      '<span>' + esc(c.text) + '</span>' +
      '<div class="pmi-comment-ts">' + timeAgo(c.createdAt) + '</div></div>';
    container.appendChild(d);
  });
  container.scrollTop = container.scrollHeight;
}


/* ============================================================
   LIKE
============================================================ */
async function modalToggleLike() {
  try {
    /* POST /api/posts/[id]/like — returns { liked: bool, likeCount: number } */
    const result = await api(`/api/posts/${activePostId}/like`, { method: 'POST' });
    const liked = result.liked;
    const likeCount = result.likeCount ?? parseInt(document.getElementById('pmi-like-count').textContent, 10) + (liked ? 1 : -1);

    document.getElementById('pmi-like-count').textContent = likeCount;
    document.getElementById('pmi-like-icon').textContent = liked ? '\u2764\uFE0F' : '\u{1F90D}';
    document.getElementById('pmi-like-btn').className = 'pmi-like-btn' + (liked ? ' liked' : '');

    renderPosts();
    if (document.getElementById('liked-section').style.display !== 'none') renderLikedPosts();
  } catch (err) {
    toast(err.message);
  }
}


/* ============================================================
   DELETE POST
============================================================ */
function deletePost() {
  showConfirm('Delete this post? This cannot be undone.', async () => {
    try {
      await api(`/api/posts/${activePostId}`, { method: 'DELETE' });
      closeModal();
      renderPosts();
      toast('Post deleted');
    } catch (err) {
      toast(err.message);
    }
  }, 'Delete post');
}


/* ============================================================
   ADD COMMENT
============================================================ */
async function submitComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;

  try {
    /* POST /api/posts/[id]/comments — returns the new comment */
    await api(`/api/posts/${activePostId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    input.value = '';
    document.getElementById('comment-submit-btn').disabled = true;

    /* Re-fetch the post to get fresh comments */
    const post = await api(`/api/posts/${activePostId}`);
    renderModalComments(post.comments || []);
    renderPosts();
  } catch (err) {
    toast(err.message);
  }
}


document.addEventListener('DOMContentLoaded', init);