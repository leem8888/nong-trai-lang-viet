const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class SocialUI {
  constructor(api, panel, error, notice, visit) {
    Object.assign(this, { api, panel, error, notice, visit });
    this.query = ''; this.page = 0; this.results = null; this.socket = null;
    document.getElementById('socialButton').onclick = () => this.open();
    const root = document.getElementById('panel');
    root.addEventListener('submit', async event => {
      if (event.target.id === 'socialSearch') {
        event.preventDefault(); this.query = event.target.elements.q.value.trim(); this.page = 0; await this.search();
      } else if (event.target.id === 'socialInvite') {
        event.preventDefault(); await this.run(() => this.api('/social/invites', { method: 'POST', body: JSON.stringify({ username: event.target.elements.username.value }) }), 'Đã gửi lời mời.');
      }
    });
    root.addEventListener('click', async event => {
      const b = event.target.closest('[data-social]'); if (!b) return;
      const id = b.dataset.id, action = b.dataset.social;
      if (action === 'emote') {
        if (!this.socket?.connected) return this.error('Mất kết nối với server.');
        return this.socket.emit('social:emote', { emote: b.dataset.emote }, result => { if (!result.ok) this.error(result.error); });
      }
      if (action === 'visit') return this.join(id);
      if (action === 'request') return this.run(() => this.api('/social/requests', { method: 'POST', body: JSON.stringify({ farmId: id }) }), 'Đã gửi yêu cầu. Chủ farm cần đồng ý.');
      if (action === 'approve' || action === 'deny') return this.run(() => this.api('/social/requests/decide', { method: 'POST', body: JSON.stringify({ id, approve: action === 'approve' }) }), 'Đã trả lời yêu cầu.');
      if (action === 'kick') return this.run(() => this.api('/social/kick', { method: 'POST', body: JSON.stringify({ visitorId: id }) }), 'Đã mời khách rời nông trại.');
      if (action === 'next' || action === 'prev') { this.page += action === 'next' ? 1 : -1; return this.search(); }
    });
    root.addEventListener('change', event => {
      if (event.target.id === 'socialPrivacy') this.run(() => this.api('/social/settings', { method: 'POST', body: JSON.stringify({ privacy: event.target.value }) }), 'Đã cập nhật quyền thăm.');
      if (event.target.id === 'socialNotices') localStorage.setItem('socialNotices', event.target.checked ? 'on' : 'off');
    });
  }
  setSocket(socket) {
    this.socket = socket;
    socket.on('social:notice', message => { if (localStorage.getItem('socialNotices') !== 'off') this.notice(message); });
  }
  async run(fn, message) { try { await fn(); this.notice(message); await this.open(); } catch (error) { this.error(error.message); } }
  async search() {
    try { this.results = await this.api(`/social/search?q=${encodeURIComponent(this.query)}&page=${this.page}`); await this.open(); }
    catch (error) { this.error(error.message); }
  }
  async join(farmId) {
    if (!this.socket?.connected) return this.error('Mất kết nối với server.');
    const result = await new Promise(resolve => this.socket.emit('social:join', { farmId }, resolve));
    if (!result.ok) return this.error(result.error);
    this.visit(result);
  }
  async open() {
    try {
      const [settings, requests, invites] = await Promise.all([this.api('/social/settings'), this.api('/social/requests'), this.api('/social/invites')]);
      const cards = this.results?.farms.map(f => `<article><b>${esc(f.name)}</b> · ${esc(f.ownerName)} <small>${f.visibility === 'public' ? 'Mở cửa' : 'Cần xin phép'}</small><button data-social="${f.canVisit ? 'visit' : 'request'}" data-id="${esc(f.id)}">${f.canVisit ? 'Thăm nông trại' : 'Xin vào'}</button></article>`).join('') || '';
      this.panel(`<h2>Thăm nông trại</h2><p>Chỉ chủ nhà được chăm ruộng và quản lý tài sản. Khách có thể đi dạo, chào hỏi.</p>
        <div class="social-controls" aria-label="Biểu cảm"><button data-social="emote" data-emote="hello">🌾 Chào</button><button data-social="emote" data-emote="wave">👋 Vẫy tay</button><button data-social="emote" data-emote="thanks">🙏 Cảm ơn</button><button data-social="emote" data-emote="happy">😊 Vui vẻ</button></div>
        <label>Quyền thăm farm của tôi<select id="socialPrivacy"><option value="private" ${settings.privacy === 'private' ? 'selected' : ''}>Riêng tư</option><option value="request" ${settings.privacy === 'request' ? 'selected' : ''}>Cần duyệt</option><option value="public" ${settings.privacy === 'public' ? 'selected' : ''}>Công khai</option></select></label>
        <label><input id="socialNotices" type="checkbox" ${localStorage.getItem('socialNotices') === 'off' ? '' : 'checked'}> Hiện thông báo khách và lời mời</label>
        <h3>Tìm nông trại</h3><form id="socialSearch" class="social-controls"><input name="q" aria-label="Tên chủ hoặc tên nông trại" placeholder="Tên chủ hoặc nông trại" minlength="2" maxlength="40" value="${esc(this.query)}" required><button>Tìm</button></form>
        <div class="social-results">${cards || (this.results ? '<p>Không tìm thấy nông trại phù hợp.</p>' : '')}</div>${this.results ? `<div class="social-controls"><button data-social="prev" ${this.page ? '' : 'disabled'}>Trước</button><button data-social="next" ${this.results.hasMore ? '' : 'disabled'}>Tiếp</button></div>` : ''}
        <h3>Lời mời</h3><form id="socialInvite" class="social-controls"><input name="username" aria-label="Tên tài khoản mời" placeholder="Tên tài khoản" maxlength="24" required><button>Mời bạn</button></form>
        ${invites.invites.map(i => `<p>${esc(i.name)} · ${esc(i.ownerName)} <button data-social="visit" data-id="${esc(i.farmId)}">Ghé thăm</button></p>`).join('') || '<p>Chưa có lời mời.</p>'}
        <h3>Yêu cầu chờ duyệt</h3>${requests.requests.map(r => `<p>${esc(r.visitorName)} <button data-social="approve" data-id="${esc(r.id)}">Đồng ý</button><button data-social="deny" data-id="${esc(r.id)}">Từ chối</button></p>`).join('') || '<p>Không có yêu cầu.</p>'}
        <h3>Khách đang ở farm</h3>${settings.members.filter(m => m.role === 'visitor').map(m => `<p>${esc(m.name)} <button data-social="kick" data-id="${esc(m.userId)}">Mời rời đi</button></p>`).join('') || '<p>Chưa có khách.</p>'}`);
    } catch (error) { this.error(error.message); }
  }
}
