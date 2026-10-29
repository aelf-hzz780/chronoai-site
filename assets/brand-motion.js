/* Official NyxID/Company motion; original sources and hashes: content/brand/sources.json.
   Keep the same paths, timing and pointer ranges, with lifecycle cleanup and localized controls. */
(() => {
  'use strict';
  const lifecycle=new AbortController(),{signal}=lifecycle;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:767px)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)'),zh=document.documentElement.lang==='zh-CN';
  let suspended=false;
  const active=()=>!reduced.matches&&!document.hidden&&!suspended;
  const header=document.querySelector('header');
  const solid=()=>header?.classList.toggle('solid',scrollY>40);
  addEventListener('scroll',solid,{passive:true,signal});solid();
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in');reveal.unobserve(entry.target);}
  }),{rootMargin:'0px 0px -25% 0px'});
  const progress=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('on');progress.unobserve(entry.target);}
  }),{rootMargin:'0px 0px -35% 0px'});
  if(document.querySelector('.c1'))document.documentElement.classList.add('js5');
  document.querySelectorAll('.h5 .rv').forEach(el=>reveal.observe(el));
  document.querySelectorAll('.st4,.dt,.crow,.kind,.qc,.qa').forEach(el=>progress.observe(el));
  const hero=document.querySelector('.nx-hero'),mark=document.querySelector('.nx-mark svg'),glow=document.querySelector('.nx-glow');
  const reset=()=>{
    mark?.style.setProperty('--rx','0deg');mark?.style.setProperty('--ry','0deg');
    glow?.style.setProperty('--gx','0px');glow?.style.setProperty('--gy','0px');
  };
  hero?.addEventListener('pointermove',event=>{
    if(!active()||!fine.matches||!mark)return;
    const r=hero.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
    mark.style.setProperty('--rx',`${(x*16).toFixed(2)}deg`);mark.style.setProperty('--ry',`${(-y*12).toFixed(2)}deg`);
    glow?.style.setProperty('--gx',`${(x*60).toFixed(1)}px`);glow?.style.setProperty('--gy',`${(y*40).toFixed(1)}px`);
  },{signal});
  hero?.addEventListener('pointerleave',reset,{signal});
  document.querySelectorAll('.nx-layer').forEach(card=>card.addEventListener('pointermove',event=>{
    if(!active()||!fine.matches)return;
    const r=card.getBoundingClientRect();card.style.setProperty('--mx',`${event.clientX-r.left}px`);card.style.setProperty('--my',`${event.clientY-r.top}px`);
  },{signal}));
  const backgrounds=[...document.querySelectorAll('.netBg,.inviteBg')];
  document.querySelectorAll('.pause5').forEach(button=>{
    const background=button.closest('section')?.querySelector('.netBg,.inviteBg');
    if(!background)return;
    button.addEventListener('click',()=>{background.dataset.userPaused=String(background.dataset.userPaused!=='true');update();},{signal});
  });
  let paused=false;
  try{paused=localStorage.getItem('cai-anim')==='paused';}catch(error){console.warn('[chrono-brand trace=motion-storage] Animation preference unavailable.',error);}
  const diagrams=[...document.querySelectorAll('svg[data-seq]')].map(svg=>{
    const sequence=JSON.parse(svg.dataset.seq),dot=svg.querySelector('.dot');
    const paths=Object.fromEntries([...svg.querySelectorAll('[data-p]')].map(p=>[p.dataset.p,p]));
    const lits=[...svg.querySelectorAll('.lit')],total=sequence.reduce((sum,step)=>sum+step[3],0);
    let frame=0,start=0,visible=false,once=false;
    const staticView=()=>{dot.setAttribute('opacity','0');lits.forEach(l=>l.style.opacity='.55');};
    const stop=()=>{cancelAnimationFrame(frame);frame=0;start=0;staticView();svg.dataset.animation='paused';};
    function tick(time){
      if(!active()){stop();return;}
      if(!start)start=time;
      const elapsed=time-start;
      if(once&&elapsed>=total){stop();return;}
      const t=elapsed%total;let acc=0,step=sequence[0],f=0;
      for(const item of sequence){if(t<acc+item[3]){step=item;f=(t-acc)/item[3];break;}acc+=item[3];}
      const path=paths[step[0]],ease=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
      const point=path.getPointAtLength(path.getTotalLength()*(step[1]+(step[2]-step[1])*ease));
      dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);dot.setAttribute('opacity','1');
      lits.forEach(l=>l.style.opacity=l.dataset.l===step[0]?'.95':'.12');frame=requestAnimationFrame(tick);
    }
    function play(playOnce=false){
      if(frame||!active()||!svg.getClientRects().length)return;
      once=playOnce;svg.dataset.animation='playing';frame=requestAnimationFrame(tick);
    }
    const sync=()=>{if(active()&&visible&&!paused&&!mobile.matches)play();else stop();};
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1});
    observer.observe(svg);staticView();
    return{sync,stop,play,destroy:()=>{observer.disconnect();stop();}};
  });
  const playButton=document.querySelector('.playbtn');
  playButton?.addEventListener('click',()=>{
    if(mobile.matches){diagrams.forEach(d=>{d.stop();d.play(true);});return;}
    paused=!paused;
    try{localStorage.setItem('cai-anim',paused?'paused':'play');}catch(error){console.warn('[chrono-brand trace=motion-storage] Animation preference unavailable.',error);}
    update();
  },{signal});
  function update(){
    if(!active())reset();
    backgrounds.forEach(background=>background.classList.toggle('paused',!active()||background.dataset.userPaused==='true'));
    document.querySelectorAll('.pause5').forEach(button=>{
      const background=button.closest('section')?.querySelector('.netBg,.inviteBg'),isPaused=background?.dataset.userPaused==='true';
      button.hidden=reduced.matches;button.textContent=zh?(isPaused?'继续动效':'暂停动效'):(isPaused?'Resume animation':'Pause animation');button.setAttribute('aria-pressed',String(isPaused));
    });
    if(playButton){playButton.hidden=reduced.matches;const play=mobile.matches||paused;playButton.textContent=zh?(play?'播放动画':'暂停动画'):(play?'Play animation':'Pause animation');playButton.setAttribute('aria-pressed',String(!play));}
    diagrams.forEach(d=>d.sync());
  }
  reduced.addEventListener('change',update,{signal});mobile.addEventListener('change',update,{signal});
  document.addEventListener('visibilitychange',update,{signal});
  addEventListener('pagehide',event=>{
    suspended=true;update();
    if(!event.persisted){reveal.disconnect();progress.disconnect();diagrams.forEach(d=>d.destroy());lifecycle.abort();}
  },{signal});
  addEventListener('pageshow',()=>{suspended=false;update();},{signal});update();
})();
