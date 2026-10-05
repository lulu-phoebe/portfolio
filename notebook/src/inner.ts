import * as T from 'three';
import idUrl from './assets/inner-id.png';
import receiptUrl from './assets/inner-receipt.png';

// Simplified, independently modelled accessories. Units follow the 14 × 20 cm cover.
export function createInner(){
 const root=new T.Group();root.name='inner-left-content';root.visible=false;
 const cloth=new T.MeshStandardMaterial({color:'#26475e',roughness:1});
 const dark=cloth.clone();dark.color.set('#192830');
 const blue=cloth.clone();blue.color.set('#6c9dbf');
 const thread=new T.MeshStandardMaterial({color:'#e2ddd0',roughness:1});
 const metal=new T.MeshStandardMaterial({color:'#c7cbd0',metalness:1,roughness:.26});
 function mesh(parent:T.Object3D,name:string,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function tube(parent:T.Object3D,name:string,pts:T.Vector3[],radius:number,m:T.Material){return mesh(parent,name,new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.max(12,pts.length*3),radius,5,false),m);}
 function line(parent:T.Object3D,a:T.Vector3,b:T.Vector3,r=.012,m=thread){return tube(parent,'stitch',[a,b],r,m);}
 function patch(name:string,x:number,y:number,w:number,h:number,angle:number,m:T.Material,z=.45){const g=new T.Group();g.name=name;g.position.set(x,y,z);g.rotation.z=angle;root.add(g);mesh(g,name+'-fabric',new T.BoxGeometry(w,h,.065),m);for(let i=0;i<Math.floor(w/.18);i++)for(const s of [-1,1]){const xx=-w/2+.08+i*.18;line(g,new T.Vector3(xx,s*(h/2-.07),.045),new T.Vector3(xx+.09,s*(h/2-.07),.045));}return g;}
 const denim=patch('frayed-denim',.8,4,6.2,4,.17,cloth,.40);
 for(let i=0;i<28;i++)for(const s of [-1,1])line(denim,new T.Vector3(s*3.1,-1.95+i*.14,.01),new T.Vector3(s*(3.25+.12*Math.sin(i*3)),-1.91+i*.14,.025),.012,blue);
 const zip=patch('zipper-tape',-5,3.35,1.65,5.8,.11,dark,.46);
 for(let i=0;i<28;i++)for(const s of [-1,1])mesh(zip,'zipper-tooth',new T.BoxGeometry(.22,.11,.10),metal,s*.19,-2.7+i*.19,.09);
 mesh(zip,'zipper-slider',new T.BoxGeometry(.55,.64,.22),metal,0,1.9,.24);
 const pull=mesh(zip,'zipper-pull',new T.TorusGeometry(.29,.068,6,20),metal,0,1.3,.39);pull.scale.y=1.7;
 function star(parent:T.Object3D,name:string,x:number,y:number,z:number,r:number,m:T.Material,angle=0){const shape=new T.Shape();const pts:T.Vector3[]=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.47:r;const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;i?shape.lineTo(xx,yy):shape.moveTo(xx,yy);pts.push(new T.Vector3(xx*.89,yy*.89,.12));}shape.closePath();const g=new T.Group();g.name=name;g.position.set(x,y,z);g.rotation.z=angle;parent.add(g);mesh(g,name+'-body',new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}),m);for(let i=0;i<10;i++)for(let t=0;t<1;t+=.2)line(g,pts[i].clone().lerp(pts[(i+1)%10],t),pts[i].clone().lerp(pts[(i+1)%10],t+.1),.013);return g;}
 for(let i=0;i<17;i++){const t=i/16;const ring=mesh(root,'chain-link',new T.TorusGeometry(.075,.023,5,10),metal,-4.6+t*1.7,4.4-t*1.8,.69);ring.rotation.y=i%2?.7:0;}
 star(root,'metal-star-one',-3.5,3.05,.7,.38,metal,.2);star(root,'metal-star-two',-2.9,2.25,.72,.46,metal,-.1);
 // Lace is an actual repeated open-loop mesh beneath the ID card.
 for(let i=0;i<19;i++){const a=i/18*Math.PI;const loop=mesh(root,'lace-scallop',new T.TorusGeometry(.32,.027,5,18),thread,2.8+1.35*Math.cos(a),1.2-.9*Math.sin(a),.53);loop.scale.y=1.3;}
 function card(name:string,url:string,w:number,h:number,x:number,y:number,z:number,angle:number){const tex=new T.TextureLoader().load(url);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;const face=new T.MeshBasicMaterial({map:tex,toneMapped:false});const edge=new T.MeshStandardMaterial({color:'#ece3ce',roughness:1});const o=new T.Mesh(new T.BoxGeometry(w,h,.045),[edge,edge,edge,edge,face,edge]);o.name=name;o.position.set(x,y,z);o.rotation.z=angle;o.userData.baseRotZ=angle;o.castShadow=true;root.add(o);return o;}
 card('internship-receipt',receiptUrl,8.6,12.9,-1.4,-2.05,.70,.105);
 card('artist-id-card',idUrl,7.05,4.70,2.45,4.12,.86,-.15);
 // Woven gingham on a curved ribbon solid, rather than a flat bow picture.
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#f1eee6';ctx.fillRect(0,0,128,128);for(let i=0;i<8;i++){ctx.fillStyle='#4473a280';ctx.fillRect(i*16,0,8,128);ctx.fillRect(0,i*16,128,8);}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;
 const ribbonMat=new T.MeshStandardMaterial({map:tex,roughness:.9,side:T.DoubleSide});
 const bow=new T.Group();bow.name='gingham-bow';bow.position.set(4.35,6.8,1.02);bow.rotation.z=-.12;root.add(bow);
 function ribbon(name:string,points:number[][],width:number){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],p[2])));const geo=new T.PlaneGeometry(width,1,8,40);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const u=pos.getX(i)/width+.5,t=pos.getY(i)+.5,p=curve.getPoint(t),d=curve.getTangent(t);const side=new T.Vector3(-d.y,d.x,0).normalize();p.addScaledVector(side,(u-.5)*width);p.z+=Math.sin(u*Math.PI)*.08;pos.setXYZ(i,p.x,p.y,p.z);}geo.computeVertexNormals();mesh(bow,name,geo,ribbonMat);}
 ribbon('bow-left-loop',[[0,0,0],[-1.3,.75,.25],[-1.6,.15,.4],[0,0,.12]],.72);
 ribbon('bow-right-loop',[[0,0,.1],[1.2,.62,.35],[1.3,-.12,.25],[0,0,0]],.72);
 ribbon('bow-left-tail',[[0,0,0],[-.8,-.55,.1],[-1.65,-.9,.05]],.55);
 ribbon('bow-right-tail',[[0,0,.08],[.65,-.8,.2],[1.1,-1.9,.04]],.62);
 const knot=mesh(bow,'bow-knot',new T.SphereGeometry(.27,16,10),ribbonMat,0,0,.23);knot.scale.set(1,1.3,.8);
 const label=patch('creative-club-label',4.5,-.9,2.6,1.25,.02,cloth,.50);
 const lc=document.createElement('canvas');lc.width=512;lc.height=192;const l=lc.getContext('2d')!;l.fillStyle='#203c50';l.fillRect(0,0,512,192);l.textAlign='center';l.fillStyle='#fff7e2';l.font='bold 57px Georgia';l.fillText('CREATIVE',256,85);l.fillText('CLUB',256,147);const lt=new T.CanvasTexture(lc);lt.colorSpace=T.SRGBColorSpace;mesh(label,'embroidered-label-text',new T.PlaneGeometry(2.38,1),new T.MeshBasicMaterial({map:lt,toneMapped:false}),0,0,.06);
 star(root,'dark-denim-star',4.45,-4.6,.47,1.45,dark,-.25);star(root,'blue-denim-star',4.3,-6.6,.59,1.1,blue,.22);
 const button=new T.Group();button.name='four-hole-button';button.position.set(3.3,-8.2,.87);root.add(button);const disk=mesh(button,'button-body',new T.CylinderGeometry(.47,.47,.16,28),blue);disk.rotation.x=Math.PI/2;mesh(button,'button-rim',new T.TorusGeometry(.40,.045,6,28),blue,0,0,.10);for(const x of [-.12,.12])for(const y of [-.12,.12])mesh(button,'button-hole',new T.CircleGeometry(.063,12),dark,x,y,.091);
 return root;
}
