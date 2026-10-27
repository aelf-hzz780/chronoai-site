/* Hero mark (v6.3): the ChronoAI logo drawn in "CHRONOAI" letters, after chronoai-logo-animation-16x9.mp4.
   Transparent canvas so it sits inside the background animation. */
(function(){
  var cv = document.querySelector('canvas.asciiMark'); if(!cv) return;
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = cv.getContext('2d'); if(!ctx) return;
  var dpr = Math.min(2, devicePixelRatio || 1);
  var S = 'CHRONOAI', CW = 9, CH = 12, cells = [], W = 0, H = 0, cols = 0, rows = 0;
  var run = false, raf = 0, vis = true, t0 = 0, mouse = {x:-1e4, y:-1e4}, band = null;
  var img = new Image();
  img.onload = build; img.src = cv.getAttribute('data-src');

  function build(){
    var r = cv.getBoundingClientRect(); W = r.width; H = W * 444 / 747;
    cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CW = Math.max(7, Math.min(11, Math.round(W / 100))); CH = Math.round(CW * 1.35);
    /* the slogan sits over the middle of the mark: letters under it fade so the words stay readable */
    var sl = document.querySelector('.bigslogan img');
    if(sl){ var b = sl.getBoundingClientRect(); band = {x0:b.left - r.left - 24, x1:b.right - r.left + 24, y0:b.top - r.top - 18, y1:b.bottom - r.top + 18}; }
    cols = Math.floor(W / CW); rows = Math.floor(H / CH);
    var off = document.createElement('canvas'); off.width = cols; off.height = rows;
    var o = off.getContext('2d'); o.drawImage(img, 0, 0, cols, rows);
    var px = o.getImageData(0, 0, cols, rows).data; cells = [];
    for(var y = 0; y < rows; y++) for(var x = 0; x < cols; x++){
      var a = px[(y * cols + x) * 4 + 3] / 255;
      if(a > .18) cells.push({x:x, y:y, a:a, d:Math.random() * 900 + x * 14, s:Math.random()});
    }
    ctx.font = '500 ' + (CW * 1.2).toFixed(1) + 'px "JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if(reduce) draw(5000); else start();
  }
  function draw(t){
    ctx.clearRect(0, 0, W, H);
    var shift = Math.floor(t / 260), sweep = ((t / 2600) % 1.6 - .3) * cols;
    for(var i = 0; i < cells.length; i++){
      var c = cells[i], appear = Math.min(1, Math.max(0, (t - c.d) / 500));
      if(appear <= 0) continue;
      var cx = c.x * CW + CW / 2, cy = c.y * CH + CH / 2;
      var wave = Math.max(0, 1 - Math.abs(c.x - sweep - c.y * .6) / 6);
      var dx = cx - mouse.x, dy = cy - mouse.y, near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 90);
      var tw = .5 + .5 * Math.sin(t / 700 + c.s * 12);
      var b = Math.min(1, (.42 + .4 * tw) * c.a + wave * .7 + near * .8) * appear;
      if(band){ var ex = Math.max(band.x0 - cx, 0, cx - band.x1), ey = Math.max(band.y0 - cy, 0, cy - band.y1), e = Math.sqrt(ex * ex + ey * ey);
        b *= .1 + .9 * Math.min(1, e / 40); }
      var ch = S[(c.x + c.y * 3 + shift + (wave > .5 ? 3 : 0)) % S.length];
      if(b > .75){ ctx.fillStyle = 'rgba(232,238,255,' + b.toFixed(3) + ')'; }
      else { ctx.fillStyle = 'rgba(' + Math.round(70 + 90 * b) + ',' + Math.round(100 + 90 * b) + ',255,' + (.25 + b * .75).toFixed(3) + ')'; }
      ctx.fillText(ch, cx, cy);
    }
  }
  function frame(ts){ if(!run) return; if(!t0) t0 = ts; draw(ts - t0); raf = requestAnimationFrame(frame); }
  function start(){ if(run || reduce || !vis || document.hidden) return; run = true; raf = requestAnimationFrame(frame); }
  function stop(){ run = false; cancelAnimationFrame(raf); }
  var observer = new IntersectionObserver(function(es){ vis = es[0].isIntersecting; vis ? start() : stop(); }); observer.observe(cv);
  document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
  addEventListener('pointermove', function(e){ var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, {passive:true});
  addEventListener('load', function(){ setTimeout(function(){ if(img.complete) build(); }, 900); });
  motion.addEventListener('change', function(){ reduce=motion.matches; if(reduce){stop();draw(5000);}else start(); });
  addEventListener('pagehide', function(){ stop(); clearTimeout(rt); });
  addEventListener('pageshow', function(){ if(img.complete)build(); });
  var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ if(img.complete) build(); }, 200); });
})();
