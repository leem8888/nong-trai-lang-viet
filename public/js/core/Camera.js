import { project, unproject, ISO_X, ISO_Y } from './IsoProjection.js';
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export class Camera {
  constructor(world) { this.world = world; this.x = 900; this.y = 760; this.width = 1; this.height = 1; this.base = .9; this.focus = 1; this.focusTarget = 1; this.zoom = .9; this.isometric = false; }
  // Maps may scale the default zoom (indoor rooms zoom out a little so the altar or shelves stay in view);
  // `focus` is a gentle extra zoom used while meditating.
  fit() { this.zoom = this.base * (this.world.zoom || 1) * this.focus; this.constrain(); }
  resize(width, height) { this.width = width; this.height = height; this.base = this.isometric ? (width < 600 ? .62 : .72) : (width < 600 ? .75 : .9); this.fit(); }
  constrain() {
    if (this.isometric) {
      const center = project(this.x, this.y, this.world.height);
      const bounds = { width: (this.world.width + this.world.height) * ISO_X, height: (this.world.width + this.world.height) * ISO_Y };
      const hw = this.width / this.zoom / 2, hh = this.height / this.zoom / 2;
      center.x = hw >= bounds.width / 2 ? bounds.width / 2 : clamp(center.x, hw, bounds.width - hw);
      center.y = hh >= bounds.height / 2 ? bounds.height / 2 : clamp(center.y, hh, bounds.height - hh);
      const worldPoint = unproject(center.x, center.y, this.world.height);
      this.x = worldPoint.x; this.y = worldPoint.y;
      return;
    }
    const hw = this.width / this.zoom / 2, hh = this.height / this.zoom / 2;
    this.x = hw >= this.world.width / 2 ? this.world.width / 2 : clamp(this.x, hw, this.world.width - hw);
    this.y = hh >= this.world.height / 2 ? this.world.height / 2 : clamp(this.y, hh, this.world.height - hh);
  }
  setWorld(world) { this.world = world; this.fit(); }
  setFocus(focus) { this.focusTarget = focus; }
  snap(x, y) { this.x = x; this.y = y; this.constrain(); }
  update(target, dt) {
    const a = 1 - Math.exp(-5 * dt);
    if (Math.abs(this.focusTarget - this.focus) > .0005) { this.focus += (this.focusTarget - this.focus) * (1 - Math.exp(-1.5 * dt)); this.fit(); }
    this.x += (target.x - this.x) * a; this.y += (target.y - this.y) * a; this.constrain();
  }
  toWorld(x, y) { const center = this.isometric ? project(this.x, this.y, this.world.height) : { x: this.x, y: this.y }; const point = { x: (x - this.width / 2) / this.zoom + center.x, y: (y - this.height / 2) / this.zoom + center.y }; return this.isometric ? unproject(point.x, point.y, this.world.height) : point; }
  toScreen(x, y) { const center = this.isometric ? project(this.x, this.y, this.world.height) : { x: this.x, y: this.y }; const point = this.isometric ? project(x, y, this.world.height) : { x, y }; return { x: (point.x - center.x) * this.zoom + this.width / 2, y: (point.y - center.y) * this.zoom + this.height / 2 }; }
  apply(ctx) { ctx.translate(this.width / 2, this.height / 2); ctx.scale(this.zoom, this.zoom); if (this.isometric) { const center = project(this.x, this.y, this.world.height); ctx.translate(-center.x, -center.y); ctx.translate(this.world.height * ISO_X, 0); ctx.transform(ISO_X, ISO_Y, -ISO_X, ISO_Y, 0, 0); } else ctx.translate(-this.x, -this.y); }
  visible(x, y, margin = 180) { if (this.isometric) { const point = project(x, y, this.world.height), center = project(this.x, this.y, this.world.height); return Math.abs(point.x - center.x) < this.width / this.zoom / 2 + margin && Math.abs(point.y - center.y) < this.height / this.zoom / 2 + margin; } return Math.abs(x - this.x) < this.width / this.zoom / 2 + margin && Math.abs(y - this.y) < this.height / this.zoom / 2 + margin; }
}
