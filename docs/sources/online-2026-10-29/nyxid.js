/* NyxID page (v6.4): pointer parallax on the mark and the glow, spotlight on the three layer cards. */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hero = document.querySelector('.nx-hero'), mark = document.querySelector('.nx-mark svg'), glow = document.querySelector('.nx-glow');
  if(hero && mark && !reduce && fine){
    hero.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      mark.style.setProperty('--rx', (x * 16).toFixed(2) + 'deg'); mark.style.setProperty('--ry', (-y * 12).toFixed(2) + 'deg');
      if(glow){ glow.style.setProperty('--gx', (x * 60).toFixed(1) + 'px'); glow.style.setProperty('--gy', (y * 40).toFixed(1) + 'px'); }
    });
    hero.addEventListener('pointerleave', function(){ mark.style.setProperty('--rx','0deg'); mark.style.setProperty('--ry','0deg'); });
  }
  [].slice.call(document.querySelectorAll('.nx-layer')).forEach(function(c){
    c.addEventListener('pointermove', function(e){ var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
})();
