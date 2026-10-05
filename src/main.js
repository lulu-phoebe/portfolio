import { createOrbitGallery } from './orbit-gallery.js';
import { createExperienceFolders } from './experience.js';
import { createScrollScene } from './scroll.js';
import { createScrollElasticity } from './scroll-elasticity.js';
import { createCursorTrail } from './cursor-trail.js';
import { createLight } from './reference-light.js';
import '@fontsource/pacifico/latin-400.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-sans/latin-900.css';
import './style.css';
const hero = document.querySelector('.hero');
const coordinates = document.querySelector('#coordinates');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
createScrollScene(hero, reducedMotion);
createScrollElasticity(reducedMotion);
createExperienceFolders(reducedMotion);
createOrbitGallery(reducedMotion);
createCursorTrail(hero, reducedMotion);
const backgroundLight = createLight(hero, reducedMotion);
import('./hello.js').then(({ createHello }) => createHello(hero, reducedMotion));
hero.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const bounds = hero.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  hero.style.setProperty('--mx', x * 24 + 'px');
  hero.style.setProperty('--my', y * 16 + 'px');
  if (!reducedMotion.matches) backgroundLight.move(x, y);
  coordinates.textContent = String(Math.round(event.clientX)).padStart(4, '0') + ' X ' + String(Math.round(event.clientY)).padStart(4, '0') + ' Y';
});
hero.addEventListener('pointerleave', () => {
  hero.style.setProperty('--mx', '0px');
  hero.style.setProperty('--my', '0px');
});
reducedMotion.addEventListener('change', () => backgroundLight.move(0, 0));
const clock = document.querySelector('#clock');
function updateClock() {
  clock.textContent = `GMT+8 CN ${new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Shanghai', hour:'2-digit', minute:'2-digit'}).format(new Date())} · HAVE A NICE DAY`;
}
updateClock(); setInterval(updateClock, 60000);
document.querySelector('#theme').addEventListener('click', () => {
  const dusk = document.body.classList.toggle('dusk');
  document.querySelector('#theme span').textContent = dusk ? '暮' : '晴';
});
let audio, oscillators = [], gain;
const soundButton = document.querySelector('#sound');
soundButton.addEventListener('click', async () => {
  const enabled = soundButton.getAttribute('aria-pressed') !== 'true';
  try {
    if (enabled) {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
      gain = audio.createGain(); gain.gain.value = 0; gain.connect(audio.destination);
      oscillators = [174.61, 261.63, 349.23].map(frequency => {
        const oscillator = audio.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        oscillator.connect(gain); oscillator.start(); return oscillator;
      });
      gain.gain.linearRampToValueAtTime(0.012, audio.currentTime + 1);
    } else {
      const fading = oscillators;
      gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.3);
      fading.forEach(oscillator => oscillator.stop(audio.currentTime + 0.35)); oscillators = [];
    }
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.querySelector('span').textContent = enabled ? '+' : '−';
  } catch {
    soundButton.querySelector('span').textContent = '不可用';
  }
});
const dialog = document.querySelector('#project-dialog');
const projects = [
  {title:'日常切片 / Everyday Pieces', text:'把路过的风景、偶然的色彩和日常里的小情绪，整理成一组视觉实验。用排版、拼贴和图形，留住那些值得多看一眼的瞬间。'},
  {title:'慢一点 / A Softer Pace', text:'如果数字体验也能让人松一口气，会是什么样子？这是一个关于节奏、空间与柔和交互的概念设计，探索更轻盈的日常体验。'}
];
function showDialog(title, text) {
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('p').textContent = text;
  dialog.showModal();
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[Number(button.dataset.project)]; showDialog(project.title, project.text);
}));
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) {const box = dialog.getBoundingClientRect(); if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();} });

const notebookFrame = document.querySelector('.notebook-frame');
let notebookVisible = false;
function notifyNotebook() { notebookFrame.contentWindow?.postMessage({type:'journal-visibility',visible:notebookVisible},location.origin); }
new IntersectionObserver(entries => {notebookVisible=entries[0].isIntersecting;notifyNotebook();},{rootMargin:'150px'}).observe(notebookFrame);
notebookFrame.addEventListener('load',notifyNotebook);
