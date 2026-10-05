export function createCursorTrail(hero, reducedMotion) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  hero.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let particles = [], previous = null, frame = 0, lastTime = 0;
  let width = 0, height = 0;
  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = [];
    previous = null;
  }
  function draw(time) {
    const dt = Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    ctx.clearRect(0, 0, width, height);
    const fade = 1 - Number(hero.dataset.scrollProgress || 0);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const alpha = Math.max(0, p.life / p.duration);
      ctx.globalAlpha = alpha * alpha * fade;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, .65)';
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (.5 + alpha * .5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    if (particles.length) frame = requestAnimationFrame(draw);
    else { frame = 0; ctx.clearRect(0, 0, width, height); }
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches || document.hidden) return;
    const bounds = hero.getBoundingClientRect();
    if (Number(hero.dataset.scrollProgress || 0) > .8 || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      previous = null;
      return;
    }
    const point = {x:event.clientX - bounds.left, y:event.clientY - bounds.top};
    const start = previous || point;
    const distance = Math.hypot(point.x - start.x, point.y - start.y);
    // Interpolate along quick movements, avoiding gaps and long jumps after leaving.
    const count = Math.min(36, Math.max(12, Math.ceil(distance / 4)));
    for (let i = 1; i <= count; i++) {
      const t = i % 3 === 0 ? i / count : .8 + Math.random() * .2;
      const duration = .3 + Math.random() * .3;
      particles.push({
        x:start.x + (point.x - start.x) * t + (Math.random() - .5) * 22,
        y:start.y + (point.y - start.y) * t + (Math.random() - .5) * 22,
        vx:(Math.random() - .5) * 22, vy:(Math.random() - .5) * 22,
        radius:.65 + Math.random() * .75, life:duration, duration
      });
    }
    if (particles.length > 360) particles.splice(0, particles.length - 360);
    previous = point;
    if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(draw); }
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave', () => { previous = null; });
  window.addEventListener('scroll', () => { previous = null; }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
  });
  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    particles = [];
    previous = null;
    ctx.clearRect(0, 0, width, height);
  }
  reducedMotion.addEventListener('change', clear);
  new ResizeObserver(resize).observe(hero);
  resize();
}
