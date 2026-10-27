/* Navigation enhancement; all destinations and content exist in the initial HTML. */
(() => {
  'use strict';
  const lifecycle = new AbortController();
  const {signal} = lifecycle;
  const zh = document.documentElement.lang === 'zh-CN';
  const dropdowns = [...document.querySelectorAll('.dd')];
  const burger = document.querySelector('.burger');
  const drawer = document.querySelector('.drawer');
  const icon = open => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="${open ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'}"/></svg>`;
  let opened = false;
  function closeDropdowns() {
    dropdowns.forEach(dd => {
      dd.classList.remove('open');
      dd.querySelector('button').setAttribute('aria-expanded','false');
    });
  }
  function setDrawer(open, restore = true) {
    opened = open;
    drawer.classList.toggle('open',open);
    drawer.inert = !open;
    burger.setAttribute('aria-expanded',String(open));
    burger.setAttribute('aria-label',zh ? (open ? '关闭菜单' : '打开菜单') : (open ? 'Close menu' : 'Open menu'));
    burger.innerHTML = icon(open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open && restore) burger.focus();
  }
  dropdowns.forEach(dd => dd.querySelector('button').addEventListener('click',event => {
    const open = !dd.classList.contains('open');
    closeDropdowns();
    dd.classList.toggle('open',open);
    dd.querySelector('button').setAttribute('aria-expanded',String(open));
    event.stopPropagation();
  },{signal}));
  document.addEventListener('click',closeDropdowns,{signal});
  if (burger && drawer) {
    setDrawer(false,false);
    burger.addEventListener('click',() => setDrawer(!opened),{signal});
    drawer.querySelectorAll('.dgrp>button').forEach(button => button.addEventListener('click',() => {
      const open = button.parentElement.classList.toggle('open');
      button.setAttribute('aria-expanded',String(open));
    },{signal}));
    drawer.addEventListener('click',event => {if(event.target.closest('a'))setDrawer(false,false);},{signal});
    document.addEventListener('keydown',event => {
      if (event.key === 'Escape') {closeDropdowns();if(opened)setDrawer(false);}
      if (event.key !== 'Tab' || !opened) return;
      const focusable = [burger,...drawer.querySelectorAll('a,button')].filter(el => el.getClientRects().length);
      const first=focusable[0],last=focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    },{signal});
    const wide=matchMedia('(min-width:1024px)');
    wide.addEventListener('change',() => {if(wide.matches)setDrawer(false,false);},{signal});
  }
  window.addEventListener('pagehide',event => {if(!event.persisted)lifecycle.abort();},{signal});
})();
