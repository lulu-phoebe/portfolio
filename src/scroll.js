export function createScrollScene(hero, reducedMotion) {
  const track = hero.parentElement;
  let pending = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  function update() {
    pending = false;
    const distance = track.offsetHeight - hero.offsetHeight;
    const p = reducedMotion.matches ? 0 : clamp((window.scrollY - track.offsetTop) / Math.max(1, distance));
    const fade = clamp((p - .12) / .76);
    hero.style.setProperty('--scene-rise', (-p * hero.offsetHeight * .38) + 'px');
    hero.style.setProperty('--title-rise', (-p * hero.offsetHeight * .46) + 'px');
    hero.style.setProperty('--intro-fade', 1 - clamp(p / .3));
    hero.style.setProperty('--stage-fade', 1 - clamp((p - .58) / .4));
    hero.style.setProperty('--dot-hole', (5 * (1 - fade)) + 'px');
    hero.style.setProperty('--veil-opacity', clamp(p / .16));
    hero.style.setProperty('--sticker-tilt', (-p * 28) + 'deg');
    hero.dataset.scrollProgress = p.toFixed(3);
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  update();
}
