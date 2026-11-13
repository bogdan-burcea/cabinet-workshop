const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function routeCost(blocks,start=[0,0]){let p=start,n=0;for(const b of blocks){n+=dist(p,b.entry);p=b.exit;}return n;}
// Deterministic nearest-next plus local swaps. Retain the original route if better.
export function shorterRoute(blocks,start=[0,0]){if(blocks.length<2)return blocks;const rest=[...blocks],near=[];let p=start;while(rest.length){let k=0;for(let i=1;i<rest.length;i++)if(dist(p,rest[i].entry)<dist(p,rest[k].entry)-1e-7)k=i;const b=rest.splice(k,1)[0];near.push(b);p=b.exit;}
 function improve(a){a=[...a];for(let pass=0;pass<2;pass++){let changed=false;for(let i=0;i<a.length-1;i++)for(let j=i+1;j<a.length;j++){const links=[...new Set([i,i+1,j,j+1])].filter(k=>k<a.length),cost=()=>links.reduce((s,k)=>s+dist(k?a[k-1].exit:start,a[k].entry),0),old=cost();[a[i],a[j]]=[a[j],a[i]];if(cost()<old-1e-7)changed=true;else [a[i],a[j]]=[a[j],a[i]];}if(!changed)break;}return a;}
 const candidates=[blocks,improve(blocks),improve(near)];return candidates.reduce((a,b)=>routeCost(b,start)<routeCost(a,start)-1e-7?b:a);
}
export function measureMoves(job){job.cutLength=0;job.rapidLength=0;job.minutes=0;for(const m of job.moves){const length=m.kind==='arc'?Math.PI*Math.hypot(m.from[0]-m.cx,m.from[1]-m.cy):Math.hypot(...m.to.map((v,i)=>v-m.from[i]));if(m.kind==='rapid')job.rapidLength+=length;else{job.cutLength+=length;job.minutes+=length/(m.feed||job.settings.feed);}}return job;}
export function optimizeTravel(job,{originRetract=true,start=job.routeStart||[0,0]}={}){measureMoves(job);const before=job.rapidLength;if(!job.moves.length||job.moves.some(m=>m.pathBlock===undefined))return measureMoves(job);const blocks=[];for(const m of job.moves){let b=blocks.at(-1);if(!b||b.id!==m.pathBlock){b={id:m.pathBlock,moves:[],type:m.pathType,tool:m.toolNumber||0};blocks.push(b);}b.moves.push(m);}
 for(const b of blocks){const first=b.moves.findIndex(m=>m.kind!=='rapid');if(first<0)return measureMoves(job);b.entry=b.moves[first].from.slice(0,2);b.exit=b.moves.at(-1).to.slice(0,2);b.moves=b.moves.slice(first);}
 // Do not cross tool-stage or feature/profile barriers; profiles always remain last.
 const groups=[];for(const b of blocks){let g=groups.at(-1);if(!g||g.type!==b.type||g.tool!==b.tool){g={type:b.type,tool:b.tool,blocks:[]};groups.push(g);}g.blocks.push(b);}
 const safe=job.settings.safeZ,moves=[];let pos=[...start,safe];const add=m=>{const next={...m,from:[...pos],to:[...m.to]};if(next.kind==='rapid'&&next.to.every((v,i)=>Math.abs(v-pos[i])<1e-9))return;moves.push(next);pos=next.to;};
 // Keep the leading origin retract for existing sheet transforms and exported setup.
 if(originRetract)moves.push({kind:'rapid',from:[...pos],to:[...pos],pathBlock:blocks[0].id,pathType:blocks[0].type,toolNumber:blocks[0].tool});
 for(const group of groups)for(const b of shorterRoute(group.blocks,pos)){const first=b.moves[0],meta={pathBlock:b.id,pathType:b.type,toolNumber:b.tool,operation:first.operation,diameter:first.diameter};add({kind:'rapid',to:[...b.entry,safe],...meta});add({kind:'rapid',to:[...b.entry,job.settings.clearZ],...meta});for(const m of b.moves)add(m);}
 job.moves=moves;measureMoves(job);job.travelOptimization={before,after:job.rapidLength};return job;
}
