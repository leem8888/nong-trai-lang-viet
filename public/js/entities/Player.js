import { DURATIONS, ROUND, SPEED, DEFAULT_APPEARANCE } from '../shared/rules.js';
import {ISO_X,ISO_Y} from '../core/IsoProjection.js';
export function movementFacing(dx,dy,previous='down') {
  const x=(dx-dy)*ISO_X,y=(dx+dy)*ISO_Y;
  if(Math.hypot(x,y)<.001)return previous;
  // Keep the current axis near diagonals instead of flipping at every waypoint.
  const horizontal=previous==='left'||previous==='right';
  const useX=horizontal?Math.abs(x)>Math.abs(y)*.8:Math.abs(x)>Math.abs(y)*1.25;
  return useX?(x<0?'left':'right'):(y<0?'up':'down');
}
export { DURATIONS };
export class Player {
  constructor() { this.x = 900; this.y = 790; this.name = ''; this.appearance = { ...DEFAULT_APPEARANCE }; this.direction = 'down'; this.state = 'idle'; this.elapsed = 0; this.bows = 0; this.beads = 0; this.onComplete = () => {}; this.onStateChange = () => {}; }
  setState(state) { if (this.state === state) return; const previous = this.state; this.state = state; this.elapsed = 0; this.onStateChange(state, previous); }
  act(state) { if (!(state in DURATIONS) || !['idle', 'walk'].includes(this.state)) return false; this.setState(state); return true; }
  place(x, y, direction = this.direction) { this.x = x; this.y = y; this.direction = direction; }
  update(dt, vector, collision) {
    const visualStart={x:this.x,y:this.y};
    this.walkDistance??=0;
    if (this.state === 'meditate') vector = { x: 0, y: 0 };
    const length = Math.hypot(vector.x, vector.y);
    if (length > .05) {
      const before={x:this.x,y:this.y};
      const distance = Math.min(SPEED * dt, Number.isFinite(vector.maxDistance) ? Math.max(0, vector.maxDistance) : Infinity);
      collision.move(this, vector.x / Math.max(1, length) * distance, vector.y / Math.max(1, length) * distance);
      const dx=this.x-before.x,dy=this.y-before.y;
      this.walkDistance+=Math.hypot((dx-dy)*ISO_X,(dx+dy)*ISO_Y);
      if(Math.hypot(dx,dy)>.001){this.direction=movementFacing(dx,dy,this.direction);this.setState('walk');}
      else if(this.state==='walk')this.setState('idle');
    } else if (this.state === 'walk') this.setState('idle');
    const visualDt=Math.min(.1,Math.max(0,dt));
    this.visualClock=(this.visualClock||0)+visualDt;
    const walking=this.state==='walk';
    this.walkBlend=(this.walkBlend||0)+((walking?1:0)-(this.walkBlend||0))*(1-Math.exp(-visualDt*(walking?12:15)));
    const vx=((this.x-visualStart.x)-(this.y-visualStart.y))*ISO_X,vy=((this.x-visualStart.x)+(this.y-visualStart.y))*ISO_Y;
    const lean=walking?vx/(Math.hypot(vx,vy)||1)*.012:0;
    this.visualLean=(this.visualLean||0)+(lean-(this.visualLean||0))*(1-Math.exp(-visualDt*8));
    this.elapsed += dt;
    if (this.elapsed >= DURATIONS[this.state]) {
      const done = this.state; this.setState('idle');
      if (done === 'bow') this.bows = Math.min(ROUND, this.bows + 1);
      if (done === 'bead') this.beads = Math.min(ROUND, this.beads + 1);
      this.onComplete(done);
    }
  }
}
