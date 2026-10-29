/* Research page (v6.2): living proof-network hero + record pipeline. Abstract only — it does not depict a specific proof. */
(function(){
  var lifecycle=new AbortController(), signal=lifecycle.signal, motion=matchMedia('(prefers-reduced-motion: reduce)');
  var reduce=motion.matches, suspended=false, zh=document.documentElement.lang==='zh-CN', syncs=[], cleanup=[];
  function listen(target,type,callback,options){target.addEventListener(type,callback,Object.assign({},options,{signal:signal}));}

  /* ---------- hero canvas: drifting nodes, links, pulses travelling along links ---------- */
  var cv = document.querySelector('.rx-canvas'), btn = document.querySelector('.rx-pause');
  if(cv){
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1);
    if(!ctx){if(btn)btn.hidden=true;console.warn('[chrono-research trace=canvas-unavailable] Decorative background unavailable; content retained.');}
    else {
    var N = [], P = [], mouse = {x:-1e4, y:-1e4}, run = false, raf = 0, vis = true, user = false, LINK = 150;
    function size(){
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.round(Math.min(150, Math.max(60, W * H / 9000)));
      LINK = W < 768 ? 120 : 170;
      while(N.length < want) N.push({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35, r:Math.random()<.12?2.6:1.5, ph:Math.random()*6.28});
      N.length = want; P.length=0;
    }
    function links(){
      var out = [];
      for(var i=0;i<N.length;i++) for(var j=i+1;j<N.length;j++){
        var dx=N[i].x-N[j].x, dy=N[i].y-N[j].y, d=dx*dx+dy*dy;
        if(d < LINK*LINK) out.push([i, j, Math.sqrt(d)]);
      }
      return out;
    }
    function draw(t){
      ctx.clearRect(0, 0, W, H);
      var L = links();
      for(var k=0;k<L.length;k++){
        var a=N[L[k][0]], b=N[L[k][1]], al=(1-L[k][2]/LINK)*.55;
        var mx=(a.x+b.x)/2-mouse.x, my=(a.y+b.y)/2-mouse.y, near=Math.max(0, 1-Math.sqrt(mx*mx+my*my)/220);
        ctx.strokeStyle = 'rgba(118,145,255,'+(al+near*.45).toFixed(3)+')';
        ctx.lineWidth = 1 + near; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      /* pulses: a result propagating from node to node */
      if(L.length && P.length < 14 && Math.random() < .06){ var e=L[(Math.random()*L.length)|0]; P.push({a:e[0], b:e[1], t:0, hop:0}); }
      for(var p=P.length-1;p>=0;p--){
        var q=P[p], A=N[q.a], B=N[q.b]; q.t += .018;
        if(q.t >= 1){
          var nx = L.filter(function(e){ return (e[0]===q.b||e[1]===q.b) && e[0]!==q.a && e[1]!==q.a; });
          if(nx.length && q.hop < 6){ var e2=nx[(Math.random()*nx.length)|0]; q.a=q.b; q.b=e2[0]===q.b?e2[1]:e2[0]; q.t=0; q.hop++; N[q.a].lit=1; }
          else { N[q.b].lit=1; P.splice(p,1); }
          continue;
        }
        var x=A.x+(B.x-A.x)*q.t, y=A.y+(B.y-A.y)*q.t, g=ctx.createRadialGradient(x,y,0,x,y,14);
        g.addColorStop(0,'rgba(220,228,255,.95)'); g.addColorStop(.35,'rgba(29,81,246,.55)'); g.addColorStop(1,'rgba(29,81,246,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,14,0,6.283); ctx.fill();
      }
      for(var i=0;i<N.length;i++){
        var n=N[i], lit=n.lit||0, tw=.55+.45*Math.sin(t/900+n.ph);
        if(lit){ ctx.fillStyle='rgba(118,145,255,'+(lit*.35).toFixed(3)+')'; ctx.beginPath(); ctx.arc(n.x,n.y,n.r+10*lit,0,6.283); ctx.fill(); n.lit=Math.max(0, lit-.02); }
        ctx.fillStyle='rgba(205,215,255,'+(.45+.5*tw).toFixed(3)+')'; ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,6.283); ctx.fill();
      }
    }
    function step(){
      for(var i=0;i<N.length;i++){
        var n=N[i], dx=n.x-mouse.x, dy=n.y-mouse.y, d2=dx*dx+dy*dy;
        if(d2 < 160*160 && d2 > 1){ var f=.6/Math.sqrt(d2); n.vx+=dx*f*.02; n.vy+=dy*f*.02; }
        n.vx*=.995; n.vy*=.995;
        var sp=Math.hypot(n.vx,n.vy); if(sp<.12){ n.vx+=(Math.random()-.5)*.05; n.vy+=(Math.random()-.5)*.05; }
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<-20) n.x=W+20; if(n.x>W+20) n.x=-20; if(n.y<-20) n.y=H+20; if(n.y>H+20) n.y=-20;
      }
    }
    function frame(t){ if(!run) return; var started=performance.now();step();draw(t);cv.dataset.drawMs=(performance.now()-started).toFixed(3);cv.dataset.frames=String(Number(cv.dataset.frames||0)+1);raf=requestAnimationFrame(frame); }
    function start(){ if(run||reduce||user||!vis||document.hidden||suspended) return; run=true;cv.dataset.animation='playing';raf=requestAnimationFrame(frame); }
    function stop(){ run=false;cancelAnimationFrame(raf);cv.dataset.animation='paused'; }
    size(); draw(0);
    listen(window,'resize',function(){size();if(!run)draw(0);});
    var hero = cv.parentElement;
    listen(hero,'pointermove',function(e){ var r=cv.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; });
    listen(hero,'pointerleave',function(){ mouse.x=mouse.y=-1e4; });
    var canvasObserver=new IntersectionObserver(function(es){vis=es[0].isIntersecting;vis?start():stop();});canvasObserver.observe(cv);
    function syncCanvas(){reduce=motion.matches;if(reduce||document.hidden||suspended){stop();if(reduce)draw(0);}else start();if(btn){btn.hidden=reduce;btn.textContent=zh?(user?'继续动效':'暂停动效'):(user?'Resume animation':'Pause animation');btn.setAttribute('aria-pressed',String(user));}}
    syncs.push(syncCanvas);cleanup.push(function(){stop();canvasObserver.disconnect();});
    if(btn){
      if(reduce) btn.hidden = true;
      listen(btn,'click',function(){user=!user;user?stop():start();syncCanvas();});
    }
    syncCanvas();
    }
  }

  /* ---------- record pipeline: steps light up in sequence while in view ---------- */
  var pipe = document.querySelector('.pipe');
  if(pipe){
    var pps=[].slice.call(pipe.querySelectorAll('.pp')),idx=0,timer=0,pipeVisible=false;
    function setW(){ pipe.style.setProperty('--pw', (pipe.offsetWidth + 120) + 'px'); }
    setW();listen(window,'resize',setW);

    function tick(){ pps.forEach(function(p, i){ p.classList.toggle('on', i <= idx); }); idx = (idx + 1) % (pps.length + 2); }
    function syncPipe(){
      if(motion.matches||document.hidden||suspended||!pipeVisible){clearInterval(timer);timer=0;pipe.dataset.animation='paused';if(motion.matches)pps.forEach(function(p){p.classList.add('on');});}
      else if(!timer){tick();timer=setInterval(tick,1100);pipe.dataset.animation='playing';}
    }
    var pipeObserver=new IntersectionObserver(function(es){pipeVisible=es[0].isIntersecting;syncPipe();},{threshold:.3});pipeObserver.observe(pipe);
    syncs.push(syncPipe);cleanup.push(function(){clearInterval(timer);pipeObserver.disconnect();});
  }
  function sync(){syncs.forEach(function(update){update();});}
  listen(motion,'change',sync);listen(document,'visibilitychange',sync);
  listen(window,'pagehide',function(event){suspended=true;sync();if(!event.persisted){cleanup.forEach(function(release){release();});lifecycle.abort();}});
  listen(window,'pageshow',function(){suspended=false;sync();});sync();
})();
