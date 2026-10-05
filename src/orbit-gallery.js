export function createOrbitGallery(reducedMotion) {
  const stage = document.querySelector('.orbit-stage');
  const cards = [...stage.querySelectorAll('.orbit-card')];
  const toggle = document.querySelector('.orbit-toggle');
  let angle = .35, frame = 0, last = 0, visible = false, paused = reducedMotion.matches;
  let hovered = false, dragging = false, downX = 0, previousX = 0, travel = 0;
  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-dialog';
  dialog.innerHTML = '<button type="button" class="gallery-close" aria-label="关闭作品预览">×</button><div class="gallery-preview orbit-art"></div><h2></h2><p>AI 生成的临时视觉示例，后续替换为真实作品。</p>';
  document.body.append(dialog);
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', start);
  function layout() {
    const width = stage.clientWidth, mobile = width < 650;
    const rx = Math.max(60, Math.min(width * (mobile ? .32 : .39), 520));
    const ry = mobile ? 84 : 120;
    cards.forEach((card, i) => {
      const a = angle + i * Math.PI * 2 / cards.length;
      const depth = (Math.sin(a) + 1) / 2;
      card.style.setProperty('--orbit-x', `${Math.cos(a) * rx}px`);
      card.style.setProperty('--orbit-y', `${Math.sin(a) * ry - Math.cos(a) * (mobile ? 12 : 28)}px`);
      card.style.setProperty('--orbit-scale', .72 + depth * .38);
      card.style.zIndex = Math.round(10 + depth * 50);
      card.style.filter = `brightness(${.88 + depth * .12})`;
    });
  }
  function draw(now) {
    frame = 0;
    const dt = Math.max(0, Math.min(.05, (now - (last || now)) / 1000)); last = now;
    if (!paused && !hovered && !dragging && !dialog.open) angle += dt * .22;
    layout();
    if (visible && !document.hidden && !paused && !hovered && !dragging && !dialog.open) frame = requestAnimationFrame(draw);
  }
  function start() { if (visible && !document.hidden && !frame) { last = performance.now(); frame = requestAnimationFrame(draw); } }
  new ResizeObserver(() => { layout(); start(); }).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); }, {rootMargin:'100px'}).observe(stage);
  document.addEventListener('visibilitychange', start);
  function updateToggle() { toggle.setAttribute('aria-pressed', String(paused)); toggle.textContent = paused ? '开始旋转 ↻' : '暂停旋转 Ⅱ'; }
  toggle.onclick = () => { paused = !paused; updateToggle(); start(); };
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateToggle(); start(); });
  cards.forEach((card, i) => {
    card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') hovered = true; });
    card.addEventListener('pointerleave', () => { hovered = false; start(); });
    card.addEventListener('focus', () => { hovered = true; });
    card.addEventListener('blur', () => { hovered = false; start(); });
    card.addEventListener('click', event => {
      if (event.detail !== 0 && travel > 5) return;
      const preview = dialog.querySelector('.gallery-preview');
      preview.style.setProperty('--art-x', `${i % 3 * 50}%`);
      preview.style.setProperty('--art-y', i < 3 ? '0%' : '100%');
      dialog.querySelector('h2').textContent = card.querySelector('strong').textContent;
      dialog.showModal();
    });
  });
  stage.addEventListener('pointerdown', event => { if (event.button !== 0) return; dragging = true; downX = previousX = event.clientX; travel = 0; });
  window.addEventListener('pointermove', event => {
    if (!dragging) return;
    travel = Math.max(travel, Math.abs(event.clientX - downX));
    angle += (event.clientX - previousX) * .006;
    previousX = event.clientX; layout();
  }, {passive:true});
  function endDrag() { dragging = false; start(); }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); angle += event.key === 'ArrowLeft' ? -.25 : .25; layout();
    }
  });
  updateToggle(); layout();
}
