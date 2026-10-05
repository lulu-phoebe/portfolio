import * as T from 'three';
import type { JournalModel, JournalOptions } from './types';
import portfolioUrl from './assets/portfolio.png';
import characterIdUrl from './assets/character-id.jpg';
import artistCardUrl from './assets/artist-card.jpg';

export function createJournalModel(options: Partial<JournalOptions> = {}): JournalModel {
 const requested={width:14,height:20,spineWidth:1.6,leatherColor:'#851c25',blankPageCount:4,...options};
 const o={...requested,width:14,height:20,spineWidth:1.6,blankPageCount:Math.max(0,Math.min(20,Math.round(requested.blankPageCount)))};
 const root=new T.Group();root.name='root';root.scale.set(Math.max(.01,requested.width)/14,Math.max(.01,requested.height)/20,Math.max(.01,requested.spineWidth)/1.6);
 const geometries=new Set<T.BufferGeometry>();const materials=new Set<T.Material>();
 const M=(p:T.MeshPhysicalMaterialParameters)=>{const m=new T.MeshPhysicalMaterial(p);materials.add(m);return m};
 const leather=M({color:o.leatherColor,roughness:.5,clearcoat:.13,clearcoatRoughness:.6});
 const lining=M({color:'#741c24',roughness:.64});
 const edge=M({color:'#55151e',roughness:.48});
 const thread=M({color:'#b17b6c',roughness:.84});
 const metal=M({color:'#c5cbd1',metalness:1,roughness:.17,envMapIntensity:1.3});
 const darkMetal=M({color:'#62666c',metalness:1,roughness:.27});
 const clear=M({color:'#ffffff',roughness:.1,metalness:.04,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide});
 const wingMat=M({color:'#f7f6f3',roughness:.25,transparent:true,opacity:.76,depthWrite:false,side:T.DoubleSide});
 const paper=M({color:'#f4f3ed',roughness:.9,side:T.DoubleSide});
 const black=M({color:'#211c1f',roughness:.9});
 const textures:T.Texture[]=[];
 function grainTexture(channel:'height'|'roughness'|'albedo'){
  const size=1024,data=new Uint8Array(size*size*4);
  const hash=(x:number,y:number)=>{let n=Math.imul(x+137,y+179)^Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const nx=x/12,ny=y/12,ix=Math.floor(nx),iy=Math.floor(ny);let d1=9,d2=9;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=ix+dx,yy=iy+dy;const d=Math.hypot(nx-xx-hash(xx,yy)*.75,ny-yy-hash(yy+71,xx)*.75);if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d;}
   const pore=Math.min(1,(d2-d1)*4);const fine=hash(x,y);
   const mx=x/90,my=y/90,fx=mx-Math.floor(mx),fy=my-Math.floor(my);const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
   const n0=T.MathUtils.lerp(hash(Math.floor(mx),Math.floor(my)),hash(Math.floor(mx)+1,Math.floor(my)),sx);
   const n1=T.MathUtils.lerp(hash(Math.floor(mx),Math.floor(my)+1),hash(Math.floor(mx)+1,Math.floor(my)+1),sx);
   const broad=T.MathUtils.lerp(n0,n1,sy);
   const v=channel==='height'?90+70*pore+fine*12:channel==='roughness'?140+hash(ix+31,iy+97)*23+fine*5:246+broad*5+fine*3;
   const k=(y*size+x)*4;data[k]=data[k+1]=data[k+2]=Math.round(v);data[k+3]=255;
  }
  const tex=new T.DataTexture(data,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(.12,.12);tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.anisotropy=4;if(channel==='albedo')tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;textures.push(tex);return tex;
 }
 const heightMap=grainTexture('height'),roughMap=grainTexture('roughness'),albedoMap=grainTexture('albedo');
 for(const material of [leather,lining]){material.map=albedoMap;material.bumpMap=heightMap;material.bumpScale=.022;material.roughnessMap=roughMap;material.roughness=.94;}
 function group(parent:T.Object3D,name:string,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
 function mesh(parent:T.Object3D,name:string,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){geometries.add(g);const obj=new T.Mesh(g,m);obj.name=name;obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;}
 function shape(w:number,h:number,r:number){const s=new T.Shape();const x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 function solid(s:T.Shape,depth:number,bevel=.025){const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:12});g.translate(0,0,-depth/2);return g;}
 function panel(parent:T.Object3D,name:string,w:number,h:number,d:number,x:number,y:number,z:number,mat=leather,r=.14){return mesh(parent,name,solid(shape(w,h,r),d,Math.min(.025,d*.2)),mat,x,y,z);}
 function tube(parent:T.Object3D,name:string,pts:T.Vector3[],radius:number,mat:T.Material,closed=false){const curve=new T.CatmullRomCurve3(pts,closed,'centripetal');return mesh(parent,name,new T.TubeGeometry(curve,Math.max(24,pts.length*2),radius,6,closed),mat);}
 function pathPoints(w:number,h:number,r:number,x:number,y:number,z:number){return shape(w,h,r).getPoints(16).map(p=>new T.Vector3(p.x+x,p.y+y,z));}
 const stitchGeo=new T.CapsuleGeometry(.016,.105,2,4);stitchGeo.rotateZ(-Math.PI/3);geometries.add(stitchGeo);
 function stitches(parent:T.Object3D,name:string,points:T.Vector3[],spacing=.24){const transforms:T.Matrix4[]=[];const dummy=new T.Object3D();for(let j=1;j<points.length;j++){const d=points[j].clone().sub(points[j-1]);const length=d.length();const n=Math.max(1,Math.round(length/spacing));for(let i=0;i<n;i++){dummy.position.copy(points[j-1]).addScaledVector(d,(i+.5)/n);dummy.rotation.set(0,0,Math.atan2(d.y,d.x));dummy.updateMatrix();transforms.push(dummy.matrix.clone());}}
  const inst=new T.InstancedMesh(stitchGeo,thread,transforms.length);inst.name=name;inst.userData.explodeWithParent=true;transforms.forEach((m,i)=>inst.setMatrixAt(i,m));inst.castShadow=true;parent.add(inst);return inst;
 }
 function border(parent:T.Object3D,w:number,h:number,x:number,y:number,z:number,name:string){tube(parent,name+'-edge',pathPoints(w,h,.16,x,y,z-.015),.019,edge);stitches(parent,name,pathPoints(w-.2,h-.2,.14,x,y,z));}
 function frame(parent:T.Object3D,name:string,w:number,h:number,x:number,y:number,z:number,outer=false){const g=group(parent,name,x,y,z);if(outer)g.rotation.y=Math.PI;
  const outline=shape(w,h,.18);outline.holes.push(new T.Path(shape(w-1,h-1,.15).getPoints(16)));
  mesh(g,name+'-frame',solid(outline,.10,.024),leather);panel(g,name+'-film',w-.86,h-.86,.018,0,0,.01,clear,.13).castShadow=false;
  panel(g,name+'-backing',w-.65,h-.65,.025,0,0,-.062,lining,.12);border(g,w-.22,h-.22,0,0,.09,name+'-stitches');
  const reflection=M({color:'#f6f9ff',transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide,roughness:.12});
  const refl=new T.Shape();refl.moveTo(w/2-.63,-h/2+.55);refl.quadraticCurveTo(w/2-.42,-h/2+1.8,w/2-.5,h/2-.6);refl.lineTo(w/2-.58,h/2-.6);refl.quadraticCurveTo(w/2-.71,-h/2+1.6,w/2-1.15,-h/2+.55);
  mesh(g,name+'-reflection',new T.ShapeGeometry(refl),reflection,0,0,.037).castShadow=false;
  return g;
 }
 const frontHinge=group(root,'front-hinge',-.8);const front=group(frontHinge,'front-cover',-o.width/2);
 panel(front,'front-leather-shell',o.width,o.height,.22,0,0,0);panel(front,'front-inner-lining',13.72,19.7,.025,0,0,.14,lining);
 border(front,13.48,19.48,0,0,.18,'edge-stitches');border(front,13.48,19.48,0,0,-.16,'outer-stitches');
 const back=group(root,'back-cover',.8+o.width/2);panel(back,'back-leather-shell',o.width,o.height,.22,0,0,0);panel(back,'back-inner-lining',13.72,19.7,.025,0,0,.14,lining);border(back,13.48,19.48,0,0,.18,'back-stitches');
 const spine=group(root,'spine');const spineGeo=new T.PlaneGeometry(1.6,20,24,1);const spineMesh=mesh(spine,'spine-leather',spineGeo,lining);spineMesh.material=lining.clone();materials.add(spineMesh.material);spineMesh.material.side=T.DoubleSide;
 const leftSlot=group(front,'left-slot',-.2,6.6,.23);panel(leftSlot,'upper-pocket',11.6,4.7,.09,0,0,0,leather,.55);
 panel(leftSlot,'slit',8.8,.22,.016,0,-.25,.066,black,.10);
 stitches(leftSlot,'left-slot-stitches',pathPoints(11.05,4.16,.45,0,0,.09));
 frame(front,'left-window',11.5,12.45,-.2,-2.6,.24);
 const slot1=group(back,'right-slot-upper',0,6.8,.22);panel(slot1,'upper-slot-panel',11.8,5.0,.085,0,0,0);
 stitches(slot1,'upper-slot-bottom',[new T.Vector3(-5.65,-2.25,.08),new T.Vector3(5.65,-2.25,.08)]);
 const slot2=group(back,'right-slot-lower',0,3.4,.24);panel(slot2,'lower-slot-panel',11.8,2.0,.08,0,0,0);
 stitches(slot2,'lower-slot-bottom',[new T.Vector3(-5.65,-.78,.08),new T.Vector3(5.65,-.78,.08)]);
 frame(back,'right-window',11.8,7.9,0,-5.15,.25);
 stitches(back,'pocket-stitches',[new T.Vector3(-5.7,-.6,.31),new T.Vector3(5.7,-.6,.31)]);
 panel(front,'outer-lower-panel',13.55,12.25,.055,0,-3.53,-.17,leather,.12);
 stitches(front,'outer-horizontal-seam-left',[new T.Vector3(-6.5,2.65,-.225),new T.Vector3(-4.92,2.65,-.225)]);
 stitches(front,'outer-horizontal-seam-right',[new T.Vector3(.52,2.65,-.225),new T.Vector3(6.5,2.65,-.225)]);
 frame(front,'outer-window',4.6,6.65,3.85,-5.1,-.25,true);
 const portfolioMap=new T.TextureLoader().load(portfolioUrl);
 portfolioMap.colorSpace=T.SRGBColorSpace;portfolioMap.anisotropy=8;textures.push(portfolioMap);
 const portfolioMaterial=M({map:portfolioMap,transparent:true,alphaTest:.08,roughness:.88,depthWrite:true});
 const portfolio=mesh(front,'portfolio-cover-art',new T.PlaneGeometry(10.2,10.2*815/1485),portfolioMaterial,0,6.1,-.20);
 portfolio.rotation.y=Math.PI;portfolio.castShadow=false;
 const idMap=new T.TextureLoader().load(characterIdUrl);idMap.colorSpace=T.SRGBColorSpace;idMap.anisotropy=8;textures.push(idMap);
 const idMat=new T.MeshBasicMaterial({map:idMap,toneMapped:false});materials.add(idMat);
 const idPhoto=mesh(front,'character-id-photo',new T.PlaneGeometry(3.72,5.38),idMat,3.85,-5.1,-.24);
 idPhoto.rotation.y=Math.PI;idPhoto.castShadow=false;
 const tab=group(back,'side-tab',8.35,4.3);panel(tab,'tab-leather',3.9,2.55,.16,0,0,0,leather,.12);border(tab,3.44,2.12,0,0,.12,'tab-stitch');
 const rail=group(root,'ring-rail',0,0,.38);panel(rail,'rail-base',1.48,18.6,.19,0,0,0,metal,.22);
 const rings=group(rail,'ring-loops');const ys=[-7.5,-4.8,-2.1,2.1,4.8,7.5];
 for(const [i,y] of ys.entries()){
  const points:T.Vector3[]=[];for(let j=0;j<=40;j++){const a=Math.PI*j/40;points.push(new T.Vector3(-1.07*Math.cos(a),y,.15+1.20*Math.sin(a)));}
  tube(rings,`binder-ring-${i+1}`,points,.073,metal);
  for(const x of [-.69,.69])panel(rings,`ring-seat-${i}-${x}`, .26,.36,.18,x,y,.11,metal,.08);
 }
 const rivets=group(rail,'rail-rivets');for(const y of [-8.35,8.35]){
  const rivet=mesh(rivets,'rail-fastener-'+y,new T.CylinderGeometry(.23,.23,.065,24),metal,0,y,.145);rivet.rotation.x=Math.PI/2;
  mesh(rivets,'fastener-rim-'+y,new T.TorusGeometry(.15,.026,6,28),darkMetal,0,y,.185);
  const lever=panel(rail,'release-lever-'+y,1.15,.53,.14,0,Math.sign(y)*9.04,.16,metal,.14);lever.rotation.x=-Math.sign(y)*.18;
 }
 const pages:T.Group[]=[];const contentAnchors=new Map<string,T.Object3D>();const pageStack=group(root,'page-stack');
 for(let i=0;i<o.blankPageCount;i++){
  const page=group(pageStack,`page-${i+1}`,0,0,.66+i*.055);page.visible=false;
  const s=shape(12.1,18.3,.1);for(const y of ys){const hole=new T.Path();hole.absarc(-5.5,y,.17,0,Math.PI*2,true);s.holes.push(hole);}
  mesh(page,'paper-'+(i+1),solid(s,.025,.002),paper,6.52,0,0);pages.push(page);
  const anchor=group(page,`content-page-${i+1}`,6.7,0,.035);contentAnchors.set(`page-${i+1}`,anchor);
 }
 const artistMap=new T.TextureLoader().load(artistCardUrl);artistMap.colorSpace=T.SRGBColorSpace;artistMap.anisotropy=8;textures.push(artistMap);
 const artistMat=M({map:artistMap,roughness:.88});
 const artistCard=mesh(pageStack.children[0],'artist-profile-card',new T.PlaneGeometry(10.6,6.7),artistMat,6.52,1.4,.08);artistCard.castShadow=false;
 for(const [id,parent,x,y,z] of [['left-pocket',front,-.2,-2.6,.30],['right-pocket',back,0,-5.15,.32],['outer-pocket',front,3.85,-5.1,-.29]] as const){contentAnchors.set(id,group(parent,'content-'+id,x,y,z));}
 const charm=group(front,'charm',6.45,9.35,-.48);
 const clasp=group(charm,'charm-clasp');mesh(clasp,'cover-eyelet',new T.TorusGeometry(.20,.06,8,24),metal);
 tube(clasp,'clasp-frame',[new T.Vector3(0,0,0),new T.Vector3(-.28,-.22,0),new T.Vector3(-.28,-1.2,0),new T.Vector3(0,-1.42,0),new T.Vector3(.28,-1.2,0),new T.Vector3(.28,-.22,0)],.045,metal,true);
 panel(clasp,'clasp-gate',.49,.31,.12,0,-1.12,0,metal,.04);mesh(clasp,'split-ring',new T.TorusGeometry(.39,.055,7,28),metal,0,-1.8,0);
 const chainGroup=group(charm,'charm-chains');const starGroup=group(charm,'charm-stars');
 function starShape(r:number){const s=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5;const radius=i%2?r*.46:r;const x=Math.cos(a)*radius,y=Math.sin(a)*radius;if(i)s.lineTo(x,y);else s.moveTo(x,y);}s.closePath();return s;}
 const starGeometry=solid(starShape(.34),.065,.035);geometries.add(starGeometry);
 const chainGeo=new T.TorusGeometry(.10,.023,5,12);chainGeo.scale(.74,1.3,1);geometries.add(chainGeo);
 const links:T.Matrix4[]=[];const stars:T.Matrix4[]=[];const dummy=new T.Object3D();
 for(let strand=0;strand<3;strand++){const count=[34,42,31][strand];for(let j=0;j<count;j++){
  const t=j/(count-1);const x=(strand-1)*(.1+1.2*t)+.18*Math.sin(t*4+strand);const y=-2.13-j*.205;const z=.09*Math.sin(t*5+strand);
  dummy.position.set(x,y,z);dummy.rotation.set(0,j%2?Math.PI/2:0,.15*Math.sin(j*.9));dummy.scale.set(1,1,1);dummy.updateMatrix();links.push(dummy.matrix.clone());
  if(j>2&&j%4===0){dummy.position.x+=(j%8===0?-.23:.23);dummy.rotation.set(.15*Math.sin(j),.3*Math.sin(j*2),j*1.83);dummy.scale.setScalar(.84+.15*Math.sin(j));dummy.updateMatrix();stars.push(dummy.matrix.clone());}
 }}
 const chainMesh=new T.InstancedMesh(chainGeo,metal,links.length);chainMesh.name='silver-chain-links';links.forEach((m,i)=>chainMesh.setMatrixAt(i,m));chainMesh.castShadow=true;chainGroup.add(chainMesh);
 const starsMesh=new T.InstancedMesh(starGeometry,metal,stars.length);starsMesh.name='silver-stars';stars.forEach((m,i)=>starsMesh.setMatrixAt(i,m));starsMesh.castShadow=true;starGroup.add(starsMesh);
 const wing=group(charm,'charm-wing',1.2,-4.4,-.15);
 const feather=new T.Shape();feather.moveTo(-1.25,.62);feather.bezierCurveTo(-.5,.9,.45,1.38,1.5,1.64);feather.bezierCurveTo(2.15,1.9,2.35,1.15,1.92,.73);feather.bezierCurveTo(2.29,.32,1.85,-.25,1.35,-.2);feather.bezierCurveTo(1.50,-.88,.62,-1.0,.32,-.49);feather.bezierCurveTo(-.17,-1.37,-1.15,-1.24,-1.59,-.71);feather.bezierCurveTo(-2.13,-.05,-1.80,.47,-1.25,.62);feather.closePath();
 mesh(wing,'wing-pendant',solid(feather,.075,.035),wingMat);
 const white=M({color:'#ffffff',roughness:.4,transparent:true,opacity:.65,side:T.DoubleSide});
 const spiral:T.Vector3[]=[];for(let i=0;i<=48;i++){const t=i/48;const a=t*Math.PI*3;const r=.71*(1-t)+.06;spiral.push(new T.Vector3(-.68+Math.cos(a)*r,-.2+Math.sin(a)*r,-.081));}tube(wing,'wing-spiral',spiral,.065,white);
 const motifGeo=new T.ShapeGeometry(starShape(.12));for(const [i,p] of [[.1,.48],[.6,.75],[1.25,1.12],[1.7,1.18],[1.35,.48],[.7,.17],[.15,-.12],[1.3,-.25]].entries())mesh(wing,'wing-star-'+i,motifGeo,white,p[0],p[1],-.08);
 tube(charm,'wing-connector',[new T.Vector3(0,-2.1,0),new T.Vector3(.38,-2.7,-.10),new T.Vector3(.05,-3.82,-.15)],.033,metal);
 let openness=0,explode=0,lastOpen=0,swing=0,swingVelocity=0;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const rest=new Map<T.Object3D,T.Vector3>();root.traverse(n=>{if(n instanceof T.Group)rest.set(n,n.position.clone())});
 function setOpenProgress(p:number){openness=T.MathUtils.clamp(p,0,1);const close=1-openness;frontHinge.position.set(-.8+1.6*close,0,2.4*close);frontHinge.rotation.y=Math.PI*close;rail.position.x=2*close;pages.forEach(p=>p.position.x=2*close);
  const attr=spineGeo.attributes.position;for(let i=0;i<attr.count;i++){const t=(i%25)/24;const openX=-.8+1.6*t;const closedX=.8-1.17*Math.sin(Math.PI*t);attr.setXYZ(i,T.MathUtils.lerp(openX,closedX,close),i<25?10:-10,2.4*(1-t)*close-.03);}attr.needsUpdate=true;spineGeo.computeVertexNormals();spineGeo.computeBoundingSphere();
 }
 function setExplodeProgress(p:number){explode=T.MathUtils.clamp(p,0,1);for(const [node,pos] of rest){if(node===frontHinge||node===root)continue;node.position.copy(pos).multiplyScalar(1+explode*.4);}setOpenProgress(openness);}
 setOpenProgress(0);
 root.userData.sculptRuntime={parts:()=>{const parts:string[]=[];root.traverse(n=>{if(n instanceof T.Mesh)parts.push(n.name)});return parts;},contentAnchors,frontHinge,open:()=>openness,explode:()=>explode,colliders:{frontCover:{type:'box',dimensions:[14,20,.24]},backCover:{type:'box',dimensions:[14,20,.24]}},sockets:{charmMount:charm.position.toArray()},approximation:'Procedural geometry and hand-tuned leather; no photo-exact claim'};
 return {root,frontHinge,pages,contentAnchors,setOpenProgress,setExplodeProgress,update(time,delta){const change=openness-lastOpen;lastOpen=openness;if(reducedMotion)return;swingVelocity+=change*.85;swingVelocity+=(-swing*18-swingVelocity*5)*delta;swing+=swingVelocity*delta;charm.rotation.z=T.MathUtils.clamp(swing,-.09,.09)+.004*Math.sin(time*1.2);},dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}};
}
