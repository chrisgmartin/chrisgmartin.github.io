// Home page: the domain atlas. Loaded after nav.js; kept external so the site CSP needs no inline script.
(function(){
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Architecture data: one accurate diagram per domain (viewBox 640x360) ----
  // Architecture data lives in index.html as <script type="application/json" id="atlas-data"> (one entry per domain).
  var D=JSON.parse(document.getElementById('atlas-data').textContent);

  // Reverse a path made of M / L / C commands (for bidirectional pulses)
  function reversePath(d){
    var t=d.match(/[MLC][^MLC]*/g),pts=[],segs=[];
    t.forEach(function(seg){var c=seg[0],n=seg.slice(1).trim().split(/[\s,]+/).map(Number);
      if(c==='M'){pts.push([n[0],n[1]]);}else if(c==='L'){segs.push({t:'L'});pts.push([n[0],n[1]]);}
      else if(c==='C'){segs.push({t:'C',c1:[n[0],n[1]],c2:[n[2],n[3]]});pts.push([n[4],n[5]]);}});
    var out='M'+pts[pts.length-1].join(' ');
    for(var i=segs.length-1;i>=0;i--){var s=segs[i],p=pts[i];
      out+= s.t==='L' ? ' L'+p.join(' ') : ' C'+s.c2.join(' ')+' '+s.c1.join(' ')+' '+p.join(' ');}
    return out;
  }
  function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e;}

  var svg=document.getElementById('svg'),board=document.getElementById('board'),
      capText=document.getElementById('capText'),capLink=document.getElementById('capLink'),
      index=document.getElementById('index'),prog=document.getElementById('prog');
  var anims=[],active=0,timer=null,progAnim=null,CYCLE=7500,paused=false;

  function render(i){
    anims.forEach(function(a){try{a.cancel();}catch(e){}});anims=[];
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    var d=D[i];
    (d.containers||[]).forEach(function(c){
      svg.appendChild(el('rect',{class:'container',x:c.x,y:c.y,width:c.w,height:c.h}));
      var t=el('text',{class:'container-label',x:c.x+10,y:c.y+14});t.textContent=c.l;svg.appendChild(t);
    });
    var edgeEls=[];
    d.edges.forEach(function(e,j){
      var p=el('path',{class:'edge'+(e.dashed?' dashed':''),d:e.d});svg.appendChild(p);edgeEls.push({p:p,e:e});
    });
    d.nodes.forEach(function(n,j){
      var w=n.w||104,h=n.h||36,g=el('g',{class:'node'+(n.k?' key':'')});
      g.appendChild(el('rect',{x:n.x-w/2,y:n.y-h/2,width:w,height:h}));
      var t=el('text',{x:n.x,y:n.s?n.y-6:n.y});t.textContent=n.l;g.appendChild(t);
      if(n.s){var s=el('text',{class:'sub',x:n.x,y:n.y+8});s.textContent=n.s;g.appendChild(s);}
      svg.appendChild(g);
      if(reduce){g.style.opacity=1;}else{g.style.opacity=0;anims.push(g.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:520,delay:120+j*70,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}));}
    });
    // edges draw in, then pulses run along them at constant speed
    edgeEls.forEach(function(o,j){
      var len=o.p.getTotalLength();
      if(reduce){}else{
        if(!o.e.dashed){o.p.style.strokeDasharray=len;o.p.style.strokeDashoffset=len;
          anims.push(o.p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:700,delay:260+j*70,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}));}
        else{o.p.style.opacity=0;anims.push(o.p.animate([{opacity:0},{opacity:1}],{duration:500,delay:700+j*60,fill:'forwards'}));}
      }
      if(o.e.nop)return;
      var paths=[o.e.d];if(o.e.bi)paths.push(reversePath(o.e.d));
      paths.forEach(function(pd,k){
        var c=el('circle',{class:'pulse'+(o.e.amber||k===1?' amber':''),r:3.2});c.style.offsetPath='path("'+pd+'")';svg.appendChild(c);
        var dur=Math.max(1400,len/95*1000);
        if(reduce){c.style.opacity=1;c.style.offsetDistance=(30+j*9)%80+'%';return;}
        anims.push(c.animate([{offsetDistance:'0%',opacity:0},{offsetDistance:'8%',opacity:1},{offsetDistance:'92%',opacity:1},{offsetDistance:'100%',opacity:0}],
          {duration:dur,delay:1300+j*380+k*900,iterations:Infinity,easing:'linear'}));
      });
    });
    capText.textContent=d.caption;capLink.textContent='';capLink.setAttribute('href',d.href);
    capLink.innerHTML='<b>'+d.count+'</b> '+(d.unit||'guides')+' →';
    Array.prototype.forEach.call(index.children,function(li,j){li.classList.toggle('on',j===i);});
  }

  function show(i,fromUser){
    if(i===active&&fromUser)return;
    active=i;
    board.classList.add('fade');
    setTimeout(function(){render(i);board.classList.remove('fade');},260);
    restart();
  }
  function restart(){
    clearTimeout(timer);if(progAnim)progAnim.cancel();
    if(reduce)return;
    progAnim=prog.animate([{width:'0%'},{width:'100%'}],{duration:CYCLE,easing:'linear',fill:'forwards'});
    timer=setTimeout(function(){if(!paused)show((active+1)%D.length);else restart();},CYCLE);
  }

  D.forEach(function(d,i){
    var li=document.createElement('li'),b=document.createElement('a');b.href=d.href;
    b.innerHTML='<span class="n">'+String(i+1).padStart(2,'0')+'</span><span class="nm">'+d.name+'</span><span class="ct"><b>'+d.count+'</b> '+(d.unit||'guides')+'</span>';
    b.addEventListener('focus',function(){show(i,true);});
    b.addEventListener('mouseenter',function(){show(i,true);});
    li.appendChild(b);index.appendChild(li);
  });
  var viewer=document.getElementById('viewer');
  viewer.addEventListener('mouseenter',function(){paused=true;});
  viewer.addEventListener('mouseleave',function(){paused=false;restart();});
  document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(timer);}else{restart();}});

  render(0);restart();


  // ---- Hero background: a large, faint isometric platform schematic (storage → processing → serving) ----
  (function isoArt(){
    var svg=document.getElementById('isoArt');if(!svg)return;
    var A=34,H=22,GAP=88,OX=650,OY=300;          // iso half-width, block height, tier spacing, origin
    var g=el('g',{class:'iso float'});svg.appendChild(g);
    function P(i,j,k){return [OX+(i-j)*A, OY+(i+j)*(A/2)-k*(H+GAP)];}   // grid → screen (2:1 isometric)
    function cube(i,j,k,key){
      var c=P(i,j,k),tx=c[0],ty=c[1],grp=el('g',{class:'block'+(key?' key':'')});
      var top=[[tx,ty-A/2],[tx+A,ty],[tx,ty+A/2],[tx-A,ty]];
      var left=[[tx-A,ty],[tx,ty+A/2],[tx,ty+A/2+H],[tx-A,ty+H]];
      var right=[[tx+A,ty],[tx,ty+A/2],[tx,ty+A/2+H],[tx+A,ty+H]];
      [['left',left],['right',right],['top',top]].forEach(function(f){grp.appendChild(el('polygon',{class:'face '+f[0],points:f[1].map(function(p){return p.join(',')}).join(' ')}));});
      g.appendChild(grp);return c;
    }
    // Tiers: a broad base (storage), a tighter middle (processing), a small crown (serving). Drawn back-to-front.
    var tiers=[
      {k:0,cells:[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[1,3],[2,3],[3,3],[4,3],[2,4],[3,4]],key:[[2,2],[3,1]],label:'storage · lakehouse'},
      {k:1,cells:[[1,1],[2,1],[3,1],[1,2],[2,2],[3,2],[2,3],[3,3]],key:[[2,2]],label:'processing'},
      {k:2,cells:[[2,2],[3,2],[2,3]],key:[[2,2]],label:'serving'}
    ];
    var risers=[];
    tiers.forEach(function(t){
      t.cells.sort(function(a,b){return (a[0]+a[1])-(b[0]+b[1]);});
      t.cells.forEach(function(c){var isKey=t.key.some(function(k){return k[0]===c[0]&&k[1]===c[1];});cube(c[0],c[1],t.k,isKey);});
      var lp=P(t.cells[0][0]-1,t.cells[0][1]+1,t.k);var lbl=el('text',{class:'tier',x:lp[0]-6,y:lp[1]+4,'text-anchor':'end'});lbl.textContent=t.label;g.appendChild(lbl);
    });
    // Risers connect a block's top to the block above it; a few are "hot" and carry pulses.
    [[2,2,0,1,true],[3,1,0,1,false],[1,2,0,1,false],[2,2,1,2,true],[3,2,1,2,false],[2,3,1,2,false]].forEach(function(r){
      var a=P(r[0],r[1],r[2]),b=P(r[0],r[1],r[3]);
      var d='M'+a[0]+' '+(a[1]-A/2)+' L'+b[0]+' '+(b[1]+A/2+H);
      g.insertBefore(el('path',{class:'riser'+(r[4]?' hot':''),d:d}),g.firstChild);
      if(r[4])risers.push(d);
    });
    if(reduce)return;
    risers.forEach(function(d,i){
      var c=el('circle',{class:'pulse',r:3});c.style.offsetPath='path("'+d+'")';g.appendChild(c);
      c.animate([{offsetDistance:'0%',opacity:0},{offsetDistance:'10%',opacity:1},{offsetDistance:'90%',opacity:1},{offsetDistance:'100%',opacity:0}],{duration:2600,delay:1200+i*1700,iterations:Infinity,easing:'linear'});
    });
  })();
})();
FG.globalNav(document.getElementById("nav"),{base:""});
