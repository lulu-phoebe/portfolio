export function createExperienceFolders(reducedMotion) {
  const cards = [...document.querySelectorAll('.folder-card')];
  const stack = document.querySelector('.folder-stack');
  const switcher = document.createElement('div');
  switcher.className = 'folder-switcher';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', '切换经历文件夹');
  switcher.hidden = true;
  document.body.append(switcher);
  const switches = [];
  cards.forEach((card, index) => {
    const tab = card.querySelector('.folder-tab');
    const title = card.querySelector('h3');
    card.querySelector('.folder-body').id = `folder-content-${index}`;
    tab.setAttribute('aria-controls', `folder-content-${index}`);
    tab.setAttribute('aria-label', `查看${title.textContent}`);
    const control = tab.cloneNode(true);
    control.classList.add('folder-switch-tab');
    control.style.setProperty('--folder-index', index);
    control.style.setProperty('--folder-color', getComputedStyle(card).getPropertyValue('--folder-color'));
    control.addEventListener('click', () => tab.click());
    switcher.append(control);
    switches.push(control);
    tab.addEventListener('click', () => {
      cards.forEach((other, i) => {
        const selected = i === index;
        other.classList.toggle('is-front', selected);
        other.style.setProperty('--selected-steps', selected ? cards.length - 1 - i : 0);
        other.querySelector('.folder-tab').setAttribute('aria-pressed', String(selected));
        switches[i].setAttribute('aria-pressed', String(selected));
      });
      // Collect the folders before raising the chosen one; keep every tab reachable.
      const gap = parseFloat(getComputedStyle(stack).rowGap) || 0;
      const lastTop = stack.getBoundingClientRect().top + scrollY
        + cards.slice(0, -1).reduce((sum, item) => sum + item.offsetHeight + gap, 0);
      const pinnedTop = parseFloat(getComputedStyle(cards.at(-1)).top);
      window.scrollTo({top:lastTop - pinnedTop, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
      schedule();
      window.dispatchEvent(new Event('scroll'));
    });
  });
  let frame = 0;
  function update() {
    frame = 0;
    const gap = parseFloat(getComputedStyle(stack).rowGap) || 0;
    const lastTop = stack.getBoundingClientRect().top + scrollY
      + cards.slice(0, -1).reduce((sum, item) => sum + item.offsetHeight + gap, 0);
    const pinnedTop = parseFloat(getComputedStyle(cards.at(-1)).top);
    const sectionBottom = stack.closest('section').getBoundingClientRect().bottom;
    const detached = scrollY >= lastTop - pinnedTop - 2 && sectionBottom > pinnedTop + 80;
    switcher.hidden = !detached;
    stack.classList.toggle('tabs-detached', detached);
    switcher.style.top = `${Math.min(pinnedTop, stack.getBoundingClientRect().bottom - cards.at(-1).offsetHeight) - (innerWidth <= 760 ? 37 : 46)}px`;
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      const entering = Math.max(0, Math.min(1, (box.top - innerHeight * .66) / (innerHeight * .34)));
      card.style.setProperty('--folder-rise', reducedMotion.matches ? '0px' : `${entering * 65}px`);
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  update();
}
