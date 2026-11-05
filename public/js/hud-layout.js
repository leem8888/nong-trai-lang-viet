// The header can wrap as currency, farm names and viewport widths change.
const header=document.getElementById('hud'),game=document.getElementById('game');
const placeStatus=()=>{const bottom=header.getBoundingClientRect().bottom;if(bottom>0)game.style.setProperty('--hud-bottom',`${Math.ceil(bottom)}px`);};
new ResizeObserver(placeStatus).observe(header);
window.addEventListener('resize',placeStatus,{passive:true});
placeStatus();
