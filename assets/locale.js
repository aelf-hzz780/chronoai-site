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
        // Choose the closest reading landmark; equal-height grid cards keep
        // their first reading-order target instead of jumping to the last card.
        const nearest = [...document.querySelectorAll('main section[id], main [data-locale-section]')]
          .map(section => ({section, top:section.getBoundingClientRect().top}))
          .filter(item => item.top <= 120)
          .reduce((best,item) => !best || item.top > best.top + 1 ? item : best, null);
        const section = nearest?.section;
        if (section) next.hash = anchors[section.id] || section.id;
      }
      link.href = next.href;
    });
  });
})();
