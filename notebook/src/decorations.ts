import * as T from 'three';
import contactCardUrl from './assets/contact-card.jpg';
import idCardUrl from './assets/inner-id.png';
import receiptUrl from './assets/inner-receipt.png';
import { createInner } from './inner';

export function decorateCover(root:T.Group) {
 const front=root.getObjectByName('front-cover')!;
 const decor=new T.Group();decor.name='cover-decorations';decor.rotation.y=Math.PI;decor.position.z=-.24;front.add(decor);
 const weaveData=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4,v=150+45*Math.sin(x*Math.PI/2)+18*Math.sin(y*Math.PI);weaveData[k]=weaveData[k+1]=weaveData[k+2]=v;weaveData[k+3]=255;}
 const weave=new T.DataTexture(weaveData,128,128);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(1,5);weave.needsUpdate=true;
 const blue=new T.MeshPhysicalMaterial({color:'#39668e',roughness:.88,metalness:0,sheen:.45,sheenRoughness:.9,sheenColor:new T.Color('#7995af'),specularIntensity:.18,anisotropy:.08,bumpMap:weave,bumpScale:.024,side:T.DoubleSide});
 const silver=new T.MeshPhysicalMaterial({color:'#e6e9ed',metalness:1,roughness:.14,envMapIntensity:2,clearcoat:.4});
 function add(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=.06){const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;decor.add(mesh);return mesh;}
 function wire(points:number[][],r=.035){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),64,r,8,false),silver);}
 function ribbon(points:number[][],width=.32){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  const steps=80,across=8,stride=(across+1)*2;
  for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),side=new T.Vector3(-d.y,d.x,0).normalize();side.applyAxisAngle(d,.24*Math.sin(t*Math.PI*2));const normal=new T.Vector3().crossVectors(d,side).normalize();for(let layer=0;layer<2;layer++)for(let j=0;j<=across;j++){const u=j/across,v=p.clone().addScaledVector(side,(u-.5)*width).addScaledVector(normal,Math.sin(u*Math.PI)*.065+(layer===0?.024:-.024));vertices.push(v.x,v.y,v.z);uv.push(u,t);}}
  for(let i=0;i<steps;i++){for(let layer=0;layer<2;layer++)for(let j=0;j<across;j++){const a=i*stride+layer*(across+1)+j,b=a+stride;indices.push(a,b,a+1,a+1,b,b+1);}for(const j of [0,across]){const a=i*stride+j,b=a+across+1;indices.push(a,b,a+stride,b,b+stride,a+stride);}}
  for(const i of [0,steps])for(let j=0;j<across;j++){const a=i*stride+j,b=a+across+1;indices.push(a,a+1,b,a+1,b+1,b);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=add(geo,blue);mesh.name='satin-ribbon';mesh.receiveShadow=true;return mesh;
 }
 // Embroidered label with transparent surroundings; no white source-image border.
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=224;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#255b89';ctx.fillRect(0,0,768,224);ctx.strokeStyle='#89abc4';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.strokeRect(12,12,744,200);
 ctx.fillStyle='#f0f0df';ctx.textAlign='center';ctx.font='bold 43px Arial';ctx.fillText('shijunyan | 2026',384,100);ctx.font='22px Arial';ctx.fillText('CALL 555-12335',384,150);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const label=add(new T.PlaneGeometry(5.25,1.53),new T.MeshStandardMaterial({map:texture,roughness:.95}),2.7,.35,.045);label.name='blue-fabric-label';
 for(const [x,y,r,color] of [[4.2,4.45,.65,'#232833'],[5.5,5.25,.38,'#c6dcec']] as const){const s=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();add(new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:2,steps:1}),new T.MeshStandardMaterial({color,metalness:.3,roughness:.5}),x,y,.08);}
 // A complete card lives behind the lower leather panel; only its top projects from the seam.
 const pocketPlane=new T.Plane();
 const contactMap=new T.TextureLoader().load(contactCardUrl);contactMap.colorSpace=T.SRGBColorSpace;contactMap.anisotropy=8;
 const inner=createInner(); front.add(inner);
 const card=add(new T.BoxGeometry(5.1,4.5,.024),new T.MeshStandardMaterial({map:contactMap,roughness:.9,clippingPlanes:[pocketPlane],clipShadows:true}),2.2,.85,.12);card.name='pullout-contact-card';card.userData.card='contact';
 card.rotation.z=-Math.PI/24;
 const clip=wire([[4.35,2.6,-.11],[4.35,3.24,-.11],[4.41,3.39,-.04],[4.58,3.43,.12],[4.76,3.34,.15],[4.79,3.19,.15],[4.79,2.43,.15],[4.72,2.26,.15],[4.50,2.22,.15],[4.32,2.31,.15],[4.29,2.46,.15],[4.29,3.18,.15],[4.35,3.29,.15],[4.48,3.30,.15],[4.59,3.21,.15],[4.60,2.55,.15]],.045);clip.name='paperclip';
 const rows=[-1.45,-3.05,-4.65,-6.25];
 for(const y of rows)for(const x of [1.45,4.6])add(new T.TorusGeometry(.15,.038,8,24),silver,x,y,.09);
 for(let i=0;i<3;i++){const y=rows[i],next=rows[i+1];ribbon([[1.45,y,.13],[1.7,y-.2,.25],[2.9,(y+next)/2,.48],[4.35,next+.15,.23],[4.6,next,.14]]);ribbon([[4.6,y,.14],[4.3,y-.18,.23],[2.9,(y+next)/2,.27],[1.65,next+.18,.23],[1.45,next,.14]]);}
 ribbon([[2.9,-6.85,.38],[4.45,-6.8,.70],[4.5,-7.5,.48],[2.9,-6.85,.3]],.38);
 ribbon([[2.9,-6.85,.3],[1.35,-6.9,.65],[1.2,-7.65,.48],[2.9,-6.85,.38]],.38);
 const knot=add(new T.SphereGeometry(.24,20,12),blue,2.9,-6.85,.49);knot.scale.set(1,.8,.8);
 ribbon([[2.9,-6.85,.3],[3.3,-7.9,.45],[3.55,-9.0,.15]],.36);ribbon([[2.9,-6.85,.3],[2.1,-7.8,.5],[1.25,-8.45,.18]],.36);
 return {card,clip,inner,update(){decor.updateWorldMatrix(true,false);pocketPlane.set(new T.Vector3(0,1,0),-2.65).applyMatrix4(decor.matrixWorld);},dispose(){decor.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();const m=n.material as T.Material;m.dispose();}});texture.dispose();weave.dispose();contactMap.dispose();}};
}
