import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createIcons, BookOpen, RotateCcw, Plus, Minus, Orbit } from 'lucide';
import { createJournalModel } from './model';
import './style.css';
import { decorateCover } from './decorations';
import characterPhoto from './assets/character-id.jpg';
import contactCard from './assets/contact-card.jpg';
import innerReceipt from './assets/inner-receipt.png';
import innerId from './assets/inner-id.png';

createIcons({icons:{BookOpen,RotateCcw,Plus,Minus,Orbit}});
const viewport=document.querySelector<HTMLDivElement>('#viewport')!;
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(35,1,.1,250);
let renderer:T.WebGLRenderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch(e){const el=document.querySelector<HTMLDivElement>('#error')!;el.hidden=false;el.textContent='无法启动三维视图，请启用浏览器硬件加速后重试。';throw e;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;viewport.appendChild(renderer.domElement);
const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.65;scene.environmentRotation.set(.15,.65,.25);room.dispose();pmrem.dispose();
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=22;controls.maxDistance=240;controls.autoRotateSpeed=.7;
// The outer portfolio owns page scrolling; zoom stays available via the original buttons.
if(window.parent!==window){
  controls.enableZoom=false;
  renderer.domElement.addEventListener('wheel',e=>{if(!e.ctrlKey){e.preventDefault();window.parent.scrollBy({top:e.deltaY,left:0,behavior:'instant'});}}, {passive:false});
}

const key=new T.DirectionalLight('#fff8f1',1.9);key.position.set(-14,20,28);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-32,right:32,top:30,bottom:-30,near:1,far:100});key.shadow.bias=-.0003;key.shadow.normalBias=.04;key.shadow.radius=4;scene.add(key);
const fill=new T.DirectionalLight('#e7efff',.55);fill.position.set(18,-3,17);scene.add(fill,new T.HemisphereLight('#ffffff','#798276',.35));
const ground=new T.Mesh(new T.PlaneGeometry(300,300),new T.ShadowMaterial({opacity:.12}));ground.position.z=-1;ground.receiveShadow=true;scene.add(ground);
const model=createJournalModel();scene.add(model.root);
 const decorations=decorateCover(model.root);
renderer.localClippingEnabled=true;
const photo=model.root.getObjectByName('character-id-photo')!; const receipt=model.root.getObjectByName('internship-receipt')!; const idCard=model.root.getObjectByName('artist-id-card')!;
const cardRest=decorations.card.position.clone(),photoRest=photo.position.clone();
let selectedCard:T.Object3D|null=null,cardProgress=0,cardClosing=false;
let hoverCard:T.Object3D|null=null;
const dialog=document.createElement('dialog');dialog.className='card-dialog';dialog.innerHTML='<button aria-label="收回卡片" class="close-card">×</button><img alt="蓝底人物证件照"><div class="blank-card"></div>';document.body.appendChild(dialog);
function closeCard(){dialog.close();dialog.classList.remove("inner-detail");cardClosing=true;}
dialog.querySelector('button')!.addEventListener('click',closeCard);dialog.addEventListener('click',e=>{if(e.target===dialog)closeCard()});dialog.addEventListener('cancel',e=>{e.preventDefault();closeCard()});
function pullCard(card:T.Object3D){if(selectedCard)return;selectedCard=card;cardClosing=false;cardProgress=0;controls.enabled=false;}
function enlargeCard(){const isPhoto=selectedCard===photo;const img=dialog.querySelector('img')!;img.src=isPhoto?characterPhoto:contactCard;img.hidden=false;(dialog.querySelector('.blank-card') as HTMLElement).hidden=true;dialog.showModal();}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&selectedCard&&!dialog.open)closeCard();});
function updateCard(dt:number){
 decorations.update();
 for(const item of [receipt,idCard]){const base=item.userData.baseRotZ;const wobble=hoverCard===item&&!reducedMotion?Math.sin(performance.now()*.009)*.023:0;item.rotation.z=T.MathUtils.damp(item.rotation.z,base+wobble,14,dt);}
 if(!selectedCard)return;
 cardProgress=T.MathUtils.clamp(cardProgress+(cardClosing?-1:1)*dt/.95,0,1);
 const isPhoto=selectedCard===photo,rest=isPhoto?photoRest:cardRest;
 // Slide flush beneath the frame/pocket first. Lift only after the bottom clears its opening.
 const slide=T.MathUtils.smoothstep(cardProgress,0,.88),lift=T.MathUtils.smoothstep(cardProgress,.88,1);
 selectedCard.position.copy(rest);selectedCard.position.y+=slide*(isPhoto?6.35:4.85);if(!isPhoto)selectedCard.position.x+=slide*.64;selectedCard.position.z+=lift*(isPhoto?-.3:.3);
 if(!isPhoto){decorations.clip.position.x=T.MathUtils.smoothstep(cardProgress,0,.12)*.55;}
 if(cardClosing&&cardProgress===0){selectedCard.position.copy(rest);decorations.clip.position.x=0;selectedCard=null;controls.enabled=true;}
}
let target=0,current=0,manualView=false;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function setTarget(n:number){if(selectedCard)return;target=n;manualView=false;}
renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','button');renderer.domElement.setAttribute('aria-label','翻开或合上手账');renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setTarget(target?0:1)}});
controls.addEventListener('start',()=>manualView=true);
function frame(p:number){const mobile=innerWidth<640;const aspect=innerWidth/innerHeight;const width=20+13*p;const height=29;const vfov=T.MathUtils.degToRad(camera.fov);const distance=Math.max(height/(2*Math.tan(vfov/2)),width/(2*Math.tan(vfov/2)*aspect))*(mobile?1.12:.88);const cx=7*(1-p);controls.target.set(cx,-1.8,0);camera.position.set(cx-5,9.4,distance);camera.lookAt(controls.target);}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!manualView)frame(current);}
window.addEventListener('resize',resize);resize();
document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{manualView=false;controls.autoRotate=false;document.querySelector('#rotate')!.setAttribute('aria-pressed','false');frame(current)};
for(const [id,scale] of [['zoom-in',.85],['zoom-out',1.18]] as const)document.querySelector<HTMLButtonElement>('#'+id)!.onclick=()=>{manualView=true;camera.position.sub(controls.target).multiplyScalar(scale).add(controls.target);controls.update()};
document.querySelector<HTMLButtonElement>('#rotate')!.onclick=(e)=>{manualView=true;controls.autoRotate=!controls.autoRotate;(e.currentTarget as HTMLElement).setAttribute('aria-pressed',String(controls.autoRotate))};
model.pages.forEach(p=>p.visible=true);
const defaultCharm=model.root.getObjectByName('charm');if(defaultCharm)defaultCharm.visible=true;
const raycaster=new T.Raycaster();let down={x:0,y:0};renderer.domElement.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener('pointermove',e=>{raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const hit=raycaster.intersectObject(model.root,true).filter(h=>{let o:T.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;})[0]?.object;hoverCard=current>.9&&(hit===receipt||hit===idCard)?hit:null;renderer.domElement.style.cursor=hoverCard?'pointer':'default';});
renderer.domElement.addEventListener('pointerleave',()=>hoverCard=null);
 renderer.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const hits=raycaster.intersectObject(model.root,true).filter(h=>{let o:T.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;}).filter(h=>h.object!==decorations.card||decorations.card.material.clippingPlanes!.every(p=>p.distanceToPoint(h.point)>=0));const hit=hits.find(h=>h.object===receipt||h.object===idCard)?.object ?? hits[0]?.object;if((hit===receipt||hit===idCard)&&current>.5){const img=dialog.querySelector('img')!;img.src=hit===receipt?innerReceipt:innerId;img.alt=hit===receipt?'实习经历账单':'ID 卡';dialog.classList.add('inner-detail');img.hidden=false;(dialog.querySelector('.blank-card') as HTMLElement).hidden=true;dialog.showModal();return;}if(selectedCard){if(cardClosing||cardProgress<1)return;if(hit===selectedCard)enlargeCard();else closeCard();return;}if(hit&&current<.05){if(hit===decorations.card||hit.name==='paperclip'||hit===receipt||hit===idCard){pullCard(decorations.card);return;}if(hit===photo||hit.name.startsWith('outer-window')){pullCard(photo);return;}}if(hit)setTarget(target?0:1)});
let last=performance.now();function animate(now:number){const dt=Math.min((now-last)/1000,.05);last=now;updateCard(dt);const next=reducedMotion?target:T.MathUtils.damp(current,target,5,dt);if(Math.abs(next-current)>.00001){current=next;decorations.inner.visible=current>.55;model.setOpenProgress(current);if(!manualView)frame(current);}model.update(now/1000,dt);controls.update();renderer.render(scene,camera);if(sceneVisible&&!document.hidden) requestAnimationFrame(animate);else animationRunning=false;}
let sceneVisible=true,animationRunning=true;
function resumeScene(){if(sceneVisible&&!document.hidden&&!animationRunning){animationRunning=true;last=performance.now();requestAnimationFrame(animate);}}
window.addEventListener('message',e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.type==='journal-visibility'){sceneVisible=Boolean(e.data.visible);resumeScene();}});
document.addEventListener('visibilitychange',resumeScene);
requestAnimationFrame(animate);
(window as any).__journal={model,scene,camera,renderer,controls,setOpen:(p:number)=>{setTarget(p);current=p;decorations.inner.visible=p>.55;model.setOpenProgress(p);manualView=false;frame(p)},stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,parts:model.root.children.length}),view:(azimuth:number)=>{manualView=true;const r=camera.position.distanceTo(controls.target);camera.position.set(controls.target.x+Math.sin(azimuth)*r,6,Math.cos(azimuth)*r);controls.update()}};
