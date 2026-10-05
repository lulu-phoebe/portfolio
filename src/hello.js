import * as THREE from 'three';
import geometryUrl from './assets/hello.bin?url';
import normalUrl from './assets/hello-normal.png?url';

export async function createHello(hero, reducedMotion) {
  const stage=hero.querySelector('.stage');
  let renderer;
  try {
    const data=await (await fetch(geometryUrl)).arrayBuffer();
    const header=new DataView(data);const count=header.getUint32(0,true),indices=header.getUint32(4,true);
    const smoothGeometry=new THREE.BufferGeometry();
    smoothGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(data,32,count),3));
    smoothGeometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(data,32+count*4,count),3));
    smoothGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(data,32+count*8,indices),1));
    const size=new THREE.Vector3(header.getFloat32(8,true),header.getFloat32(12,true),header.getFloat32(16,true));
    const opticalNormal=await new THREE.TextureLoader().loadAsync(normalUrl);
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setClearColor(0x000000,0);
    renderer.domElement.className='hello-webgl';renderer.domElement.setAttribute('aria-hidden','true');
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(32,1,.1,2000);camera.position.z=450;
    const lightCanvas=hero.querySelector('.light canvas');
    const fallback=document.createElement('canvas');fallback.width=fallback.height=2;
    const ctx=fallback.getContext('2d');ctx.fillStyle='#c4e2ef';ctx.fillRect(0,0,2,2);
    const background=new THREE.CanvasTexture(lightCanvas||fallback);
    background.minFilter=THREE.LinearFilter;background.magFilter=THREE.LinearFilter;
    background.generateMipmaps=false;
    const uniforms={
      backdrop:{value:background},screen:{value:new THREE.Vector2()},
      heroRect:{value:new THREE.Vector4()},canvasRect:{value:new THREE.Vector4()},
      clock:{value:0},dusk:{value:0},opticalNormal:{value:opticalNormal},wordSize:{value:new THREE.Vector2(size.x,size.y)},viewNormal:{value:new THREE.Matrix3()}
    };
    const material=new THREE.ShaderMaterial({uniforms,transparent:true,
      vertexShader:`varying vec3 vNormal;varying vec3 vEye;varying vec3 vLocal;
        void main(){vec4 view=modelViewMatrix*vec4(position,1.);
          vNormal=normalize(normalMatrix*normal);vEye=normalize(-view.xyz);vLocal=position;
          gl_Position=projectionMatrix*view;}`,
      fragmentShader:`precision highp float;
        uniform sampler2D backdrop;uniform vec2 screen;uniform sampler2D opticalNormal;uniform vec2 wordSize;uniform mat3 viewNormal;
        uniform vec4 heroRect;uniform vec4 canvasRect;uniform float clock;uniform float dusk;
        varying vec3 vNormal;varying vec3 vEye;varying vec3 vLocal;
        vec3 studio(vec3 r){
          vec3 sky=mix(vec3(.69,.83,.97),vec3(.26,.47,.81),smoothstep(-.7,.8,r.y));
          float window=exp(-pow((r.x+.30)/.32,2.)-pow((r.y-.55)/.12,2.));
          float strip=exp(-pow((r.x-.64)/.055,2.)-pow((r.y-.1)/.65,2.));
          return sky+window*vec3(1.2,1.18,1.1)+strip*1.4;
        }
        void main(){
          vec3 n=normalize(vNormal),eye=normalize(vEye);
          // A softly curved optical face complements the rounded geometry.
          vec3 rounded=texture2D(opticalNormal,vLocal.xy/wordSize+.5).rgb*2.-1.;
          if(vLocal.z>9.9){n=normalize(viewNormal*rounded);}
          float fresnel=pow(1.-max(dot(n,eye),0.),3.2);
          vec2 local=vec2(gl_FragCoord.x/screen.x,1.-gl_FragCoord.y/screen.y);
          vec2 uv=(canvasRect.xy+local*canvasRect.zw-heroRect.xy)/heroRect.zw;
          uv.y=1.-uv.y;
          vec2 bend=n.xy*vec2(.046,-.046)*(1.+fresnel);
          vec3 refracted=vec3(texture2D(backdrop,clamp(uv+bend*1.15,.001,.999)).r,
            texture2D(backdrop,clamp(uv+bend,.001,.999)).g,
            texture2D(backdrop,clamp(uv+bend*.83,.001,.999)).b);
          vec3 glass=mix(refracted,vec3(.34,.59,.90),.28+.18*smoothstep(0.,.75,vLocal.y/65.));
          vec3 reflection=studio(reflect(-eye,n));
          glass=mix(glass,reflection,.12+fresnel*.48);
          vec3 lamp=normalize(vec3(-.55,.85,1.));
          float spec=pow(max(dot(n,normalize(lamp+eye)),0.),110.);
          float edgeLight=pow(max(dot(n,normalize(vec3(.9,.2,.65)+eye)),0.),180.);
          glass+=spec*.42+edgeLight*.35;
          // Localised iridescence, strongest on turning surfaces rather than the whole word.
          float fold=sin(vLocal.x*.12+vLocal.y*.18+n.x*7.+clock*.1);
          vec3 spectrum=.5+.5*cos(vec3(0.,2.1,4.2)+fold*3.+n.y*6.);
          float prism=(.035+fresnel*.25)*smoothstep(.12,.55,abs(n.x));
          glass=mix(glass,spectrum*.8+.2,prism);
          glass=mix(glass,glass*vec3(1.03,.95,1.08),dusk*.4);
          gl_FragColor=vec4(glass,.97);
        }`
    });
    const word=new THREE.Mesh(smoothGeometry,material);scene.add(word);
    word.rotation.set(-.08,-.18,.10);
    stage.prepend(renderer.domElement);
    stage.classList.add('has-glass-hello');
    let targetX=0,targetY=0,x=0,y=0,frame=0,last=0,elapsed=0,visible=true,scrollTilt=0;
    function resize(){
      const rect=stage.getBoundingClientRect();const ratio=Math.min(devicePixelRatio,1.5);
      renderer.setPixelRatio(ratio);renderer.setSize(rect.width,rect.height,false);
      uniforms.screen.value.set(rect.width*ratio,rect.height*ratio);
      camera.aspect=rect.width/rect.height;
      const fit=Math.min(rect.width/size.x*(rect.width<760?.86:.68),rect.height/size.y*.64);
      const viewHeight=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      word.scale.setScalar(fit*viewHeight/rect.height);
      camera.updateProjectionMatrix();updateRects();start();
    }
    function updateRects(){const h=hero.getBoundingClientRect(),c=renderer.domElement.getBoundingClientRect();
      uniforms.heroRect.value.set(h.left,h.top,h.width,h.height);
      uniforms.canvasRect.value.set(c.left,c.top,c.width,c.height);}
    function start(){if(!frame)frame=requestAnimationFrame(draw);}
    function draw(now){frame=0;const dt=Math.min((now-(last||now))/1000,.05);last=now;
      const lerp=1-Math.exp(-dt*13);x+=(targetX-x)*lerp;y+=(targetY-y)*lerp;
      const scrollTarget=reducedMotion.matches?0:Number(hero.dataset.scrollProgress||0);
        scrollTilt+=(scrollTarget-scrollTilt)*(1-Math.exp(-dt*9));
        const tilt=scrollTilt*scrollTilt*(3-2*scrollTilt);
        word.rotation.x=-.08-y*.12-tilt*.78;
        word.rotation.y=-.18+x*.22+tilt*.42;
        word.rotation.z=.10-tilt*.14;
      word.position.x=x*4;word.position.y=-y*3;
      if(!reducedMotion.matches)elapsed+=dt;
      uniforms.clock.value=elapsed;uniforms.dusk.value=document.body.classList.contains('dusk')?1:0;
      word.updateMatrixWorld();uniforms.viewNormal.value.getNormalMatrix(word.matrixWorld);
      background.needsUpdate=true;updateRects();renderer.render(scene,camera);
      if(visible&&!document.hidden&&!reducedMotion.matches)start();
    }
    hero.addEventListener('pointermove',event=>{if(reducedMotion.matches||event.pointerType==='touch')return;
      const r=hero.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;start();});
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();}).observe(hero);
    new MutationObserver(start).observe(document.body,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
    reducedMotion.addEventListener('change',()=>{targetX=targetY=0;start();});
    renderer.domElement.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(frame);frame=0;stage.classList.remove('has-glass-hello');});
    resize();
  } catch(error){renderer?.dispose();stage.classList.remove('has-glass-hello');console.warn('3D hello unavailable; keeping SVG.',error);}
}
