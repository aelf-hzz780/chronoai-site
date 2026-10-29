(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMob = function(){ return matchMedia('(max-width:767px)').matches; };
  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }

  /* focus main heading on page entry */
  var h1=document.querySelector('main h1'); if(h1){ h1.setAttribute('tabindex','-1'); try{ h1.focus({preventScroll:true}); }catch(e){} }

  /* desktop dropdowns */
  var dds=[].slice.call(document.querySelectorAll('.dd'));
  function closeAll(){ dds.forEach(function(x){ x.classList.remove('open'); x.querySelector('button').setAttribute('aria-expanded','false'); }); }
  dds.forEach(function(dd){ var bt=dd.querySelector('button');
    bt.addEventListener('click',function(e){ var o=!dd.classList.contains('open'); closeAll(); if(o){ dd.classList.add('open'); bt.setAttribute('aria-expanded','true'); } e.stopPropagation(); }); });
  document.addEventListener('click',closeAll);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeAll(); if(drawer&&drawer.classList.contains('open')) toggleDrawer(); } });

  /* mobile drawer */
  var burger=document.getElementById('burger'), drawer=document.getElementById('drawer');
  var M='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  var X='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function toggleDrawer(){ var o=drawer.classList.toggle('open'); burger.setAttribute('aria-expanded',o); burger.setAttribute('aria-label',o?'Close menu':'Open menu'); burger.innerHTML=o?X:M; document.body.style.overflow=o?'hidden':''; if(!o) burger.focus(); }
  if(burger){ burger.innerHTML=M; burger.addEventListener('click',toggleDrawer); }
  [].slice.call(document.querySelectorAll('.dgrp>button')).forEach(function(b){ b.addEventListener('click',function(){ var g=b.parentElement, o=g.classList.toggle('open'); b.setAttribute('aria-expanded',o); }); });

  /* ---------- connection-flow diagrams ---------- */
  var paused = store('cai-anim')==='paused';
  var dias=[];
  function Dia(svg, seq, onceOnMobile){
    var dot=svg.querySelector('.dot'), lits={}, paths={};
    [].slice.call(svg.querySelectorAll('[data-p]')).forEach(function(p){ paths[p.dataset.p]=p; });
    [].slice.call(svg.querySelectorAll('.lit')).forEach(function(l){ lits[l.dataset.l]=l; });
    var total=seq.reduce(function(a,s){return a+s[3];},0), t0=0, raf=0, run=false, vis=false, once=false;
    function staticView(){ dot.setAttribute('opacity','0'); Object.keys(lits).forEach(function(k){ lits[k].style.opacity=.55; }); }
    function frame(ts){
      if(!run) return;
      if(!t0) t0=ts;
      var el=ts-t0;
      if(once && el>=total){ stop(); staticView(); return; }
      var t=el%total, acc=0, cur=seq[0], f=0;
      for(var i=0;i<seq.length;i++){ if(t<acc+seq[i][3]){ cur=seq[i]; f=(t-acc)/seq[i][3]; break; } acc+=seq[i][3]; }
      var p=paths[cur[0]], L=p.getTotalLength(), e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
      var pos=cur[1]+(cur[2]-cur[1])*e, pt=p.getPointAtLength(L*pos);
      dot.setAttribute('cx',pt.x); dot.setAttribute('cy',pt.y); dot.setAttribute('opacity','1');
      Object.keys(lits).forEach(function(k){ lits[k].style.opacity = (k===cur[0]) ? .95 : .12; });
      raf=requestAnimationFrame(frame);
    }
    function start(isOnce){ if(run||reduce||document.hidden) return; once=!!isOnce; run=true; t0=0; raf=requestAnimationFrame(frame); }
    function stop(){ run=false; cancelAnimationFrame(raf); }
    staticView();
    new IntersectionObserver(function(es){ vis=es[0].isIntersecting; if(!vis) stop(); else if(!paused && !isMob()) start(false); },{threshold:.1}).observe(svg);
    document.addEventListener('visibilitychange',function(){ if(document.hidden) stop(); else if(vis&&!paused&&!isMob()) start(false); });
    return {svg:svg, start:start, stop:function(){ stop(); staticView(); }, running:function(){ return run; }};
  }
  [].slice.call(document.querySelectorAll('svg[data-seq]')).forEach(function(svg){ dias.push(Dia(svg, JSON.parse(svg.dataset.seq))); });
  var pb=document.querySelector('.playbtn');
  function label(){ if(!pb) return; pb.textContent = isMob() ? 'Play animation' : (paused?'Play animation':'Pause animation'); pb.setAttribute('aria-pressed', String(!paused && !isMob())); }
  if(pb){
    label();
    pb.addEventListener('click',function(){
      if(isMob()){ dias.forEach(function(d){ if(!d.svg.getClientRects().length) return; d.stop(); d.start(true); }); return; }
      paused=!paused; store('cai-anim', paused?'paused':'play'); label();
      dias.forEach(function(d){ if(paused) d.stop(); else if(d.svg.getClientRects().length) d.start(false); });
    });
  }
})();

/* ---------- Research network flow (规格 v4.1 第09段): 24 s loop, desktop ≥1024 px only ---------- */
(function(){
  var svg=document.querySelector('svg[data-net]'); if(!svg) return;
  var btn=document.querySelector('.netbtn');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide=function(){ return matchMedia('(min-width:1024px)').matches; };
  var g1=[].slice.call(svg.querySelectorAll('.nf[data-g="1"]')), g2=[].slice.call(svg.querySelectorAll('.nf[data-g="2"]'));
  var all=g1.concat(g2);
  all.forEach(function(l){ var L=Math.hypot(l.x2.baseVal.value-l.x1.baseVal.value, l.y2.baseVal.value-l.y1.baseVal.value); l._L=L; l.style.strokeDasharray='14 '+(L+40); });
  var T=24000, t=0, last=0, run=false, raf=0, userPaused=false, vis=false;
  function ease(x){ return .5-.5*Math.cos(Math.PI*2*Math.max(0,Math.min(1,x))); } /* 0→1→0 */
  function draw(){
    var a=ease(t/8000), b=ease((t-8000)/8000);
    if(t>=16000){ a=0; b=0; }
    var phase=(t%4000)/4000;
    all.forEach(function(l){ l.style.strokeDashoffset = String(-(phase*(l._L+54))+14); });
    g1.forEach(function(l){ l.style.opacity=a; }); g2.forEach(function(l){ l.style.opacity=b; });
  }
  function tick(ts){ if(!run) return; var dt=Math.min(64,ts-(last||ts)); last=ts; t=(t+dt)%T; draw(); raf=requestAnimationFrame(tick); }
  function start(){ if(run||reduce||userPaused||!vis||document.hidden||!wide()) return; run=true; last=0; raf=requestAnimationFrame(tick); }
  function stop(){ run=false; cancelAnimationFrame(raf); }
  draw();
  new IntersectionObserver(function(es){ vis=es[0].isIntersecting; vis?start():stop(); },{threshold:.5}).observe(svg);
  document.addEventListener('visibilitychange',function(){ document.hidden?stop():start(); });
  if(btn) btn.addEventListener('click',function(){ userPaused=!userPaused; btn.textContent=userPaused?'Play animation':'Pause animation'; btn.setAttribute('aria-pressed',String(userPaused)); userPaused?stop():start(); });
})();
