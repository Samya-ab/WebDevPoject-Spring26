/* ============================================================
   HELPERS
============================================================ */
const ls = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
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
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }


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


/* ============================================================
   SEED DEMO DATA
   FIX: if users were already seeded by feed.html, we still
   ensure a valid session exists (old code bailed out early
   and never wrote the session, causing a redirect to login).
============================================================ */
function seedDemoData() {
  const existingUsers = ls.get('users');

  if (existingUsers && existingUsers.length > 0) {
    /* Users already exist — just guarantee a session */
    if (!ls.get('session')) ls.set('session', { userId: existingUsers[0].id });
    return;
  }

  /* Fresh seed */
  const me = 'user_demo_001';
  ls.set('users', [
    { id: me, username: 'haya_al', bio: 'Cybersecurity @ QU · CTF player\nFirewalls in Heels 👟', avatarUrl: 'https://i.pravatar.cc/100?img=47', bannerUrl: 'https://picsum.photos/seed/haya/600/200', followers: ['u2', 'u3', 'u4'], following: ['u2'] },
    { id: 'u2', username: 'alice', bio: '', avatarUrl: 'https://i.pravatar.cc/100?img=5', bannerUrl: '', followers: [me], following: [me] },
    { id: 'u3', username: 'bob', bio: '', avatarUrl: 'https://i.pravatar.cc/100?img=12', bannerUrl: '', followers: [me], following: [] },
  ]);
  ls.set('posts', [
    { id: uid(), authorId: me, imageUrl: 'https://picsum.photos/seed/ctf/600/600', caption: 'CTF win this weekend! 🚩 The flag was hidden in metadata of a QR code inside a PCAP file. Wild.', timestamp: Date.now() - 259200000, likes: ['u2', 'u3', 'u4'], comments: [{ id: uid(), authorId: 'u2', text: 'WHAT that is insane!!', timestamp: Date.now() - 250000000 }] },
    { id: uid(), authorId: me, imageUrl: 'https://picsum.photos/seed/cybermajlis/600/600', caption: 'Presented The Cyber Majlis at the booth today. Cultural cybersecurity education is the future.', timestamp: Date.now() - 172800000, likes: ['u2', 'u3'], comments: [] },
    { id: uid(), authorId: me, imageUrl: 'https://picsum.photos/seed/ccna/600/600', caption: 'Just passed my CCNA exam! Months of late-night labs finally paid off.', timestamp: Date.now() - 86400000, likes: ['u2', 'u3', 'u4'], comments: [{ id: uid(), authorId: 'u3', text: 'Congratulations!!', timestamp: Date.now() - 80000000 }] },
    { id: uid(), authorId: me, imageUrl: 'https://picsum.photos/seed/firewalls/600/600', caption: 'New Firewalls in Heels post up! Episode 02: WhatsApp privacy settings you need to change RIGHT NOW. Link in bio.', timestamp: Date.now() - 7200000, likes: ['u2'], comments: [] },
    { id: uid(), authorId: me, imageUrl: 'https://picsum.photos/seed/lab/600/600', caption: 'Running SEED Labs at 2am is a vibe. Why does everything click at midnight', timestamp: Date.now() - 3600000, likes: [], comments: [] },
    { id: uid(), authorId: me, imageUrl: 'https://picsum.photos/seed/quantum/600/600', caption: 'Built a quantum randomizer class in Qiskit today for the UREP research. Dr. Noora is going to love this.', timestamp: Date.now() - 1800000, likes: ['u2'], comments: [] },
  ]);
  // ls.set('session', { userId: me }); 
  /* YARA:commented this until I check validation, no auto login */

  if (!ls.get('session')) {
    return;
  }

}


/* ============================================================
   BOOTSTRAP
============================================================ */
function bootstrap() {
  seedDemoData();
  if (!ls.get('users')) ls.set('users', []);
  if (!ls.get('posts')) ls.set('posts', []);
  if (!ls.get('session')) { window.location.href = 'login.html'; return false; }
  return true;
}


/* ============================================================
   STATE
============================================================ */
let currentUser = null;
let profileUser = null;
let isOwnProfile = false;
let activePostId = null;


/* ============================================================
   INIT
============================================================ */
function init() {
  if (!bootstrap()) return;
  const session = ls.get('session');
  const users = ls.get('users') || [];
  currentUser = users.find(u => u.id === session.userId);
  if (!currentUser) { window.location.href = 'login.html'; return; }

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('uid') || currentUser.id;
  profileUser = users.find(u => u.id === targetId) || currentUser;
  isOwnProfile = (profileUser.id === currentUser.id);

  renderProfile();
  renderPosts();

  /* Logout */
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('session');
    window.location.href = 'login.html';
  });

  /* Nav search — Enter navigates to feed */
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

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
        u => u.username.toLowerCase().includes(query) && u.id !== currentUser.id
      );
      if (matches.length === 0) {
        searchResults.innerHTML = '<li style="padding: 8px;">No users found</li>';
        searchResults.hidden = false;
        return;
      }
      searchResults.innerHTML = '';
      matches.forEach(user => {
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

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim())
      window.location.href = 'feed.html?q=' + encodeURIComponent(e.target.value.trim());
  });

  document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.hidden = true;
    }
  });

  /* Close modals on overlay click */
  document.getElementById('post-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('add-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeAddModal(); });

  /* Comment: Enter submits, input enables/disables button */
  document.getElementById('comment-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(); });
  document.getElementById('comment-input').addEventListener('input', e => {
    document.getElementById('comment-submit-btn').disabled = !e.target.value.trim();
  });

  /* Live image preview in add-post modal */
  document.getElementById('post-img-file').addEventListener('change', previewImage);

  /* Caption character counter */
  document.getElementById('post-caption').addEventListener('input', function () {
    document.getElementById('caption-counter').textContent = this.value.length + ' / 300';
  });

  /* Edit form */
  document.getElementById('save-edit-btn').addEventListener('click', saveProfile);
  document.getElementById('cancel-edit-btn').addEventListener('click', hideEditForm);
}


/* ============================================================
   RENDER PROFILE
============================================================ */
function renderProfile() {
  const banner = document.getElementById('cover-banner');
  banner.style.backgroundImage = profileUser.bannerUrl ? 'url(' + profileUser.bannerUrl + ')' : '';

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

  const posts = ls.get('posts') || [];
  document.getElementById('stat-posts').textContent = posts.filter(p => p.authorId === profileUser.id).length;
  document.getElementById('stat-followers').textContent = (profileUser.followers || []).length;
  document.getElementById('stat-following').textContent = (profileUser.following || []).length;

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
    const isFollowing = (currentUser.following || []).includes(profileUser.id);
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
function toggleFollow(btn) {
  const users = ls.get('users') || [];
  const cu = users.find(u => u.id === currentUser.id);
  const pu = users.find(u => u.id === profileUser.id);
  cu.following = cu.following || []; pu.followers = pu.followers || [];
  const idx = cu.following.indexOf(pu.id);
  if (idx === -1) {
    cu.following.push(pu.id); pu.followers.push(cu.id);
    btn.textContent = 'Following'; btn.className = 'btn btn-secondary';
    toast('Followed @' + pu.username);
  } else {
    cu.following.splice(idx, 1); pu.followers.splice(pu.followers.indexOf(cu.id), 1);
    btn.textContent = 'Follow'; btn.className = 'btn btn-primary';
    toast('Unfollowed @' + pu.username);
  }
  ls.set('users', users); currentUser = cu; profileUser = pu;
  document.getElementById('stat-followers').textContent = pu.followers.length;
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

function saveProfile() {
  const newUsername = document.getElementById('edit-username').value.trim();
  if (!newUsername) { toast('Username cannot be empty'); return; }
  const users = ls.get('users') || [];
  const idx = users.findIndex(u => u.id === profileUser.id);
  if (idx === -1) return;
  if (users.some(u => u.username === newUsername && u.id !== profileUser.id)) { toast('Username already taken'); return; }
  users[idx].username = newUsername;
  users[idx].bio = document.getElementById('edit-bio').value.trim();
  users[idx].avatarUrl = document.getElementById('edit-avatar').value.trim();
  users[idx].bannerUrl = document.getElementById('edit-banner').value.trim();
  ls.set('users', users);
  currentUser = profileUser = users[idx];
  renderProfile(); hideEditForm(); toast('Profile saved');
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
function renderPosts() {
  const posts = (ls.get('posts') || [])
    .filter(p => p.authorId === profileUser.id)
    .sort((a, b) => b.timestamp - a.timestamp);
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = '';
  if (!posts.length) {
    grid.innerHTML =
      '<div class="empty-state">' +
      '<div class="ei">&#x1F4F7;</div>' +
      '<p>' + (isOwnProfile ? 'No posts yet.' : '@' + esc(profileUser.username) + ' hasn\'t posted yet.') + '</p>' +
      '</div>';
    return;
  }
  document.getElementById('stat-posts').textContent = posts.length;
  posts.forEach(p => grid.appendChild(makeThumb(p)));
}

function renderLikedPosts() {
  const posts = (ls.get('posts') || [])
    .filter(p => (p.likes || []).includes(currentUser.id))
    .sort((a, b) => b.timestamp - a.timestamp);
  const grid = document.getElementById('liked-grid');
  grid.innerHTML = '';
  if (!posts.length) {
    grid.innerHTML = '<div class="empty-state"><div class="ei">&#x2764;&#xFE0F;</div><p>No liked posts yet.</p></div>';
    return;
  }
  posts.forEach(p => grid.appendChild(makeThumb(p)));
}

function makeThumb(post) {
  const div = document.createElement('div');
  div.className = 'post-thumb';
  if (post.imageUrl) {
    div.innerHTML =
      '<img src="' + esc(post.imageUrl) + '" loading="lazy" />' +
      '<div class="thumb-overlay">' +
      '<span class="thumb-stat">&#x2764;&#xFE0F; ' + (post.likes || []).length + '</span>' +
      '<span class="thumb-stat">&#x1F4AC; ' + (post.comments || []).length + '</span>' +
      '</div>';
  } else {
    div.innerHTML =
      '<div class="thumb-text">' + esc(post.caption || '') + '</div>' +
      '<div class="thumb-overlay">' +
      '<span class="thumb-stat">&#x2764;&#xFE0F; ' + (post.likes || []).length + '</span>' +
      '<span class="thumb-stat">&#x1F4AC; ' + (post.comments || []).length + '</span>' +
      '</div>';
  }
  // CHANGE: go to post.html instead of opening modal
  div.onclick = () => {
    window.location.href = 'post.html?id=' + post.id;
  };
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

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('open');
}

function previewImage() {
  const fileInput = document.getElementById('post-img-file');
  const file = fileInput.files[0];
  const img = document.getElementById('preview-img');
  const ph = document.getElementById('img-ph');

  if (!file) {
    img.style.display = 'none';
    img.src = '';
    ph.style.display = 'flex';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    img.style.display = 'block';
    ph.style.display = 'none';
  };
  reader.onerror = () => {
    img.style.display = 'none';
    img.src = '';
    ph.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

async function submitPost() {
  const fileInput = document.getElementById('post-img-file');
  const file = fileInput.files[0];
  const caption = document.getElementById('post-caption').value.trim();

  if (!caption && !file) {
    toast('Add an image or a caption');
    return;
  }

  let imageUrl = '';
  if (file) {
    imageUrl = await fileToDataUrl(file);
  }

  const posts = ls.get('posts') || [];
  posts.unshift({
    id: uid(),
    authorId: currentUser.id,
    imageUrl,
    caption,
    timestamp: Date.now(),
    likes: [],
    comments: [],
  });

  ls.set('posts', posts);
  closeAddModal();
  renderPosts();
  toast('Post shared!');
}


/* ============================================================
   POST DETAIL MODAL
============================================================ */
function openModal(postId) {
  const posts = ls.get('posts') || [];
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  activePostId = postId;

  const users = ls.get('users') || [];
  const author = users.find(u => u.id === post.authorId) || { username: 'unknown', avatarUrl: '' };

  const pmiImg = document.getElementById('pmi-img');
  const pmiNoImg = document.getElementById('pmi-no-image');
  if (post.imageUrl) {
    pmiImg.src = post.imageUrl; pmiImg.style.display = 'block'; pmiNoImg.style.display = 'none';
  } else {
    pmiImg.style.display = 'none'; pmiNoImg.style.display = 'flex';
  }

  document.getElementById('pmi-author').textContent = '@' + author.username;
  document.getElementById('pmi-time').textContent = fmtDate(post.timestamp);
  document.getElementById('pmi-av-inner').innerHTML = author.avatarUrl
    ? '<img src="' + esc(author.avatarUrl) + '" />' : '&#x1F464;';

  document.getElementById('pmi-caption').innerHTML =
    '<span class="pmi-caption-author">@' + esc(author.username) + '</span>' + esc(post.caption || '');

  const liked = (post.likes || []).includes(currentUser.id);
  document.getElementById('pmi-like-icon').textContent = liked ? '\u2764\uFE0F' : '\u{1F90D}';
  document.getElementById('pmi-like-count').textContent = (post.likes || []).length;
  document.getElementById('pmi-like-btn').className = 'pmi-like-btn' + (liked ? ' liked' : '');
  document.getElementById('pmi-del-btn').style.display = post.authorId === currentUser.id ? 'inline' : 'none';

  renderModalComments(post);
  document.getElementById('post-modal').classList.add('open');
  document.getElementById('comment-input').value = '';
  document.getElementById('comment-submit-btn').disabled = true;
}

function closeModal() {
  document.getElementById('post-modal').classList.remove('open');
  activePostId = null;
}

function renderModalComments(post) {
  const users = ls.get('users') || [];
  const container = document.getElementById('pmi-comments');
  const comments = post.comments || [];
  if (!comments.length) {
    container.innerHTML = '<p style="color:var(--color-text-muted);font-size:12px;padding:4px 0">No comments yet. Be the first!</p>';
    return;
  }
  container.innerHTML = '';
  comments.forEach(c => {
    const u = users.find(u => u.id === c.authorId) || { username: '?' };
    const d = document.createElement('div');
    d.className = 'pmi-comment-item';
    d.innerHTML =
      '<div><span class="pmi-comment-author">@' + esc(u.username) + '</span>' +
      '<span>' + esc(c.text) + '</span>' +
      '<div class="pmi-comment-ts">' + timeAgo(c.timestamp) + '</div></div>';
    container.appendChild(d);
  });
  container.scrollTop = container.scrollHeight;
}


/* ============================================================
   LIKE
============================================================ */
function modalToggleLike() {
  const posts = ls.get('posts') || [];
  const idx = posts.findIndex(p => p.id === activePostId);
  if (idx === -1) return;
  posts[idx].likes = posts[idx].likes || [];
  const li = posts[idx].likes.indexOf(currentUser.id);
  const liked = li === -1;
  if (liked) posts[idx].likes.push(currentUser.id);
  else posts[idx].likes.splice(li, 1);
  ls.set('posts', posts);
  document.getElementById('pmi-like-count').textContent = posts[idx].likes.length;
  document.getElementById('pmi-like-icon').textContent = liked ? '\u2764\uFE0F' : '\u{1F90D}';
  document.getElementById('pmi-like-btn').className = 'pmi-like-btn' + (liked ? ' liked' : '');
  renderPosts();
  if (document.getElementById('liked-section').style.display !== 'none') renderLikedPosts();
}


/* ============================================================
   DELETE POST
============================================================ */
function deletePost() {
  showConfirm('Delete this post? This cannot be undone.', () => {
    ls.set('posts', (ls.get('posts') || []).filter(p => p.id !== activePostId));
    closeModal();
    renderPosts();
    toast('Post deleted');
  }, 'Delete post');
}


/* ============================================================
   ADD COMMENT
============================================================ */
function submitComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;
  const posts = ls.get('posts') || [];
  const idx = posts.findIndex(p => p.id === activePostId);
  if (idx === -1) return;
  posts[idx].comments = posts[idx].comments || [];
  posts[idx].comments.push({ id: uid(), authorId: currentUser.id, text, timestamp: Date.now() });
  ls.set('posts', posts);
  input.value = '';
  document.getElementById('comment-submit-btn').disabled = true;
  renderModalComments(posts[idx]);
  renderPosts();
}


document.addEventListener('DOMContentLoaded', init);



