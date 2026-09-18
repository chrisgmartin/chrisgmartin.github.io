// 404 page: the broken-platform art. Loaded after nav.js; external so the site CSP needs no inline script.
(function(){
  var NS='http://www.w3.org/2000/svg',reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e;}
  var svg=document.getElementById('isoArt'),A=34,H=22,GAP=88,OX=650,OY=300;
  var g=el('g',{class:'iso float'});svg.appendChild(g);
  function P(i,j,k){return [OX+(i-j)*A, OY+(i+j)*(A/2)-k*(H+GAP)];}
  function cube(i,j,k,missing){
    var c=P(i,j,k),tx=c[0],ty=c[1],grp=el('g',{class:'block'+(missing?' missing':'')});
    var top=[[tx,ty-A/2],[tx+A,ty],[tx,ty+A/2],[tx-A,ty]],
        left=[[tx-A,ty],[tx,ty+A/2],[tx,ty+A/2+H],[tx-A,ty+H]],
        right=[[tx+A,ty],[tx,ty+A/2],[tx,ty+A/2+H],[tx+A,ty+H]];
    var faces=missing?[['top',top]]:[['left',left],['right',right],['top',top]];
    faces.forEach(function(f){grp.appendChild(el('polygon',{class:'face '+f[0],points:f[1].map(function(p){return p.join(',')}).join(' ')}));});
    g.appendChild(grp);return c;
  }
  // The same platform as the home page — but the serving block the route points at is missing.
  var tiers=[
    {k:0,cells:[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[1,3],[2,3],[3,3],[4,3],[2,4],[3,4]],label:'storage · lakehouse'},
    {k:1,cells:[[1,1],[2,1],[3,1],[1,2],[2,2],[3,2],[2,3],[3,3]],label:'processing'},
    {k:2,cells:[[3,2],[2,3]],missing:[[2,2]],label:'serving'}
  ];
  tiers.forEach(function(t){
    var all=t.cells.concat(t.missing||[]).sort(function(a,b){return (a[0]+a[1])-(b[0]+b[1]);});
    all.forEach(function(c){var m=(t.missing||[]).some(function(x){return x[0]===c[0]&&x[1]===c[1];});cube(c[0],c[1],t.k,m);});
    var lp=P(all[0][0]-1,all[0][1]+1,t.k);var lbl=el('text',{class:'tier',x:lp[0]-6,y:lp[1]+4,'text-anchor':'end'});lbl.textContent=t.label;g.appendChild(lbl);
  });
  // risers; the one leading to the missing block is broken
  var hot=null;
  [[2,2,0,1,false],[3,1,0,1,false],[1,2,0,1,false],[2,2,1,2,true],[3,2,1,2,false],[2,3,1,2,false]].forEach(function(r){
    var a=P(r[0],r[1],r[2]),b=P(r[0],r[1],r[3]);
    var d='M'+a[0]+' '+(a[1]-A/2)+' L'+b[0]+' '+(b[1]+A/2+H);
    g.insertBefore(el('path',{class:'riser'+(r[4]?' broken':''),d:d}),g.firstChild);
    if(r[4])hot=d;
  });
  var mp=P(2,2,2);var lost=el('text',{class:'lost',x:mp[0]+A+10,y:mp[1]+2});lost.textContent='← not found';g.appendChild(lost);
  if(reduce||!hot)return;
  // a pulse climbs toward the missing block and dissipates at the gap
  var c=el('circle',{class:'pulse',r:3});c.style.offsetPath='path("'+hot+'")';g.appendChild(c);
  c.animate([{offsetDistance:'0%',opacity:0},{offsetDistance:'12%',opacity:1},{offsetDistance:'70%',opacity:1},{offsetDistance:'100%',opacity:0}],{duration:2400,delay:900,iterations:Infinity,easing:'linear'});
})();
FG.globalNav(document.getElementById("nav"),{base:"/"});
