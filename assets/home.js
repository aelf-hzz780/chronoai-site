/* Progressive enhancements for the approved ChronoAI homepage. */
(() => {
  'use strict';
  const lifecycle = new AbortController(), {signal}=lifecycle;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width:1023px)');
  const root=document.documentElement;
  root.classList.add('js5');document.body.classList.add('home');
  const header=document.querySelector('header');
  const why=document.querySelector('.why2');
  let frame=0, suspended=false, userPaused=false, sceneStarted=false, scenePending=null;
  function paintScroll() {
    frame=0;
    header?.classList.toggle('solid',scrollY>40);
    if (!why) return;
    const words=[...why.querySelectorAll('.ww')],texts=[...why.querySelectorAll('.wt')];
    const rect=why.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-innerHeight)));
    why.style.setProperty('--wp',progress.toFixed(3));
    const index=Math.min(2,Math.floor(progress*3.0001));
    [...words,...texts].forEach(node => {
      const current=Number(node.dataset.i);
      node.classList.toggle('on',reduced.matches||mobile.matches||current===index);
      node.classList.toggle('done',current<index);
    });
  }
  const queueScroll=()=>{if(!frame)frame=requestAnimationFrame(paintScroll);};
  addEventListener('scroll',queueScroll,{passive:true,signal});
  addEventListener('resize',queueScroll,{signal});paintScroll();
  requestAnimationFrame(()=>document.querySelectorAll('.s1 .rv,.s1 .rvf').forEach(el=>el.classList.add('in')));
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in','on');reveal.unobserve(entry.target);}
  }),{rootMargin:'0px 0px -25% 0px'});
  document.querySelectorAll('.h5:not(.s1) .rv,.st4').forEach(el=>reveal.observe(el));
  document.querySelectorAll('.bx').forEach(card=>{
    card.addEventListener('pointermove',event=>{
      if(reduced.matches||mobile.matches||event.pointerType==='touch')return;
      const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
      card.style.setProperty('--mx',`${x*100}%`);card.style.setProperty('--my',`${y*100}%`);
      card.style.setProperty('--ry',`${(x-.5)*6}deg`);card.style.setProperty('--rx',`${(.5-y)*6}deg`);
    },{signal});
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');},{signal});
  });
  const background=document.querySelector('.usPar'),hero=document.querySelector('.s1');
  hero?.addEventListener('pointermove',event=>{
    if(reduced.matches||mobile.matches||event.pointerType==='touch')return;
    const rect=hero.getBoundingClientRect();
    background.style.transition='transform 180ms ease-out';
    background.style.transform=`translate(${((event.clientX-rect.left)/rect.width*2-1)*8}px,${((event.clientY-rect.top)/rect.height*2-1)*8}px)`;
  },{signal});
  hero?.addEventListener('pointerleave',()=>{background.style.transform='translate(0,0)';},{signal});
  const sceneElement=document.querySelector('.usScene');
  const sceneActive=()=>!reduced.matches&&!document.hidden&&!suspended;
  function stopScene() {
    window.UnicornStudio?.destroy();sceneStarted=false;
    sceneElement?.removeAttribute('data-us-initialized');
  }
  async function updateScene() {
    if (!sceneActive()) {if(!scenePending)stopScene();return;}
    if (sceneStarted||scenePending||!window.UnicornStudio||!sceneElement) return;
    sceneElement.setAttribute('data-us-initialized','true');
    // One in-flight initialization owns the scene until it settles. Media changes
    // only update desired activity; they cannot start a second pending renderer.
    scenePending=window.UnicornStudio.addScene({
      filePath:sceneElement.dataset.usProjectSrc,element:sceneElement,
      dpi:1.5,scale:1,lazyLoad:true,altText:sceneElement.dataset.usAlttext
    });
    try {
      await scenePending;sceneStarted=true;
    } catch(error) {
      stopScene();console.warn('[chrono-home scene] Background unavailable; static content retained.',error);
    } finally {
      scenePending=null;
      if(!sceneActive())stopScene();
    }
  }
  const pause=document.querySelector('.pause5'),invite=document.querySelector('.inviteBg');
  function updateMotion() {
    paintScroll();updateScene();
    const paused=userPaused||document.hidden||reduced.matches||suspended;
    invite?.classList.toggle('paused',paused);
    if(pause){
      pause.hidden=reduced.matches;
      pause.textContent=document.documentElement.lang==='zh-CN'?(userPaused?'继续动效':'暂停动效'):(userPaused?'Resume animation':'Pause animation');
      pause.setAttribute('aria-pressed',String(userPaused));
    }
  }
  pause?.addEventListener('click',()=>{userPaused=!userPaused;updateMotion();},{signal});
  document.addEventListener('visibilitychange',updateMotion,{signal});
  reduced.addEventListener('change',updateMotion,{signal});
  addEventListener('pagehide',event=>{
    suspended=true;cancelAnimationFrame(frame);if(!scenePending)stopScene();
    if(!event.persisted){reveal.disconnect();lifecycle.abort();}
  },{signal});
  addEventListener('pageshow',()=>{suspended=false;updateMotion();},{signal});
  updateMotion();
})();
