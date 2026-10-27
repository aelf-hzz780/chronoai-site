/* Native links own locale routing. Enhance them with the current section or hash. */
(() => {
  'use strict';
  document.querySelectorAll('a[data-locale]').forEach(link => {
    link.addEventListener('click', () => {
      const next = new URL(link.href);
      next.search = location.search;
      let hash = decodeURIComponent(location.hash.slice(1));
      const mapping = document.getElementById('locale-anchors');
      const anchors = mapping ? JSON.parse(mapping.textContent) : {};
      next.hash = hash ? (anchors[hash] || hash) : '';
      if (!next.hash) {
        const section = [...document.querySelectorAll('main section[id]')]
          .filter(section => section.getBoundingClientRect().top <= 120).at(-1);
        if (section) next.hash = anchors[section.id] || section.id;
      }
      link.href = next.href;
    });
  });
})();
