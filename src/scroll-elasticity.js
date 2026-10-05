export function createScrollElasticity(reducedMotion) {
  const hero = document.querySelector('.hero');
  document.querySelectorAll('.intro,.stage,.hero-title,.about-grid').forEach(el => el.classList.add('elastic-surface'));
  for (const section of document.querySelectorAll('.notebook-section,.work-section,.contact')) {
    const surface = document.createElement('div');
    surface.className = 'elastic-surface';
    while (section.firstChild) surface.append(section.firstChild);
    section.append(surface);
  }
  const grid = document.createElement('div');
  grid.className = 'page-grid';
  grid.setAttribute('aria-hidden', 'true');
  for (let row = 1; row <= 2; row++) for (let col = 0; col <= 3; col++) {
    const cross = document.createElement('span');
    cross.style.left = `${col / 3 * 100}%`;
    cross.style.top = `${row / 3 * 100}%`;
    grid.append(cross);
  }
  document.body.append(grid);
  const planes = [...document.querySelectorAll('.intro>*,.stage,.hero-title,.about-portrait>*,.about-copy>*,.about-eyebrow,.notebook-heading>*,.notebook-frame,.work-section .section-top,.work-section .elastic-surface>h2,.orbit-stage,.gallery-heading>*,.folder-face,.experience-heading>*,.project,.placeholder-note,.contact .elastic-surface>*')];
  planes.forEach(el => el.classList.add('elastic-plane'));
  let frame = 0;
  const clamp = n => Math.max(-1, Math.min(1, n));
  function update() {
    frame = 0;
    grid.style.opacity = Math.min(1, Math.max(0, (scrollY - hero.offsetHeight * .65) / (hero.offsetHeight * .3)));
    // Measure the original rectangles so perspective cannot feed back into its own angle.
    planes.forEach(el => { el.style.transform = 'none'; });
    const positions = planes.map(el => {
      const box = el.getBoundingClientRect();
      return clamp((box.top + box.height / 2 - innerHeight / 2) / (innerHeight / 2));
    });
    planes.forEach((el, i) => {
      const position = positions[i];
      // A small neutral band keeps content at the centre flat and easy to read.
      const amount = Math.sign(position) * Math.max(0, (Math.abs(position) - .08) / .92);
      el.style.setProperty('--plane-tilt', (reducedMotion.matches ? 0 : amount * 7) + 'deg');
      el.style.setProperty('--plane-scale', '1');
      el.style.setProperty('--plane-stretch', '1');
      el.style.removeProperty('transform');
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  const observer = new ResizeObserver(schedule);
  document.querySelectorAll('main>section,.hero').forEach(el => observer.observe(el));
  document.fonts.ready.then(schedule);
  update();
}
