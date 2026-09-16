// Guide plates — each guide's central idea, drawn the way you'd draw it on a whiteboard.
// One spec per guide (keyed by guide path) plus topic-level specs. Rendered at BUILD time by
// tools/plates/build.py (headless Chrome + vendored rough.js) into static SVG inlined in the hub.
// Conventions: 400x320 canvas; d.title() at the top; black marker = ink (--text), red marker
// ({red:1} / ring / underline / strike / star) = --accent, {wash:1} = --secondary tint. Keep every
// label clear of arrows; check the render (tools/plates/README.md) before committing.
(function(){
  var NS='http://www.w3.org/2000/svg';
  function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

  function makeDSL(svg,rc,seed){
    var base={roughness:1.2,bowing:1.1,strokeWidth:1.6,stroke:'#000',seed:seed};var n=0;
    function o(extra){n++;return Object.assign({},base,{seed:seed+n*31},extra||{});}
    function mark(el,attr){el.querySelectorAll('path').forEach(function(p){p.setAttribute(attr,'1');});return el;}
    function add(el,opt){if(opt&&opt.red)mark(el,'data-red');if(opt&&opt.faint)mark(el,'data-faint');svg.appendChild(el);return el;}
    function text(x,y,str,opt){opt=opt||{};var size=opt.size||12.5,lines=String(str).split('\n');var t=document.createElementNS(NS,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('class','hw'+(opt.cls?' '+opt.cls:''));t.setAttribute('text-anchor',opt.anchor||'middle');t.setAttribute('font-size',size);if(opt.rotate)t.setAttribute('transform','rotate('+opt.rotate+' '+x+' '+y+')');
      lines.forEach(function(l,i){var ts=document.createElementNS(NS,'tspan');ts.setAttribute('x',x);ts.setAttribute('dy',i?size*1.08:0);ts.textContent=l;t.appendChild(ts);});svg.appendChild(t);return t;}
    function head(x,y,ang,opt){var a=Math.PI*ang/180,l=8;add(rc.line(x,y,x-l*Math.cos(a-0.5),y-l*Math.sin(a-0.5),o()),opt);add(rc.line(x,y,x-l*Math.cos(a+0.5),y-l*Math.sin(a+0.5),o()),opt);}
    function edgePoint(b,tx,ty){ // point on box b's border toward (tx,ty)
      var cx=b.x+b.w/2,cy=b.y+b.h/2,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return [cx,cy];
      var sx=Math.abs(dx)>1e-6?(b.w/2)/Math.abs(dx):1e9,sy=Math.abs(dy)>1e-6?(b.h/2)/Math.abs(dy):1e9,s=Math.min(sx,sy);return [cx+dx*s,cy+dy*s];}
    var d={
      box:function(x,y,w,h,label,opt){opt=opt||{};var b={x:x,y:y,w:w,h:h,cx:x+w/2,cy:y+h/2};
        if(opt.wash)add(mark(rc.rectangle(x,y,w,h,o({fill:'#0e5e5b',fillStyle:'solid',stroke:'none'})),'data-wash'));
        if(opt.dashed)add(rc.rectangle(x,y,w,h,o({strokeLineDash:[5,5]})),opt);else add(rc.rectangle(x,y,w,h,o()),opt);
        if(label){var size=opt.size||12.5,nl=String(label).split('\n').length;text(x+w/2,y+h/2+size*0.36-(nl-1)*size*0.54,label,{size:size,cls:opt.cls});}
        return b;},
      round:function(x,y,w,h,label,opt){opt=opt||{};var r=Math.min(14,h/2);var b={x:x,y:y,w:w,h:h,cx:x+w/2,cy:y+h/2};var p='M'+(x+r)+' '+y+' h'+(w-2*r)+' a'+r+' '+r+' 0 0 1 '+r+' '+r+' v'+(h-2*r)+' a'+r+' '+r+' 0 0 1 -'+r+' '+r+' h-'+(w-2*r)+' a'+r+' '+r+' 0 0 1 -'+r+' -'+r+' v-'+(h-2*r)+' a'+r+' '+r+' 0 0 1 '+r+' -'+r+' z';
        if(opt.wash)add(mark(rc.path(p,o({fill:'#0e5e5b',fillStyle:'solid',stroke:'none'})),'data-wash'));add(rc.path(p,o()),opt);
        if(label){var size=opt.size||12.5,nl=String(label).split('\n').length;text(x+w/2,y+h/2+size*0.36-(nl-1)*size*0.54,label,{size:size});}return b;},
      cloud:function(x,y,w,h,label,opt){var b={x:x,y:y,w:w,h:h,cx:x+w/2,cy:y+h/2};add(rc.path('M'+(x+w*0.2)+' '+(y+h*0.85)+' a'+(w*0.16)+' '+(h*0.3)+' 0 0 1 '+(w*0.04)+' -'+(h*0.55)+' a'+(w*0.2)+' '+(h*0.4)+' 0 0 1 '+(w*0.36)+' -'+(h*0.12)+' a'+(w*0.18)+' '+(h*0.36)+' 0 0 1 '+(w*0.32)+' '+(h*0.33)+' a'+(w*0.12)+' '+(h*0.25)+' 0 0 1 -'+(w*0.08)+' '+(h*0.34)+' z',o()),opt);if(label)text(b.cx,b.cy+5,label,{size:(opt&&opt.size)||11.5});return b;},
      cyl:function(x,y,w,h,label,opt){var b={x:x,y:y,w:w,h:h,cx:x+w/2,cy:y+h/2};add(rc.ellipse(x+w/2,y+h*0.16,w,h*0.32,o()));add(rc.path('M'+x+' '+(y+h*0.16)+' v'+(h*0.68)+' a'+(w/2)+' '+(h*0.16)+' 0 0 0 '+w+' 0 v-'+(h*0.68),o()));if(label)text(x+w/2,y+h*0.64,label,{size:(opt&&opt.size)||11.5});return b;},
      arrow:function(x1,y1,x2,y2,opt){opt=opt||{};var ang;
        if(opt.curve){var mx=(x1+x2)/2,my=(y1+y2)/2,nx=-(y2-y1),ny=(x2-x1),L=Math.hypot(nx,ny)||1,cx=mx+nx/L*opt.curve,cy=my+ny/L*opt.curve;add(rc.path('M'+x1+' '+y1+' Q'+cx+' '+cy+' '+x2+' '+y2,o(opt.dash?{strokeLineDash:[5,5]}:{})),opt);ang=Math.atan2(y2-cy,x2-cx)*180/Math.PI;}
        else{add(rc.line(x1,y1,x2,y2,o(opt.dash?{strokeLineDash:[5,5]}:{})),opt);ang=Math.atan2(y2-y1,x2-x1)*180/Math.PI;}
        head(x2,y2,ang,opt);if(opt.label)text(opt.lx!=null?opt.lx:(x1+x2)/2,(opt.ly!=null?opt.ly:(y1+y2)/2)-6,opt.label,{size:10.5,cls:'note'});},
      connect:function(a,b,opt){opt=opt||{};var p=edgePoint(a,b.cx,b.cy),q=edgePoint(b,a.cx,a.cy);var g=opt.gap||3;var dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1;d.arrow(p[0]+dx/L*g,p[1]+dy/L*g,q[0]-dx/L*g,q[1]-dy/L*g,opt);},
      route:function(pts,opt){opt=opt||{};for(var i=0;i<pts.length-1;i++){var a=pts[i],b=pts[i+1];add(rc.line(a[0],a[1],b[0],b[1],o(opt.dash?{strokeLineDash:[5,5]}:{})),opt);}var a=pts[pts.length-2],b=pts[pts.length-1];head(b[0],b[1],Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,opt);},
      line:function(x1,y1,x2,y2,opt){add(rc.line(x1,y1,x2,y2,o(opt&&opt.dash?{strokeLineDash:[5,5]}:{})),opt);},
      ring:function(x,y,w,h){add(rc.ellipse(x+w/2,y+h/2,w,h,o({roughness:1.8,bowing:2.6,strokeWidth:1.8})),{red:1});},
      underline:function(x1,y,x2){add(rc.line(x1,y,x2,y+2,o({roughness:2.2,bowing:2.4,strokeWidth:1.8})),{red:1});},
      check:function(x,y,s){s=s||1;add(rc.path('M'+x+' '+y+' l'+(5*s)+' '+(6*s)+' l'+(11*s)+' -'+(14*s),o({strokeWidth:2})),{red:1});},
      cross:function(x,y,s){s=s||1;add(rc.line(x,y,x+10*s,y+10*s,o({strokeWidth:2})));add(rc.line(x+10*s,y,x,y+10*s,o({strokeWidth:2})));},
      strike:function(x1,y,x2){add(rc.line(x1,y,x2,y,o({strokeWidth:2,roughness:1.6})),{red:1});},
      bubble:function(x,y,w,h,label,opt){opt=opt||{};var r=12;add(rc.path('M'+(x+r)+' '+y+' h'+(w-2*r)+' a'+r+' '+r+' 0 0 1 '+r+' '+r+' v'+(h-2*r)+' a'+r+' '+r+' 0 0 1 -'+r+' '+r+' h-'+(w-2*r)+' a'+r+' '+r+' 0 0 1 -'+r+' -'+r+' v-'+(h-2*r)+' a'+r+' '+r+' 0 0 1 '+r+' -'+r+' z',o()));
        var tx=opt.tail==='left'?x+30:x+w-30,dir=opt.tail==='left'?-1:1;add(rc.path('M'+(tx-7)+' '+(y+h)+' l'+(dir*10)+' 13 l'+(dir*-4)+' -13',o()));
        var size=opt.size||11.5,nl=String(label).split('\n').length;text(x+w/2,y+h/2+size*0.36-(nl-1)*size*0.54,label,{size:size});return {x:x,y:y,w:w,h:h,cx:x+w/2,cy:y+h/2};},
      text:text,
      title:function(str,opt){text(200,24,str,{size:(opt&&opt.size)||16.5,cls:'ttl'});var hw=str.length*3.6*((opt&&opt.size)||16.5)/16.5;d.underline(200-hw,32,200+hw);},
      note:function(x,y,str,opt){return text(x,y,str,Object.assign({size:10.5,cls:'note',anchor:'start'},opt||{}));},
      star:function(x,y){add(rc.path('M'+x+' '+(y-8)+' l2.5 6 h6.5 l-5 4 l2 6.5 l-6 -4 l-6 4 l2 -6.5 l-5 -4 h6.5 z',o({fill:'#a00',fillStyle:'solid',stroke:'#a00',roughness:1})),{red:1});},
      dot:function(x,y){add(rc.circle(x,y,6,o({fill:'#000',fillStyle:'solid'})));},
      // ---- helpers ----
      flow:function(y,items,opt){opt=opt||{};var w=opt.w||84,h=opt.h||38,gap=opt.gap||26,x0=opt.x!=null?opt.x:200-(items.length*w+(items.length-1)*gap)/2,bs=[];
        items.forEach(function(it,i){var lab=typeof it==='string'?it:it.l;var b=(opt.shape==='round'?d.round:d.box)(x0+i*(w+gap),y,w,h,lab,{wash:it&&it.wash,size:opt.size||11.5,dashed:it&&it.dashed});bs.push(b);if(i)d.connect(bs[i-1],b,{dash:opt.dash});});return bs;},
      stack:function(x,y,w,h,items,opt){opt=opt||{};var gap=opt.gap||8,bs=[];items.forEach(function(it,i){var lab=typeof it==='string'?it:it.l;bs.push(d.box(x,y+i*(h+gap),w,h,lab,{wash:it&&it.wash,size:opt.size||11.5}));});return bs;},
      timeline:function(y,x1,x2,pts,opt){opt=opt||{};d.line(x1,y,x2,y);head(x2,y,0);pts.forEach(function(p){var x=x1+(x2-x1)*p.t;d.line(x,y-7,x,y+7);if(p.l)text(x,y+(p.below===false?-14:22),p.l,{size:10.5});if(p.above)text(x,y-14,p.above,{size:10.5});});},
      venn:function(x1,x2,y,r,l1,l2,lm){add(rc.circle(x1,y,r*2,o()));add(rc.circle(x2,y,r*2,o()));text(x1-r*0.35,y+4,l1,{size:12});text(x2+r*0.35,y+4,l2,{size:12});if(lm)text((x1+x2)/2,y+4,lm,{size:11});},
      grid:function(x,y,cols,rows,cw,rh,marks,opt){opt=opt||{};d.line(x,y+rh,x+cw*(cols.length+1),y+rh);d.line(x+cw,y,x+cw,y+rh*(rows.length+1));
        cols.forEach(function(c,i){text(x+cw*(i+1)+cw/2,y+rh*0.68,c,{size:11});if(i)d.line(x+cw*(i+1),y,x+cw*(i+1),y+rh*(rows.length+1),{dash:1,faint:1});});
        rows.forEach(function(r,j){text(x+6,y+rh*(j+1)+rh*0.68,r,{size:11,anchor:'start'});if(j)d.line(x,y+rh*(j+1),x+cw*(cols.length+1),y+rh*(j+1),{dash:1,faint:1});
          (marks[j]||[]).forEach(function(m,i){var mx=x+cw*(i+1)+cw/2,my=y+rh*(j+1)+rh/2;if(m===1)d.check(mx-8,my,0.85);else if(m===0)d.cross(mx-5,my-5,0.85);else if(m==='~')text(mx,my+4,'~',{size:14});else if(typeof m==='string')text(mx,my+4,m,{size:11});});});
        return {x:x,y:y,w:cw*(cols.length+1),h:rh*(rows.length+1),cw:cw,rh:rh};}
    };
    return d;
  }

  // ---------- specs ----------
  var B={};
  // ===== AI ENGINEERING =====
  B['ai-engineering/ai-agents-finance-architect']=function(d){
    d.title('An agent is a loop with controls');
    var plan=d.box(150,50,100,36,'plan  (LLM)',{wash:1}),act=d.box(150,130,100,36,'act  (tools)'),obs=d.box(150,210,100,36,'observe');
    d.connect(plan,act);d.connect(act,obs);d.route([[150,228],[70,228],[70,68],[147,68]]);
    var tools=d.cloud(266,100,130,72,'MCP · NetSuite\nBlackLine',{size:11});d.connect(act,tools);
    var mem=d.cyl(282,196,96,58,'memory +\naudit trail');d.connect(obs,mem,{dash:1});
    var g=d.box(14,124,100,36,'guardrails',{red:1});d.connect(g,act,{red:1});
    d.note(14,180,'every $ move:\na human approves',{size:10.5});d.star(128,182);
    d.note(14,290,'evals gate the production loop · SOX-controlled');
  };
  B['ai-engineering/ai-agents-hr-architect']=function(d){
    d.title('Agents over people-systems, PII first');
    var ag=d.round(140,52,120,36,'HR agent',{wash:1});
    var sys=d.flow(200,['Workday','ATS','payroll','ticketing'],{w:74,h:36,gap:14,size:11});
    d.box(40,180,320,74,'',{dashed:1});d.note(46,272,'PII boundary — redact before the model sees it');
    sys.forEach(function(b){d.connect(ag,b);});
    d.note(272,66,'→ "act" only via\napproved connectors',{size:10.5});
    d.ring(228,188,80,60);d.note(300,132,'payroll calendar\n= hard deadline',{size:10.5});d.line(300,150,268,186,{red:1});
  };
  B['ai-engineering/ai-compute-infrastructure']=function(d){
    d.title('Own the substrate everyone else runs on');
    var s=d.stack(40,50,190,34,['train · eval · serve  (the org)','vLLM · Triton · TensorRT',{l:'schedulers · k8s · slurm',wash:1},'clusters · GPUs · network'],{gap:10,size:11});
    d.arrow(32,226,32,58,{red:1});d.note(8,244,'you own\nthis stack',{size:10.5});
    var gauge=d.round(268,120,118,60,'utilisation %\n$ per GPU-hour',{size:11});d.ring(258,110,138,80);
    d.note(266,206,'observability is\nthe product',{size:10.5});
    d.route([[230,155],[262,150]]);
    d.note(40,300,'the question they ask: "why is the cluster 40% idle?"');
  };
  B['ai-engineering/ai-engineer-compliance']=function(d){
    d.title('Build the agent that calls the sanctions API');
    var ag=d.box(20,120,86,40,'agent\n(harness)',{size:11}),mcp=d.box(150,120,96,40,'MCP server',{wash:1}),api=d.flow(60,['sanctions','KYC','AML'],{x:222,w:56,h:30,gap:5,size:9.5});
    d.connect(ag,mcp);api.forEach(function(b){d.arrow(246,134,b.cx,b.y+b.h+2,{});});
    var ev=d.box(150,210,96,36,'evals',{red:1});d.connect(mcp,ev,{dash:1});d.note(258,232,'← every call\nlogged + scored',{size:10.5});
    d.note(20,190,'RAG over\nregs',{size:10.5});d.arrow(48,212,150,232,{dash:1});
    d.note(20,300,'ch 04–09: you build it · JWT + HTTP transport · RegTech');
  };
  B['ai-engineering/ai-infrastructure-swe']=function(d){
    d.title('Millions of users, and the p99 tail');
    var req=d.round(14,110,70,34,'requests'),gw=d.box(112,104,90,46,'gateway\n(Rust · tokio)',{wash:1,size:11});d.connect(req,gw);
    var w=d.stack(240,56,110,30,['inference worker','inference worker','inference worker'],{gap:10,size:10.5});w.forEach(function(b){d.connect(gw,b);});
    d.line(40,290,200,290);d.line(40,290,40,190);
    [[52,286],[64,270],[76,230],[88,205],[100,214],[112,240],[124,262],[136,276],[148,283],[160,286],[172,288],[184,289]].forEach(function(p,i,a){if(i)d.line(a[i-1][0],a[i-1][1],p[0],p[1]);});
    d.text(88,306,'p50',{size:10.5});d.text(184,306,'p99',{size:10.5});d.ring(170,270,40,34);
    d.note(214,250,'← no GC pauses\nno surprises',{size:10.5});d.note(240,190,'correctness under\nback-pressure',{size:10.5});
  };
  B['ai-engineering/build-inference-gateway-rust']=function(d){
    d.title('cargo new → a production gateway');
    var c=d.round(14,120,62,34,'client'),gw=d.box(104,72,150,150,'',{wash:1}),v=d.box(300,120,86,34,'vLLM');
    d.text(179,92,'gateway',{size:13});['streaming proxy','batching','circuit breaker','hedging','OpenTelemetry'].forEach(function(t,i){d.check(114,118+i*20,0.8);d.text(134,124+i*20,t,{size:11,anchor:'start'});});
    d.connect(c,gw);d.connect(gw,v);
    d.note(112,250,'Dockerfile, multi-stage');d.box(104,236,150,26,'',{dashed:1});
    d.note(14,290,'10 chapters · ~3 hours · one working repo at the end');
  };
  B['ai-engineering/paged-attention-deep-dive']=function(d){
    d.title('The KV cache, in pages');
    d.text(60,58,'a sequence',{size:11});['t0','t1','t2','t3'].forEach(function(t,i){d.box(14+i*32,68,26,22,t,{size:10});});d.arrow(146,79,176,79,{});
    d.box(178,54,84,50,'block\ntable',{size:11});
    d.text(330,50,'physical blocks',{size:11});var k=0;for(var r=0;r<3;r++)for(var c=0;c<4;c++){var on=[1,0,1,1,0,0,1,0,1,0,0,1][k++];d.box(286+c*26,60+r*26,22,22,'',{wash:on});}
    d.arrow(262,79,284,79,{});
    d.note(20,130,'no contiguous\nreservation\n→ no fragmentation',{size:10.5});d.ring(276,50,126,96);
    var kids=d.flow(200,['prefix\ncaching','chunked\nprefill','continuous\nbatching','disaggreg.\nserving'],{w:80,h:40,gap:12,size:10});
    d.text(200,168,'everything hangs off the same primitive',{size:11});kids.forEach(function(b){d.arrow(b.cx,b.y-2,b.cx,b.y-12,{});});
    d.note(20,290,'vLLM · why the layout looks the way it does');
  };
  // ===== DATA ENGINEERING =====
  B['data-engineering/build-contract-intelligence-pipeline']=function(d){
    d.title('Drop a PDF in a folder…');
    var f=d.flow(70,['folder\nwatcher','OCR','LLM\nextract',{l:'Postgres',wash:1},'FastAPI'],{w:64,h:40,gap:12,size:10.5});
    d.note(14,52,'PDF',{size:11});d.arrow(22,60,40,68,{});
    var ev=d.box(120,170,140,40,'eval harness',{red:1});d.note(272,182,'← scored vs\na gold set',{size:10.5});d.connect(f[3],ev,{dash:1});
    d.note(30,236,'ingest → extract → persist → expose');d.note(30,260,'working code at every step · ~3 h');
    d.ring(228,60,90,60);
  };
  B['data-engineering/contract-data-model-reference']=function(d){
    d.title('Document ≠ agreement');
    var s=d.box(20,60,90,36,'supplier'),ag=d.box(150,60,100,36,'agreement',{wash:1}),doc=d.box(150,140,100,36,'document'),ob=d.box(280,60,100,36,'obligation\n(versioned)',{size:10.5}),sp=d.box(280,140,100,36,'spend ·\ninvoices',{size:10.5});
    d.connect(s,ag);d.connect(ag,ob);d.connect(ag,sp);d.line(200,98,200,138);d.text(214,124,'1 : n',{size:10.5,anchor:'start'});
    d.ring(140,50,120,136);d.note(20,120,'entity\nresolution\n(fuzzy joins)',{size:10.5});
    d.text(200,214,'valid_from · valid_to  →  "as of" queries',{size:11});
    d.note(20,262,'+ 30 SQL patterns · schema-evolution playbooks · dbt tests');
  };
  B['data-engineering/data-analytics-interview-prep']=function(d){
    d.title('The modern stack, and where they test you');
    var f=d.flow(80,['sources','warehouse',{l:'dbt\nstg→int→marts',wash:1},'BI'],{w:80,h:44,gap:14,size:10.5});
    var orc=d.box(120,160,160,32,'orchestration',{size:11});d.connect(orc,f[1],{dash:1});d.connect(orc,f[2],{dash:1});
    d.ring(160,66,120,70);d.note(300,150,'SQL · modeling\n· tests — the\ngraded bits',{size:10.5});
    d.note(20,240,'domain: an AI compute platform (GPU-hours, usage, billing)');
  };
  B['data-engineering/data-engineering-for-neoclouds']=function(d){
    d.title('Two sides of the same cloud');
    d.line(200,48,200,300,{dash:1});d.text(104,58,'using neoclouds',{size:12});d.text(300,58,'inside a neocloud',{size:12});
    var p=d.flow(90,['provider A','provider B'],{x:22,w:70,h:30,gap:12,size:10.5});var pipe=d.box(48,150,110,34,'your pipeline',{wash:1});p.forEach(function(b){d.connect(pipe,b);});
    d.note(24,214,'training data · orchestration\nacross clouds · cost engineering',{size:10.5});
    var t=d.stack(232,80,136,28,['fleet telemetry','billing & metering','marketplace events','capacity planning'],{gap:8,size:10.5});
    d.note(232,232,'the data that makes\nthe platform work',{size:10.5});
  };
  B['data-engineering/data-systems-design']=function(d){
    d.title('Design it in six moves');
    var r1=d.flow(60,['1 require-\nments','2 estimate','3 archi-\ntecture'],{w:96,h:44,gap:22,size:12});
    var r2=[d.box(30,150,96,44,'6 wrap-up',{size:12}),d.box(148,150,96,44,'5 trade-offs',{size:12,wash:1}),d.box(266,150,96,44,'4 deep dive',{size:12})];
    d.connect(r1[2],r2[2]);d.connect(r2[2],r2[1]);d.connect(r2[1],r2[0]);
    d.ring(140,142,120,60);
    d.note(150,228,'batch vs stream');d.note(150,246,'lake vs warehouse');d.note(150,264,'build vs buy');d.arrow(196,204,196,218,{red:1});
    d.text(60,236,'"defend\nthe fork"',{size:12});d.arrow(96,232,140,232,{curve:-10,red:1});
    d.note(300,240,'estimate first →\nsizes every\nlater choice',{size:10.5});
    d.note(30,300,'60 min · whiteboard · they name CDC + ingestion');
  };
  B['data-engineering/document-ai-extraction-deep-dive']=function(d){
    d.title('"The extraction is wrong — why?"');
    var f=d.flow(58,['PDF','OCR','layout\nmodel',{l:'field\nextraction',wash:1},'schema +\nprovenance'],{w:64,h:40,gap:12,size:10});
    d.line(40,230,190,230);d.line(40,230,40,130);d.arrow(40,230,190,140,{curve:22});d.text(116,246,'confidence → accuracy',{size:10.5});d.line(120,130,120,232,{dash:1,red:1});d.note(126,140,'HITL\nthreshold',{size:10});
    d.note(220,130,'operate it:',{size:11});['drift detection','failure modes','eval methodology','HITL economics'].forEach(function(t,i){d.dot(226,152+i*18);d.text(236,156+i*18,t,{size:11,anchor:'start'});});
    d.ring(226,42,100,68);d.note(20,290,'backed by an accuracy SLA');
  };
  B['data-engineering/enterprise-integration-atlas']=function(d){
    d.title('What you meet on every deployment');
    var me=d.round(150,140,100,40,'your pipeline',{wash:1});
    var ring=[['SAP · Oracle',60,60],['Coupa · Ariba',200,52],['Ironclad · CLM',340,60],['Okta · Entra',40,150],['Snowflake · BQ',360,150],['SharePoint · Box',60,240],['Tableau · Looker',200,250],['Datadog · PD',340,240]];
    ring.forEach(function(r){var b=d.box(r[1]-44,r[2]-14,88,28,r[0],{size:10});d.connect(b,me,{faint:1});});
    d.note(262,290,'auth · API · gotchas · politics',{size:10.5});
  };
  B['data-engineering/fde-data-engineering']=function(d){
    d.title('Consultant + engineer, in one seat');
    d.venn(150,230,110,52,'consultant','engineer','FDE');
    d.note(22,70,'discovery\ncustomer politics\nscope, kill criteria',{size:10.5});d.note(290,70,'pipelines\nSQL, modeling\nSLA accuracy',{size:10.5});
    var f=d.flow(200,['messy\ncontracts','extraction','their\nwarehouse'],{w:90,h:40,gap:36,size:10.5});
    d.note(24,262,'embedded at the customer · SLA-backed accuracy · their ERP, their rules');
  };
  B['data-engineering/fde-de-playbook']=function(d){
    d.title('The first 90 days, as templates');
    d.timeline(120,40,370,[{t:0,l:'day 0'},{t:0.33,l:'30'},{t:0.66,l:'60'},{t:1,l:'90'}]);
    d.text(94,100,'discover',{size:12});d.text(203,100,'build',{size:12});d.text(312,100,'hand off',{size:12});
    ['working agreement','discovery question bank','cadence & status','runbooks','escalation playbook','handoff checklist'].forEach(function(t,i){var x=i<3?40:210,y=170+(i%3)*22;d.box(x,y-11,12,12,'');d.text(x+20,y+4,t,{size:11,anchor:'start'});});
    d.note(40,256,'kill criteria — decide early, in writing',{size:11});d.ring(30,242,230,26);
    d.note(40,292,'copy · paste · adapt per deployment');
  };
  B['data-engineering/first-data-hire-de-prep']=function(d){
    d.title('Stand up a data function from zero — alone');
    var z=d.box(20,90,90,50,'nothing\n(yet)',{dashed:1,size:11});
    var p=d.stack(150,50,110,32,['SQL','pipelines + quality',{l:'modeling judgement',wash:1}],{gap:12,size:11});
    d.arrow(112,115,148,115,{});var out=d.round(300,90,88,50,'trusted\nnumbers',{size:11});d.arrow(262,115,298,115,{});
    d.ring(140,132,130,42);d.note(150,196,'the thing that decides the role:\ngood judgement, no one to check it',{size:10.5});
    d.note(20,262,'30 / 60 / 90 · stack decisions · usage-based marketplace domain');
  };
  B['data-engineering/production-data-pipelines']=function(d){
    d.title('How far up the ladder can you climb?');
    var L=['L1  a scheduled script','L2  an orchestrated DAG','L3  idempotent + backfills','L4  late data · reconciliation','L5  self-healing platform'];
    L.forEach(function(s,i){var x=30+i*24,y=286-i*44;d.line(x,y,x+24,y);d.line(x+24,y,x+24,y-44);d.text(x+34,y-16,s,{size:11,anchor:'start'});});
    d.arrow(20,286,20,74,{red:1});d.text(16,304,'every answer levels up',{size:10.5,anchor:'start'});
    d.bubble(230,208,158,54,'"what happens\nwhen data is late?"',{tail:'left'});
    d.note(232,290,'dbt + Airflow as the worked example');
  };
  B['data-engineering/senior-data-analytics-engineer']=function(d){
    d.title('Three drill sets, one screen');
    var s=d.flow(70,['SQL\ncreation','SQL\ndebugging',{l:'pandas',wash:1}],{w:90,h:44,gap:30,size:11.5});
    d.arrow(200,122,200,150,{});var loop=d.round(120,150,160,34,'drill mode: repeat until fast',{size:10.5});
    d.route([[120,167],[70,167],[70,120]]);d.route([[280,167],[330,167],[330,120]]);
    d.text(200,222,'gpu_instances · usage_events · invoices',{size:11});d.box(60,206,280,24,'',{dashed:1});
    d.note(60,258,'founding analytics hire at a GPU compute marketplace');
  };
  // ===== DATA PLATFORM (curriculum) =====
  B['data-platform/becoming-a-data-platform-engineer/capstone-labs']=function(d){
    d.title('Build mini-GridDP, end to end');
    var f1=d.flow(60,['generator','bronze','silver / gold\n(dbt)','telemetry\nrollup'],{w:72,h:38,gap:12,size:10});
    var f2=d.flow(130,['Dagster','tests','semantic\nlayer',{l:'dashboard',wash:1}],{w:72,h:38,gap:12,size:10});
    d.route([[f1[3].cx,f1[3].y+f1[3].h],[f1[3].cx,f2[3].y-4]]);
    d.box(40,196,320,30,'CI/CD · docs · one repo',{size:11});
    d.ring(20,186,360,50);d.note(40,262,'your portfolio: "I built and operated a data platform"',{size:10.5});
  };
  B['data-platform/becoming-a-data-platform-engineer/career']=function(d){
    d.title('Skills get the interview; this gets the job');
    var f=d.flow(70,[{l:'capstone\nportfolio',wash:1},'resume','screen','loops','offer'],{w:60,h:40,gap:14,size:10});
    d.note(f[3].cx,150,'SQL · coding\nsystem design\nbehavioral',{size:10.5,anchor:'middle'});d.arrow(f[3].cx,136,f[3].cx,f[3].y+f[3].h+2,{});
    d.ring(20,60,80,60);d.note(30,160,'the strongest thing\nyou can point to',{size:10.5});
    d.timeline(230,60,340,[{t:0,l:'offer'},{t:0.5,l:'negotiate'},{t:1,l:'day 90'}]);
  };
  B['data-platform/becoming-a-data-platform-engineer/foundations']=function(d){
    d.title('Why it works, not just how');
    var s=d.stack(120,54,160,32,['SQL in depth','queries & transactions',{l:'storage & indexes',wash:1},'data structures & algos','how computers hold data'],{gap:8,size:11});
    d.arrow(100,254,100,62,{red:1});d.note(20,150,'each layer\nexplains the\none above',{size:10.5});
    d.note(292,120,'so you can\ndebug the\nweird failures',{size:10.5});d.note(120,282,'the longest course — and the one that pays off most');
  };
  B['data-platform/becoming-a-data-platform-engineer/glossary']=function(d){
    d.title('When a word is fuzzy');
    var q=d.bubble(30,60,120,44,'"CDC?"',{tail:'right',size:14});
    var def=d.box(190,56,196,52,'one-line definition\n+ where it\'s taught',{size:11,wash:1});d.arrow(152,82,188,82,{});
    d.arrow(288,110,288,150,{label:'follow the pointer',lx:296,ly:134});d.box(230,150,116,34,'Course 4 · ch 05',{size:11});
    d.note(30,150,'cheat sheets:',{size:11});['SQL','command line','the stack','common decisions'].forEach(function(t,i){d.dot(36,172+i*18);d.text(46,176+i*18,t,{size:11,anchor:'start'});});
    d.note(30,262,'⌘F on the glossary page · keep it open');
  };
  B['data-platform/becoming-a-data-platform-engineer/orientation-setup']=function(d){
    d.title('Build the bench, then run one pipeline');
    var t=d.flow(70,['terminal','git','python'],{w:80,h:34,gap:20,size:11});
    var dk=d.box(80,130,240,44,'Docker:  Postgres  ·  DuckDB',{size:11,wash:1});t.forEach(function(b){d.connect(b,dk);});
    var run=d.round(120,210,160,36,'first pipeline runs ✓',{size:11.5});d.connect(dk,run);
    d.note(20,282,'the mental model first · then you learn by doing');
  };
  B['data-platform/becoming-a-data-platform-engineer/start-here-roadmap']=function(d){
    d.title('Get the map before the territory');
    var pts=[[60,250],[130,200],[200,230],[270,160],[340,110]],names=['founda-\ntions','the DE\ncraft','tooling +\nstack','capstone\nlabs','career'];
    var bs=pts.map(function(p,i){return d.box(p[0]-36,p[1]-18,72,36,names[i],{size:10.5,wash:i===0});});
    for(var i=0;i<bs.length-1;i++)d.connect(bs[i],bs[i+1],{dash:1});
    d.ring(16,226,88,52);d.note(16,296,'you are here',{size:11});
    d.note(232,266,'8 courses · ~6 months',{size:10.5});d.note(310,70,'the job',{size:11});d.arrow(330,80,340,90,{red:1});
  };
  B['data-platform/becoming-a-data-platform-engineer/the-de-craft']=function(d){
    d.title('From "why" to "how"');
    var m=d.flow(60,['relational','dimensional','SCD / history'],{w:90,h:32,gap:16,size:10.5});d.text(200,50,'modeling',{size:10.5});
    var med=d.flow(126,['bronze','silver',{l:'gold',wash:1}],{w:80,h:32,gap:20,size:11});d.text(200,116,'medallion',{size:10.5});
    var o=d.flow(192,['ingestion · CDC','dbt','orchestrator','tests'],{w:86,h:32,gap:8,size:10});
    d.note(20,262,'every chapter grows your mini-griddp repo');
  };
  B['data-platform/becoming-a-data-platform-engineer/tooling-stack']=function(d){
    d.title('"It works on my machine" → it just works');
    var f=d.flow(70,['git','Docker\ncompose','CI/CD','IaC','monitor'],{w:62,h:38,gap:12,size:10.5});
    var cmd=d.box(120,150,160,36,'$ make up',{size:13,wash:1});d.ring(110,140,180,56);
    d.note(288,160,'← one command,\nwhole stack',{size:10.5});
    d.note(20,262,'reproducible · tested · monitored · run with other people');
  };
  B['data-platform/data-platform-systems-design']=function(d){
    d.title('A platform is layers, plus the cross-cuts');
    var s=d.stack(60,50,200,26,['apps · sources','ingestion',{l:'lakehouse storage',wash:1},'modeling · transform','serving · semantic','AI / ML'],{gap:6,size:10.5});
    var x=d.stack(290,50,96,40,['governance\n& security','quality &\nobservability','self-serve'],{gap:14,size:10});
    x.forEach(function(b){d.line(288,b.cy,262,b.cy,{dash:1});});
    d.note(60,262,'GridDP · three reference stacks compared · scale numbers');
  };
  // ===== DATA SCIENCE =====
  B['data-science/data-science-for-neoclouds']=function(d){
    d.title('Two sides of the same cloud');
    d.line(200,48,200,300,{dash:1});d.text(104,58,'using neoclouds',{size:12});d.text(300,58,'inside a neocloud',{size:12});
    var l=d.stack(30,76,140,28,['pick a provider','train · fine-tune',{l:'track experiments',wash:1},'spend-aware runs'],{gap:8,size:10.5});
    var r=d.stack(232,76,140,28,['pricing models','churn & retention','capacity forecast','ranking · anomalies'],{gap:8,size:10.5});
    d.note(30,236,'ML work on rented GPUs',{size:10.5});d.note(232,236,'models that run\nthe marketplace',{size:10.5});
  };
  B['data-science/full-stack-applied-ds']=function(d){
    d.title('Ship the model, not the notebook');
    var f=d.flow(70,['data','features',{l:'model',wash:1},'deploy','monitor'],{w:62,h:38,gap:12,size:11});
    d.route([[f[4].cx,f[4].y+f[4].h],[f[4].cx,150],[f[0].cx,150],[f[0].cx,f[0].y+f[0].h+2]]);d.text(200,164,'retrain',{size:10.5});
    d.note(30,206,'fraud · imbalanced data\ntime-series · signals',{size:10.5});d.note(240,206,'AWS stack · MLOps\ncalibration in prod',{size:10.5});
    d.ring(150,58,60,60);d.note(30,282,'staff-level: the whole loop is yours');
  };
  B['data-science/product-analytics-ds']=function(d){
    d.title('The experiment loop');
    var h=d.box(150,50,100,34,'hypothesis'),a=d.box(280,130,100,34,'assign (A/B)'),m=d.box(150,210,100,34,'measure',{wash:1}),r=d.box(20,130,100,34,'read out\n(causal)',{size:11});
    d.connect(h,a);d.connect(a,m);d.connect(m,r);d.connect(r,h);
    d.note(160,150,'power · CUPED\nguardrail metrics',{size:10.5});d.ring(10,120,120,54);
    d.note(20,282,'dashboards + SQL for product · LLM-SaaS metrics');
  };
  B['data-science/senior-ds-business-analytics-prep']=function(d){
    d.title('Flying on instruments');
    d.text(70,66,'what users type',{size:11.5});d.strike(20,62,120,62);d.note(24,84,'never logged\n— by design',{size:10.5});
    var s=d.stack(180,50,120,26,['events (counts)','subscriptions','API usage','on-chain'],{gap:8,size:10.5});
    var m=d.round(180,196,120,36,'metrics',{wash:1});d.arrow(240,186,240,194,{});
    d.note(316,60,'privacy-safe\nsignals',{size:10.5});d.arrow(314,80,304,86,{});
    d.note(316,204,'→ execs',{size:11});
    d.note(24,262,'build the stack from zero · 30-60-90 · communicate uncertainty');
  };
  B['data-science/venice-ai-company-research']=function(d){
    d.title('How Venice makes money');
    var v=d.round(140,60,120,40,'Venice.ai',{wash:1});
    var r=d.flow(140,['subscriptions','usage API','VVV / DIEM\nstaking'],{w:96,h:44,gap:16,size:10.5});r.forEach(function(b){d.connect(b,v);});
    d.box(140,208,120,30,'no logs · proxy',{size:11});d.ring(130,200,140,46);d.note(276,220,'← the moat?',{size:11});
    d.text(60,262,'bull',{size:12});d.text(340,262,'bear',{size:12});d.line(80,258,320,258);d.line(200,250,200,266);
    d.note(30,292,'~3M users · profitable · no model of its own');
  };
  // ===== DEFI =====
  B['defi-engineering/senior-defi-protocol-engineer']=function(d){
    d.title('A lending market, and where it breaks');
    var l=d.round(14,90,80,34,'lenders'),p=d.cyl(140,64,120,80,'pool',{}),b=d.round(300,90,84,34,'borrowers');
    d.arrow(96,100,138,100,{label:'deposit',ly:96});d.arrow(262,100,298,100,{label:'borrow',ly:96});
    d.arrow(300,122,262,122,{label:'collateral',ly:146,dash:1});
    var o=d.box(150,180,100,32,'oracle price',{size:11});d.arrow(200,146,200,178,{});
    d.text(200,246,'health factor < 1  →  liquidate',{size:12});d.ring(112,231,180,30);
    d.note(20,290,'Solidity at TVL scale · minimal codebase · audit cycles');
  };
  B['defi-engineering/senior-smart-contract-engineer']=function(d){
    d.title('x · y = k');
    d.line(50,250,220,250);d.line(50,250,50,80);[[60,90],[70,150],[90,190],[120,214],[160,230],[210,242]].forEach(function(p,i,a){if(i)d.line(a[i-1][0],a[i-1][1],p[0],p[1]);});
    d.dot(90,190);d.dot(120,214);d.arrow(90,190,118,212,{curve:-14,red:1});d.note(96,180,'swap',{size:11});
    d.line(70,150,70,250,{dash:1,faint:1});d.line(120,214,120,250,{dash:1,faint:1});d.text(95,264,'concentrated range',{size:10.5});
    d.note(250,90,'hooks · singleton\nperipheral logic',{size:10.5});d.note(250,150,'gas: every SLOAD\nis a decision',{size:10.5});d.note(250,210,'mainnet discipline:\nno second deploy',{size:10.5});
    d.note(40,292,'AMMs & DEXes at multi-billion TVL');
  };
  B['defi-engineering/smart-contract-security-engineer']=function(d){
    d.title('Own the whole security lifecycle');
    var f=d.flow(70,['threat\nmodel','formal\nverify','review',{l:'war room',wash:1},'ship'],{w:62,h:40,gap:12,size:10.5});
    d.note(110,130,'Certora · Halmos',{size:10.5});d.line(112,120,f[1].cx,f[1].y+f[1].h+2,{faint:1});
    d.ring(f[3].x-8,f[3].y-8,f[3].w+16,f[3].h+16);d.note(250,140,'bounty triage\n→ incident',{size:10.5});
    d.route([[f[4].cx,f[4].y+f[4].h],[f[4].cx,190],[f[0].cx,190],[f[0].cx,f[0].y+f[0].h+2]]);d.text(200,204,'attack-vector research feeds the next cycle',{size:10.5});
    d.note(30,262,'ship safer Solidity, faster');
  };
  // ===== NEOCLOUD =====
  B['neocloud/compute-futures-marketplaces']=function(d){
    d.title('Buying a GPU-hour before it exists');
    d.timeline(220,40,360,[{t:0.1,l:'today'},{t:0.8,l:'delivery'}]);
    var c=d.box(150,146,100,44,'contract:\n1k H100-hrs',{size:11,wash:1});d.arrow(100,168,148,168,{label:'buyer',ly:162});d.arrow(300,168,252,168,{label:'seller',ly:162});
    var ex=d.box(150,60,100,36,'exchange');d.arrow(200,98,200,144,{dash:1,label:'clears',lx:220,ly:126});
    d.note(30,70,'CME + Silicon Data\nICE + Ornn',{size:10.5});d.note(290,70,'spot (now) vs\nforward (fixed)',{size:10.5});
    d.note(40,292,'why: hedge price · fund capacity · lend against it');
  };
  B['neocloud/coreweave']=function(d){
    d.title('From mining rigs to platinum tier');
    d.timeline(90,40,360,[{t:0,l:'crypto\nmining'},{t:0.4,l:'AI pivot'},{t:0.8,l:'2025 IPO'}]);
    var ms=d.box(40,160,120,40,'Microsoft',{}),me=d.box(240,160,120,40,'Meta',{});var cw=d.round(140,230,120,36,'CoreWeave',{wash:1});d.connect(ms,cw);d.connect(me,cw);
    d.text(200,150,'~$35B+ committed',{size:12});d.ring(110,138,180,26);
    d.note(316,240,'NVIDIA\nstrategic\npartner',{size:10.5});d.star(302,236);d.note(40,292,'the only top-tier ClusterMAX 2.0 cloud');
  };
  B['neocloud/crusoe']=function(d){
    d.title('Stranded energy → AI compute');
    var f=d.flow(90,['flare gas','power',{l:'datacenter',wash:1},'GPUs'],{w:74,h:38,gap:16,size:11});
    d.note(40,150,'was: mine Bitcoin',{size:10.5});d.strike(40,146,140,146);d.note(40,170,'now: all-in on AI',{size:10.5});
    d.note(220,150,'Stargate: OpenAI /\nOracle connection',{size:10.5});
    d.ring(20,80,100,58);d.note(30,222,'the thesis: cheapest power wins',{size:11});
  };
  B['neocloud/hyperbolic']=function(d){
    d.title('Two products, one thesis: open access');
    var a=d.box(40,80,140,50,'GPU marketplace',{size:11.5}),b=d.box(220,80,140,50,'managed inference',{size:11.5,wash:1});
    var g=d.cyl(140,170,120,60,'GPU supply',{});d.connect(g,a);d.connect(g,b);
    d.note(40,254,'Series A · PhD founders · smaller, newer, cheaper to try');
  };
  B['neocloud/lambda']=function(d){
    d.title('Hardware shop first, cloud second');
    d.timeline(110,40,360,[{t:0,l:'2012\nworkstations'},{t:0.45,l:'Lambda Cloud'},{t:0.9,l:'neocloud\nexpansion'}]);
    var w=d.box(40,180,110,40,'GPU boxes\nyou buy',{size:10.5}),c=d.box(250,180,110,40,'GPUs you\nrent',{size:10.5,wash:1});d.connect(w,c);
    d.note(40,262,'enterprise + research customers, long before the boom');
  };
  B['neocloud/nebius']=function(d){
    d.title('Yandex → Amsterdam → NASDAQ');
    var f=d.flow(80,['Yandex','spin-off',{l:'NBIS',wash:1}],{w:90,h:40,gap:30,size:12});
    d.note(40,150,'gold tier · ClusterMAX 2.0',{size:10.5});
    var ms=d.box(60,190,110,34,'Microsoft'),me=d.box(230,190,110,34,'Meta');d.text(200,274,'multi-year commitments',{size:11});d.line(115,226,180,254);d.line(285,226,220,254);
  };
  B['neocloud/neocloud-comparison']=function(d){
    d.title('Nine companies, one grid');
    var g=d.grid(24,52,['model','scale','pricing','tier'],['CoreWeave','Nebius','Lambda','Vast','RunPod'],70,34,[['dedicated','$$$','contract','Pt'],['dedicated','$$','contract','Au'],['cloud','$$','list','Ag'],['market','$','bid','—'],['hybrid','$','list','—']]);
    d.note(30,270,'+ investment thesis matrix',{size:10.5});
  };
  B['neocloud/neocloud-history-future']=function(d){
    d.title('Where the category came from');
    d.timeline(200,30,370,[{t:0.02,l:'2010s\nGPU cloud'},{t:0.36,l:'2022–23\ninflection'},{t:0.6,l:'2024\nshake-out'},{t:0.86,l:'2025–26\nenterprise'}]);
    [[36,170],[100,168],[150,140],[190,90],[230,120],[270,100],[320,70],[360,60]].forEach(function(p,i,a){if(i)d.line(a[i-1][0],a[i-1][1],p[0],p[1]);});
    d.note(300,44,'?',{size:16});d.ring(228,80,60,50);d.note(20,292,'the context every other neocloud guide builds on');
  };
  B['neocloud/runpod']=function(d){
    d.title('Peer marketplace + dedicated, under one roof');
    var a=d.box(40,80,140,50,'Community Cloud\n(peer hosts)',{size:11}),b=d.box(220,80,140,50,'Secure Cloud\n(dedicated)',{size:11,wash:1});
    var r=d.round(140,180,120,36,'RunPod',{});d.connect(a,r);d.connect(b,r);
    d.note(40,150,'↔ vs Vast.AI',{size:10.5});d.note(250,150,'↔ enterprise',{size:10.5});
    d.note(40,262,'the most direct Vast competitor that also sells to enterprises');
  };
  B['neocloud/tensordock']=function(d){
    d.title('A smaller, curated Vast');
    var h=d.round(14,100,90,36,'hosts'),m=d.box(140,80,120,76,'marketplace\n(curated supply)',{size:11,wash:1}),r=d.round(296,100,90,36,'renters');
    d.connect(h,m);d.connect(m,r);d.ring(130,70,140,96);
    d.note(30,200,'founded by a teenager · bootstrapped · recent funding',{size:10.5});
    d.note(30,262,'same shape as Vast, different bet on supply quality');
  };
  B['neocloud/together-ai']=function(d){
    d.title('Research credibility, inference economics');
    var r=d.box(40,60,130,44,'FlashAttention\nRedPajama',{size:11}),p=d.box(230,60,130,44,'inference +\ntraining API',{size:11,wash:1});d.connect(r,p);
    d.text(200,50,'research → product',{size:10.5});
    var g=d.cyl(140,150,120,60,'rented GPUs',{});d.connect(g,p);
    d.note(40,240,'per-token pricing on open-source models',{size:11});d.ring(30,226,230,28);
  };
  B['neocloud/vast-ai']=function(d){
    d.title('The world is full of idle GPUs');
    var s=d.round(14,110,90,36,'hosts\n(idle GPUs)',{size:10.5}),mk=d.box(140,84,120,86,'marketplace\nbid / ask',{size:11.5,wash:1}),b=d.round(296,110,90,36,'renters');
    d.connect(s,mk);d.connect(mk,b);d.arrow(296,140,262,150,{dash:1,label:'bids',lx:290,ly:160});
    d.note(30,200,'trust · verification\n· networking tiers',{size:10.5});d.note(240,200,'unit economics:\ntake rate × volume',{size:10.5});
    d.note(30,262,'founded 2016 · the original marketplace');
  };
  // ===== PRODUCT MANAGEMENT =====
  B['product-management/choosing-a-kyc-vendor']=function(d){
    d.title('Score them the same way, then pilot');
    var g=d.grid(30,50,['vendor A','vendor B','vendor C'],['coverage','cost','latency','pass rate','compliance'],84,38,[[1,1,0],[0,1,1],[1,0,1],[1,1,0],[1,0,0]]);
    d.ring(30+g.cw*2-4,50-4,g.cw+8,g.h+8);
    d.note(300,290,'→ 2-week pilot',{size:12});
  };
  B['product-management/payments-rails-atlas']=function(d){
    d.title('Which rail, where?');
    var r=[['UPI · IMPS\nIndia',60,80],['PIX\nBrazil',60,160],['SEPA Instant\nEurope',200,80],['FedNow · ACH\nUS',200,160],['card schemes\nglobal',340,80],['on / off-ramps\ncrypto',340,160]];
    r.forEach(function(x){d.box(x[1]-56,x[2]-20,112,40,x[0],{size:10.5,wash:x[0].indexOf('PIX')===0});});
    d.text(200,232,'decision tree: speed · cost · reach · licence',{size:11});d.box(40,216,320,26,'',{dashed:1});
    d.note(40,272,'the canonical lookup — other guides link here');
  };
  B['product-management/senior-pm-payments']=function(d){
    d.title('Conversion is the metric');
    var f=d.flow(70,['checkout','rail choice','partner\norchestration','fraud check',{l:'paid ✓',wash:1}],{w:64,h:40,gap:12,size:10});
    d.note(60,130,'UPI · PIX · SEPA Inst · local cards · Open Banking',{size:10.5});
    d.line(60,230,340,230);d.line(60,230,60,150);[[60,160],[130,170],[200,185],[270,210],[340,222]].forEach(function(p,i,a){if(i)d.line(a[i-1][0],a[i-1][1],p[0],p[1]);});
    d.text(200,250,'drop-off per step  →  fix the biggest one',{size:11});d.ring(240,190,120,50);
    d.note(40,292,'emerging markets: every rail has its own failure mode');
  };
  B['product-management/senior-pm-platform']=function(d){
    d.title('Onboarding: velocity vs compliance');
    var f=d.flow(70,['sign up','IDV / KYC','risk check',{l:'approved',wash:1}],{w:74,h:38,gap:14,size:11});
    d.stack(40,130,90,26,['consumer','business','institutional'],{gap:6,size:10.5});d.note(140,150,'← same platform,\nthree bars to clear',{size:10.5});
    d.line(200,236,200,286);d.line(120,286,280,286);d.line(120,286,120,278);d.line(280,286,280,278);d.text(120,266,'faster',{size:11});d.text(280,266,'safer',{size:11});d.ring(190,228,20,20);
  };




  B['data-platform/ml-data-architecture']=function(d){
    d.title('Two paths, one loop');
    d.text(110,52,'offline',{size:11});d.text(300,52,'online',{size:11});d.line(200,44,200,270,{dash:1,faint:1});
    var raw=d.cyl(20,62,70,50,'raw data',{}),tr=d.box(110,70,80,36,'training\nset',{size:10.5,wash:1}),fs=d.box(110,140,80,36,'feature\nstore',{size:10.5});
    d.connect(raw,tr);d.arrow(60,112,60,150,{});var lab=d.round(20,150,74,32,'labels',{size:11});d.connect(lab,tr,{faint:1});d.connect(lab,fs,{faint:1});
    var mdl=d.box(110,210,80,36,'model',{size:11});d.connect(tr,mdl,{});d.text(140,262,'train',{size:10.5});
    var os=d.box(250,140,80,36,'online\nstore',{size:10.5,wash:1});d.connect(fs,os,{label:'same\nfeatures',lx:220,ly:130});
    var sv=d.box(250,210,80,36,'serving',{size:11});d.connect(os,sv);d.connect(mdl,sv,{dash:1});
    var req=d.round(330,70,60,32,'request',{size:10.5});d.arrow(360,102,300,138,{});d.arrow(300,228,330,228,{});d.text(366,232,'score',{size:10.5});
    d.ring(200,130,140,60);d.note(340,190,'skew\nlives here',{size:10});
    d.route([[360,246],[360,290],[56,290],[56,116]],{dash:1});d.text(200,304,'outcomes → new labels → the next training set',{size:10.5});
  };
  B['data-platform/ml-data-architecture-interview-prep']=function(d){
    d.title('Five moves for any ML data question');
    var m=d.flow(66,['1 signal &\nrequirements','2 sources\n& labels','3 offline\npath'],{w:96,h:44,gap:22,size:11});
    var m2=[d.box(148,150,96,44,'5 operate',{size:11}),d.box(266,150,96,44,'4 online\npath',{size:11,wash:1})];
    d.connect(m[2],m2[1]);d.connect(m2[1],m2[0]);
    d.ring(256,140,116,64);d.note(158,232,'skew · latency\n· freshness',{size:10});d.arrow(238,226,278,208,{red:1});
    d.note(24,210,'estimate first:\nQPS · features\n· freshness · $',{size:10});
    d.bubble(236,220,150,52,'"how would you know\nit\'s wrong in prod?"',{tail:'left',size:10.5});
    d.note(30,300,'45–60 min · whiteboard · defend the fork');
  };

  // ===== CLAUDE SKILLS (collection hubs) =====
  B['claude-skills/data-engineering-skills']=function(d){
    d.title('One operator per technology');
    var lake=d.flow(70,['Iceberg','Paimon','Lance'],{x:30,w:70,h:32,gap:10,size:11});d.text(140,56,'table formats',{size:10.5});
    var str=d.flow(130,['Flink','Fluss','Iggy'],{x:30,w:70,h:32,gap:10,size:11});d.text(140,116,'streaming',{size:10.5});
    var oth=d.flow(190,['Firn','Compose'],{x:30,w:70,h:32,gap:10,size:11});d.text(110,176,'search · local',{size:10.5});
    var sk=d.box(290,96,96,60,'SKILL.md\ninspect → act\n→ verify',{size:10.5,wash:1});d.ring(280,86,116,80);
    d.route([[270,86],[281,100]],{faint:1});d.note(292,180,'each one is an\noperating guide,\nnot an article',{size:10});
    d.note(30,262,'drop a folder into ~/.claude/skills/ — no plugin needed');
  };
  B['claude-skills/dbt-agent-skills']=function(d){
    d.title('The agent learns dbt the dbt Labs way');
    var c=d.box(150,52,100,40,'"add a unit test"',{size:10.5});var cc=d.box(150,120,100,40,'Claude Code',{wash:1});d.connect(c,cc);
    var s=d.flow(200,['models\n+ tests','semantic\nlayer','Mesh','platform\nops'],{w:72,h:40,gap:10,size:10});s.forEach(function(b){d.connect(cc,b,{faint:1});});
    d.note(272,60,'/plugin install\ndbt@dbt-agent-\nmarketplace',{size:10});d.ring(262,44,124,58);
    d.note(20,130,'migrations:\ninstall once,\nthen remove',{size:10});
    d.note(60,300,'not slash commands — it picks the skill from your prompt');
  };
  B['claude-skills/astronomer-agents']=function(d){
    d.title('Skills + an MCP server + af');
    var cc=d.box(20,120,90,40,'Claude Code',{wash:1});
    var mcp=d.box(160,60,100,40,'Airflow MCP',{size:11.5}),sk=d.box(160,120,100,40,'34 skills',{size:11.5}),af=d.box(160,180,100,40,'af CLI',{size:11.5});
    d.connect(cc,mcp);d.connect(cc,sk);d.connect(cc,af);
    var air=d.cyl(300,90,90,70,'Airflow\n2.x · 3.x',{});d.connect(mcp,air);d.connect(af,air);
    var wh=d.cyl(300,190,90,60,'warehouse',{});d.arrow(260,200,298,214,{faint:1});d.note(200,240,'analyzing-data\n(Jupyter kernel)',{size:10,anchor:'middle'});
    d.ring(150,110,120,60);d.note(22,190,'author · test\ndebug · deploy\nlineage · migrate',{size:10});
    d.note(20,300,'works with open-source Airflow — set AIRFLOW_API_URL');
  };

  // ===== TOPIC: CLAUDE SKILLS =====
  B['claude-skills']=function(d){
    d.title('A skill loads when the prompt matches');
    var pr=d.bubble(14,56,118,44,'"add a unit test\nto this model"',{tail:'right',size:11});
    var cc=d.box(160,58,96,40,'Claude Code',{wash:1});d.arrow(134,78,158,78,{});
    var fm=d.box(290,52,96,52,'frontmatter\nname · description',{size:10.5});d.connect(cc,fm,{});
    d.ring(280,44,116,68);d.note(328,126,'always loaded —\nsays when to use it',{size:10,anchor:'end'});
    var body=d.box(290,156,96,44,'SKILL.md body\n+ scripts',{size:10.5,wash:1});d.arrow(338,106,338,154,{label:'loaded\non match',lx:374,ly:136});
    d.route([[290,178],[208,178],[208,100]]);
    var tools=d.flow(236,['dbt','Airflow','Iceberg'],{x:150,w:64,h:32,gap:12,size:11});tools.forEach(function(b){d.arrow(208,100,b.cx,b.y-2,{faint:1});});
    d.text(60,144,'/add-unit-test',{size:11});d.strike(20,140,102,140);d.note(18,164,'not a slash command —\njust say what you need',{size:10});
    d.note(150,300,'~/.claude/skills/  ·  .claude/skills/  ·  plugin marketplaces');
  };

  function draw(svg,guidePath){
    var spec=B[guidePath];if(!spec)return false;
    var rc=rough.svg(svg),seed=hash(guidePath)%10000+1,d=makeDSL(svg,rc,seed);
    spec(d);
    svg.querySelectorAll('path').forEach(function(p){
      if(p.getAttribute('data-wash')){p.style.fill='var(--secondary)';p.style.fillOpacity=.22;p.style.stroke='none';return;}
      var filled=p.getAttribute('fill')&&p.getAttribute('fill')!=='none';
      if(p.getAttribute('data-red')){if(filled){p.style.fill='var(--accent)';p.style.stroke='none';}else{p.style.stroke='var(--accent)';p.style.fill='none';}return;}
      if(p.getAttribute('data-faint')){p.style.stroke='var(--text-faint)';p.style.fill='none';return;}
      if(filled){p.style.fill='var(--text)';p.style.stroke='none';return;}
      p.style.stroke='var(--text)';p.style.fill='none';
    });
    return true;
  }
  window.BOARD={draw:draw,specs:B};
})();
