import {objects,bounds,clearance,frame,isOpening,oriented,isFixture,fixtureTop,fixtureHole,cutoutsFor}from './model.js';import{COLORS}from'./scene.js';
export class Plan{
 constructor(canvas,{select,move,end}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.select=select;this.move=move;this.end=end;this.drag=null;this.showFixtures=true;
 new ResizeObserver(()=>this.draw()).observe(canvas);canvas.addEventListener('pointerdown',e=>this.down(e));canvas.addEventListener('pointermove',e=>this.dragMove(e));canvas.addEventListener('pointerup',e=>this.up(e));canvas.addEventListener('pointercancel',()=>this.up());canvas.addEventListener('lostpointercapture',()=>this.up());}
 update(p,selected){this.p=p;this.selected=selected;this.draw();}
 transform(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight,p=this.p;const s=Math.max(.0001,Math.min((w-110)/p.room.width,(h-100)/p.room.depth));return {s,x:(w-p.room.width*s)/2,y:(h-p.room.depth*s)/2,w,h};}
 rect(c){const t=this.transform(),b=isOpening(c)?clearance(this.p,c):bounds(this.p,c);return {x:t.x+b[0]*t.s,y:t.y+b[1]*t.s,w:(b[3]-b[0])*t.s,h:(b[4]-b[1])*t.s};}
 draw(){if(!this.p)return;const {canvas,ctx:q,p}=this,t=this.transform(),dpr=devicePixelRatio||1;canvas.width=Math.round(t.w*dpr);canvas.height=Math.round(t.h*dpr);q.setTransform(dpr,0,0,dpr,0,0);q.clearRect(0,0,t.w,t.h);
 const {s,x,y}=t,{width:w,depth:d}=p.room;q.fillStyle='#fffefa';q.fillRect(x,y,w*s,d*s);q.strokeStyle='#e8ebe2';q.lineWidth=1;q.beginPath();for(let a=0;a<=w;a+=500){q.moveTo(x+a*s,y);q.lineTo(x+a*s,y+d*s)}for(let a=0;a<=d;a+=500){q.moveTo(x,y+a*s);q.lineTo(x+w*s,y+a*s)}q.stroke();q.strokeStyle='#83917e';q.lineWidth=3;q.strokeRect(x,y,w*s,d*s);
 q.font='10px "DM Sans",system-ui';q.fillStyle='#889681';q.textAlign='center';q.fillText('NORTH  ·  '+w+' mm',x+w*s/2,y-11);q.fillText('SOUTH',x+w*s/2,y+d*s+19);q.save();q.translate(x-18,y+d*s/2);q.rotate(-Math.PI/2);q.fillText('WEST',0,0);q.restore();q.save();q.translate(x+w*s+18,y+d*s/2);q.rotate(Math.PI/2);q.fillText('EAST  ·  '+d+' mm',0,0);q.restore();
 for(const c of p.worktops){const r=this.rect(c);q.strokeStyle=c.id===this.selected?'#d38249':'#687d69';q.lineWidth=c.id===this.selected?2:1;q.setLineDash([2,3]);q.strokeRect(r.x,r.y,r.w,r.h);q.setLineDash([])}
 for(const c of [...p.cabinets,...p.appliances,...(p.finishing||[])].sort((a,b)=>a.elevation-b.elevation)){const r=this.rect(c);q.fillStyle=COLORS[c.kind]+(c.kind==='Wall'?'ae':'e6');q.fillRect(r.x,r.y,r.w,r.h);q.strokeStyle=c.id===this.selected?'#d97a37':'#8c9788';q.lineWidth=c.id===this.selected?2:1;q.setLineDash(c.kind==='Wall'?[4,3]:[]);q.strokeRect(r.x,r.y,r.w,r.h);q.setLineDash([]);
  if(c.kind==='Blind corner'){
   const [,bx,by,,bw,bd]=oriented(p,c,['Blind area',c.blind_side==='Left'?0:c.width-c.blind_width,0,0,c.blind_width,c.depth+20,c.height]);
   const hx=x+bx*s,hy=y+by*s,hw=bw*s,hh=bd*s;q.save();q.beginPath();q.rect(hx,hy,hw,hh);q.clip();q.strokeStyle='#88725766';q.lineWidth=1;q.beginPath();for(let a=-hh;a<hw+hh;a+=7){q.moveTo(hx+a,hy+hh);q.lineTo(hx+a+hh,hy);}q.stroke();q.restore();
   if(hw>30&&hh>15){q.fillStyle='#71634f';q.font='8px system-ui';q.fillText('BLIND',hx+hw/2,hy+hh*.3);q.font='10px "DM Sans",system-ui';}
  }
  const [ox,oy,ux,uy,vx,vy]=frame(p,c);q.strokeStyle='#526a55';q.lineWidth=2;q.beginPath();q.moveTo(x+(ox+vx*(c.depth+(c.setback||0)))*s,y+(oy+vy*(c.depth+(c.setback||0)))*s);q.lineTo(x+(ox+ux*c.width+vx*(c.depth+(c.setback||0)))*s,y+(oy+uy*c.width+vy*(c.depth+(c.setback||0)))*s);q.stroke();
  if(r.w>24&&r.h>13){q.fillStyle='#4e5f4d';q.save();q.beginPath();q.rect(r.x+2,r.y+1,r.w-4,r.h-2);q.clip();const max=r.w-4;let text=c.label;while(text.length>2&&q.measureText(text).width>max)text=text.slice(0,-2)+'…';q.fillText(text,r.x+r.w/2,c.kind==='Wall'?r.y+Math.max(12,r.h*.27):r.y+r.h*.77);q.restore();}
 }
 for(const f of p.fixtures||[]){const hole=fixtureHole(p,f),r=this.rect(f);q.fillStyle='#e7f0ea';q.strokeStyle=f.id===this.selected?'#d97a37':'#557d73';q.lineWidth=1.5;q.setLineDash([3,2]);q.fillRect(x+hole.x*s,y+hole.y*s,hole.width*s,hole.depth*s);q.strokeRect(x+hole.x*s,y+hole.y*s,hole.width*s,hole.depth*s);q.setLineDash([]);
  if(this.showFixtures){q.fillStyle=f.kind==='Hob'?'#425656dd':'#aec8cadd';q.fillRect(r.x,r.y,r.w,r.h);q.strokeStyle=f.id===this.selected?'#d97a37':'#6f8981';q.strokeRect(r.x,r.y,r.w,r.h);}q.fillStyle=this.showFixtures&&f.kind==='Hob'?'#e1ece4':'#42645c';if(r.w>20&&r.h>12)q.fillText(this.showFixtures?f.kind:'CUT',r.x+r.w/2,r.y+r.h/2+3);
 }
 for(const c of p.openings){const r=this.rect(c),[ox,oy,ux,uy]=frame(p,c);q.fillStyle=(c.kind==='Door'?'#c4a081':'#9ccee0')+'25';q.fillRect(r.x,r.y,r.w,r.h);q.strokeStyle=c.id===this.selected?'#d97a37':COLORS[c.kind];q.lineWidth=1.5;q.setLineDash([5,3]);q.strokeRect(r.x,r.y,r.w,r.h);q.setLineDash([]);q.lineWidth=5;q.beginPath();q.moveTo(x+ox*s,y+oy*s);q.lineTo(x+(ox+ux*c.width)*s,y+(oy+uy*c.width)*s);q.stroke();q.fillStyle='#7e8c76';const tx=x+(ox+ux*c.width/2)*s,ty=y+(oy+uy*c.width/2)*s;
  if(c.kind==='Door')q.fillText(c.label,r.x+r.w/2,r.y+r.h/2+3);else{q.textAlign=c.wall==='West'?'left':c.wall==='East'?'right':'center';q.fillText(c.label,tx+(c.wall==='West'?12:c.wall==='East'?-12:0),ty+(c.wall==='North'?18:c.wall==='South'?-12:3));q.textAlign='center';}
 }
 }
 location(e){const r=this.canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
 down(e){if(e.button!==0||!this.p)return;const pos=this.location(e),hits=[...this.p.worktops,...this.p.cabinets,...this.p.appliances,...(this.p.finishing||[]),...this.p.openings,...(this.p.fixtures||[])].filter(c=>{const r=this.rect(c);return pos.x>=r.x-2&&pos.x<=r.x+r.w+2&&pos.y>=r.y-2&&pos.y<=r.y+r.h+2});const c=e.altKey?hits[0]:hits.at(-1);this.select(c?.id||null);if(c){this.drag={c:structuredClone(c),start:pos};this.canvas.setPointerCapture(e.pointerId);this.canvas.style.cursor='grabbing';}}
 dragMove(e){if(!this.drag)return;const t=this.transform(),pos=this.location(e),old=this.drag.c,dx=(pos.x-this.drag.start.x)/t.s,dy=(pos.y-this.drag.start.y)/t.s;const values={};
 if(isFixture(old)){const top=fixtureTop(this.p,old),[,,ux,uy,vx,vy]=frame(this.p,top);values.offset_u=Math.max(old.width/2,Math.min(top.width-old.width/2,Math.round((old.offset_u+dx*ux+dy*uy)/10)*10));values.offset_v=Math.max(old.depth/2,Math.min(top.depth-old.depth/2,Math.round((old.offset_v+dx*vx+dy*vy)/10)*10));}
 else if(old.wall==='Free'){values.x=Math.max(-100000,Math.min(100000,Math.round((old.x+dx)/10)*10));values.y=Math.max(-100000,Math.min(100000,Math.round((old.y+dy)/10)*10));}
 else{const [,,ux,uy]=frame(this.p,old),len=['North','South'].includes(old.wall)?this.p.room.width:this.p.room.depth;values.offset=Math.max(0,Math.min(len-old.width,Math.round((old.offset+dx*ux+dy*uy)/10)*10));}this.move(old.id,values);}
 up(){if(this.drag){this.drag=null;this.canvas.style.cursor='default';this.end();}}
}
