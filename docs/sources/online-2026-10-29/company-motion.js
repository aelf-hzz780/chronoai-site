/* Home v5 — A1–A12 per 《首页重做规格 v5》; Unicorn Studio background kept running (Rona, 2026-10-15). */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mob = function(){ return matchMedia('(max-width:1023px)').matches; };
  var root = document.documentElement;
  root.classList.add('js5'); if(document.querySelector('.usWrap')) document.body.classList.add('home');
  var hdr=document.querySelector('header'); var solid=function(){ if(hdr) hdr.classList.toggle('solid', scrollY>40); }; addEventListener('scroll',solid,{passive:true}); solid();

  /* Unicorn Studio scene (original chrono-ai.fun hero) */
  if(!reduce){ var go=function(){ try{ UnicornStudio.init(); }catch(e){} }; if(window.UnicornStudio) go(); else addEventListener('load', go); }

  /* A1: hero entrance; A3/A5/A7/A8/A9: one-shot reveals at 75% viewport */
  function reveal(el){ el.classList.add('in'); }
  var hero=[].slice.call(document.querySelectorAll('.s1 .rv, .s1 .rvf'));
  requestAnimationFrame(function(){ hero.forEach(reveal); });
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target);
      if(e.target.classList.contains('s3fig')) setTimeout(drawLines, reduce?0:(mob()?400:700));
      if(e.target.classList.contains('frames')) e.target.classList.add('in'); } }); },{rootMargin:'0px 0px -25% 0px'});
  [].slice.call(document.querySelectorAll('.h5:not(.s1) .rv, .frames')).forEach(function(el){ io.observe(el); });

  /* A6: connection line reveals from API to AI agent, once */
  function drawLines(){
    [].slice.call(document.querySelectorAll('.s3fig .lit')).forEach(function(p,i){
      var L=p.getTotalLength(); p.style.opacity=1; p.style.strokeDasharray=L; p.style.strokeDashoffset=L;
      p.getBoundingClientRect();
      p.style.transition=reduce?'none':'stroke-dashoffset '+(mob()?250:400)+'ms ease-in-out '+(i*(mob()?250:400))+'ms';
      p.style.strokeDashoffset=0;
    });
  }

  /* A4: decorative line parallax in s2 (desktop only) */
  var line=document.querySelector('.s2line'), s2=document.querySelector('.s2');
  function par(){
    if(!line) return;
    if(reduce||mob()){ line.style.transform='translateY(0)'; return; }
    var r=s2.getBoundingClientRect(), vh=innerHeight, p=Math.max(0,Math.min(1,(vh-r.top)/vh));
    line.style.transform='translateY('+(24-48*p).toFixed(1)+'px)';
  }
  addEventListener('scroll',par,{passive:true}); par();

  /* A11: hero light field follows pointer (desktop, fine pointer) */
  var bg=document.querySelector('.usPar'), s1=document.querySelector('.s1');
  if(bg && !reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
    s1.addEventListener('pointermove',function(e){ if(mob()) return; var r=s1.getBoundingClientRect(); var nx=(e.clientX-r.left)/r.width*2-1, ny=(e.clientY-r.top)/r.height*2-1;
      bg.style.transition='transform 180ms ease-out'; bg.style.transform='translate('+(nx*8).toFixed(1)+'px,'+(ny*8).toFixed(1)+'px)'; });
    s1.addEventListener('pointerleave',function(){ bg.style.transition='transform 300ms ease-out'; bg.style.transform='translate(0,0)'; });
  }

  /* A12: Our work → #our-work, eased scroll, focus target heading */
  var ow=document.getElementById('ourwork');
  if(ow) ow.addEventListener('click',function(e){
    var t=document.getElementById('our-work'); if(!t) return; e.preventDefault();
    var head=(document.querySelector('header')||{}).offsetHeight||72, y0=scrollY, y1=t.getBoundingClientRect().top+scrollY-head-24, d=Math.abs(y1-y0);
    var dur=reduce?0:Math.max(200,Math.min(mob()?400:600,d*0.4)), t0=null, stop=false;
    var cancel=function(){ stop=true; }; addEventListener('wheel',cancel,{once:true,passive:true}); addEventListener('touchstart',cancel,{once:true,passive:true});
    var ease=function(x){ return 1-Math.pow(1-x,3); };
    function step(ts){ if(stop) return; if(!t0) t0=ts; var k=dur?Math.min(1,(ts-t0)/dur):1; scrollTo(0,y0+(y1-y0)*ease(k)); if(k<1) requestAnimationFrame(step); else { history.replaceState(null,'','#our-work'); var h=t.querySelector('h2'); if(h) h.focus({preventScroll:true}); } }
    requestAnimationFrame(step);
  });

  /* v6: progressive steps (H3 lines, H6/C5 four steps, C6 dates) — trigger as each item centre passes 60–70% of the viewport */
  var prog=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); prog.unobserve(e.target); } }); },{rootMargin:'0px 0px -35% 0px'});
  [].slice.call(document.querySelectorAll('.st4,.dt,.wline,.cat,.crow,.kind,.qc,.qa')).forEach(function(el){ prog.observe(el); });
  /* why-now: scroll progress drives the story */
  var why=document.querySelector('.why2');
  if(why){
    var ww=[].slice.call(why.querySelectorAll('.ww')), wt=[].slice.call(why.querySelectorAll('.wt'));
    var whyTick=function(){
      if(reduce||mob()){ ww.forEach(function(w){w.classList.add('on');}); wt.forEach(function(w){w.classList.add('on');}); return; }
      var r=why.getBoundingClientRect(), span=r.height-innerHeight, p=Math.max(0,Math.min(1,-r.top/span));
      why.style.setProperty('--wp',p.toFixed(3));
      var i=Math.min(2,Math.floor(p*3.0001));
      ww.forEach(function(w,k){ w.classList.toggle('on',k===i); w.classList.toggle('done',k<i); });
      wt.forEach(function(w,k){ w.classList.toggle('on',k===i); });
    };
    addEventListener('scroll',whyTick,{passive:true}); addEventListener('resize',whyTick); whyTick();
  }
  /* bento: cursor spotlight + gentle tilt */
  if(!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
    [].slice.call(document.querySelectorAll('.bx')).forEach(function(c){
      c.addEventListener('pointermove',function(e){ var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
        c.style.setProperty('--mx',(x*100).toFixed(1)+'%'); c.style.setProperty('--my',(y*100).toFixed(1)+'%');
        c.style.setProperty('--ry',((x-.5)*6).toFixed(2)+'deg'); c.style.setProperty('--rx',((.5-y)*6).toFixed(2)+'deg'); });
      c.addEventListener('pointerleave',function(){ c.style.setProperty('--rx','0deg'); c.style.setProperty('--ry','0deg'); });
    });
  }
  /* looping backgrounds: pause / resume */
  [].slice.call(document.querySelectorAll('.pause5')).forEach(function(b){
    var sec=b.closest('section'); var bg=sec&&sec.querySelector('.inviteBg,.netBg');
    if(!bg||reduce){ b.hidden=true; return; }
    b.addEventListener('click',function(){ var p=bg.classList.toggle('paused'); b.textContent=p?'Resume animation':'Pause animation'; b.setAttribute('aria-pressed',String(p)); });
  });
})();
