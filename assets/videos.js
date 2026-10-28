/* Optional YouTube enhancement. Native source links and static content work without it. */
(() => {
  'use strict';
  const settings=document.getElementById('video-config'),dialog=document.querySelector('.vr-dialog');
  if(!settings||!dialog||typeof dialog.showModal!=='function')return;
  const config=JSON.parse(settings.textContent),zh=document.documentElement.lang==='zh-CN';
  const ui={loading:zh?'正在加载 YouTube…':'Loading YouTube…',failed:zh?'暂时无法连接视频，请重试或在 YouTube 观看。':'Unable to load the video. Try again or watch on YouTube.',disabled:zh?'视频服务暂不可用，请稍后重试或查看原视频。':'The video service is unavailable. Try later or open the source video.',native:zh?'若未开始播放，可使用 YouTube 原生播放控件。':'If playback does not start, use the YouTube player controls.'};
  const slot=dialog.querySelector('.vr-player'),cover=dialog.querySelector('.vr-cover');
  const poster=dialog.querySelector('.vr-modal-poster'),art=cover.querySelector('.vr-research-art');
  const status=dialog.querySelector('.vr-status'),retry=dialog.querySelector('.vr-retry'),spinner=dialog.querySelector('.vr-loading-ring');
  const feedback=dialog.querySelector('.vr-feedback');
  const hint=dialog.querySelector('.vr-player-hint'),watch=dialog.querySelector('.vr-watch-external');
  const lifecycle=new AbortController(),{signal}=lifecycle;
  let serial=0,session=null,currentKey=null,returnTo=null,scrollLock=null;

  function report(error,trace){console.warn('[chrono-video]',{traceId:trace,message:String(error?.message||error)});}
  function stop(){
    const previous=session;session=null;
    if(previous){
      previous.abort.abort();clearTimeout(previous.timer);
      try{previous.player?.destroy();}catch(error){report(error,previous.trace);}
    }
    slot.replaceChildren();
  }
  function state(mode){
    dialog.dataset.state=mode;
    cover.hidden=mode==='player'||mode==='playing';
    feedback.hidden=mode!=='loading'&&mode!=='error';
    retry.hidden=mode!=='error';spinner.hidden=mode!=='loading';
    status.textContent=mode==='loading'?ui.loading:mode==='error'?ui.failed:'';
    hint.textContent=mode==='player'?ui.native:'';
  }
  function active(attempt){return session===attempt&&dialog.open&&!attempt.abort.signal.aborted;}
  function fail(error,attempt,disabled=false){
    if(attempt&&!active(attempt))return;
    report(error,attempt?.trace||`video-${currentKey}-${serial}`);stop();state('error');
    if(disabled)status.textContent=ui.disabled;
  }
  // Every pending API load owns its script, timeout and callback until settled or aborted.
  function loadAPI(provider,abortSignal){
    if(window.YT?.Player)return Promise.resolve(window.YT);
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script'),prior=window.onYouTubeIframeAPIReady;
      let settled=false,timer;
      const cancel=()=>finish(new DOMException('Video closed','AbortError'));
      const ready=()=>{
        finish(window.YT?.Player?null:new Error('YouTube API did not expose Player'));
        if(typeof prior==='function'){try{prior();}catch(error){report(error,'video-prior-api-callback');}}
      };
      function finish(error){
        if(settled)return;settled=true;clearTimeout(timer);script.onerror=null;
        abortSignal.removeEventListener('abort',cancel);
        if(window.onYouTubeIframeAPIReady===ready){if(prior===undefined)delete window.onYouTubeIframeAPIReady;else window.onYouTubeIframeAPIReady=prior;}
        script.remove();
        if(error)reject(error);else resolve(window.YT);
      }
      window.onYouTubeIframeAPIReady=ready;
      script.src=provider.apiUrl;script.dataset.videoApi='youtube';script.referrerPolicy='strict-origin-when-cross-origin';
      script.onerror=()=>finish(new Error('YouTube API request failed'));
      abortSignal.addEventListener('abort',cancel,{once:true});
      timer=setTimeout(()=>finish(new Error('YouTube API load timed out')),provider.loadTimeoutMs);
      if(abortSignal.aborted)cancel();else document.head.append(script);
    });
  }
  function youtube(video,provider,attempt){
    const frame=document.createElement('iframe'),url=new URL(`/embed/${video.source.id}`,provider.embedOrigin);
    for(const [key,value] of Object.entries({autoplay:'1',playsinline:'1',controls:'1',rel:'0',enablejsapi:'1',origin:location.origin,hl:zh?'zh-CN':'en'}))url.searchParams.set(key,value);
    frame.src=url.href;frame.title=video.title;
    frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;
    frame.referrerPolicy='strict-origin-when-cross-origin';cover.hidden=true;slot.append(frame);
    loadAPI(provider,attempt.abort.signal).then(YT=>{
      if(!active(attempt))return;
      const player=new YT.Player(frame,{events:{
        onReady:event=>{
          if(!active(attempt))return;
          clearTimeout(attempt.timer);state('player');
          try{event.target.unMute();event.target.playVideo();}catch(error){fail(error,attempt);}
        },
        onStateChange:event=>{if(active(attempt)&&event.data===1){clearTimeout(attempt.timer);state('playing');}},
        onAutoplayBlocked:()=>{if(active(attempt)){clearTimeout(attempt.timer);state('player');}},
        onError:event=>fail(new Error(`YouTube player error ${event.data}`),attempt)
      }});
      if(active(attempt))attempt.player=player;else player.destroy();
    }).catch(error=>{if(active(attempt))fail(error,attempt);});
  }
  const factories={youtube};
  function play(){
    stop();state('loading');
    const attempt={trace:`video-${currentKey}-${++serial}`,abort:new AbortController(),timer:null,player:null};session=attempt;
    try{
      const video=config.videos[currentKey],provider=config.providers[video.source.provider];
      if(!provider?.enabled){fail(new Error('Video provider disabled'),attempt,true);return;}
      if(!factories[video.source.provider]||!/^[A-Za-z0-9_-]{11}$/.test(video.source.id))throw new Error('Video configuration unavailable');
      if(!Number.isFinite(provider.loadTimeoutMs)||provider.loadTimeoutMs<=0)throw new Error('Invalid video timeout');
      attempt.timer=setTimeout(()=>fail(new Error('YouTube player ready timed out'),attempt),provider.loadTimeoutMs);
      factories[video.source.provider](video,provider,attempt);
    }catch(error){fail(error,attempt);}
  }
  function restoreScroll(){if(scrollLock!==null){document.body.style.overflow=scrollLock;scrollLock=null;}}
  function close(restoreFocus=true){
    stop();if(dialog.open)dialog.close();restoreScroll();state('idle');
    if(restoreFocus&&returnTo?.isConnected)returnTo.focus({preventScroll:true});
  }
  function open(trigger){
    const video=config.videos[trigger.dataset.openVideo];
    if(!video)return;
    stop();currentKey=trigger.dataset.openVideo;returnTo=trigger;
    dialog.dataset.videoKey=currentKey;dialog.dataset.shape=video.shape;dialog.setAttribute('aria-label',video.title);
    dialog.querySelector('.vr-modal-title').textContent=`${video.title} · ${video.duration}`;
    poster.hidden=!video.poster;art.hidden=Boolean(video.poster);
    if(video.poster){poster.src=video.poster;poster.alt=video.title;}else poster.removeAttribute('src');
    watch.href=video.watchUrl;
    if(!dialog.open){dialog.showModal();scrollLock=document.body.style.overflow;document.body.style.overflow='hidden';}
    dialog.scrollTop=0;dialog.querySelector('.vr-close').focus();play();
  }
  document.querySelectorAll('a[data-open-video]').forEach(link=>link.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(!config.videos[link.dataset.openVideo])return;
    event.preventDefault();
    try{open(link);}catch(error){report(error,'video-open');close();location.assign(link.href);}
  },{signal}));
  retry.addEventListener('click',play,{signal});
  dialog.querySelector('.vr-close').addEventListener('click',()=>close(),{signal});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();},{signal});
  dialog.addEventListener('close',()=>{if(!dialog.open){stop();restoreScroll();}},{signal});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();
  },{signal});
  addEventListener('pagehide',event=>{close(false);if(!event.persisted)lifecycle.abort();},{signal});
  addEventListener('pageshow',()=>{if(dialog.open||session)close(false);},{signal});
})();
