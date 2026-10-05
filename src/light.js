// Directional, softly scattered light. Native WebGL keeps the existing Vite stack.
export function createLight(hero, reducedMotion) {
  const layer = hero.querySelector('.light');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true });
  if (!gl) return { move() {} };
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision highp float;
    varying vec2 uv;
    uniform vec2 resolution;
    uniform vec2 pointer;
    uniform float time;
    uniform float dusk;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
    float pool(vec2 q,vec2 center,vec2 scale,float seed){
      float phase=time*.46+seed*1.73;
      float breathing=.88+.12*sin(phase);
      vec2 drift=vec2(sin(phase*.72),cos(phase*.61))*.025;
      vec2 d=q-center-drift;
      vec2 r=vec2(d.x*.76+d.y*.65,-d.x*.65+d.y*.76)/(scale*vec2(breathing,1.+.14*sin(phase+.8)));
      float warp=(noise(q*4.2+vec2(seed+time*.09,time*.075))-.5)*.32;
      float outline=1.-smoothstep(.36,1.12,length(r)+warp);
      // Independent phases reveal and dissolve parts of each pool, rather than flashing the whole cluster.
      float pulse=smoothstep(-.85,.75,sin(phase));
      float strength=seed<3.?.78+.22*pulse:.25+.75*pulse;
      float aperture=.62+.38*smoothstep(.24,.74,noise(q*6.+vec2(seed-time*.12,time*.08)));
      return outline*strength*aperture;
    }
    float caustic(vec2 p){
      float aspect=resolution.x/resolution.y;
      vec2 center=vec2((.5+pointer.x)*aspect,.5+pointer.y);
      vec2 q=p-center;
      // A linked cluster of diagonal, refracted pools moves as a whole.
      float size=clamp(aspect/1.44,.65,1.12);
      q/=size;
      float a=pool(q,vec2(.08,.02),vec2(.62,.21),2.);
      float b=pool(q,vec2(-.40,-.06),vec2(.48,.12),7.);
      float c=pool(q,vec2(.24,-.37),vec2(.50,.15),13.);
      float d=pool(q,vec2(-.15,.41),vec2(.55,.14),19.);
      float e=pool(q,vec2(.55,.22),vec2(.32,.10),23.);
      return clamp(max(max(a,b),max(c,max(d,e)))+.06*a,0.,1.);
    }
    void main(){
      float aspect=resolution.x/resolution.y;
      // The pointer and the light share the same screen coordinates.
      vec2 p=vec2(uv.x*aspect,1.-uv.y);
      float focus=caustic(p);
      float red=caustic(p+vec2(.018,-.006));
      float blue=caustic(p-vec2(.018,-.006));
      vec3 sky=mix(vec3(.735,.855,.928),vec3(.56,.55,.71),dusk);
      vec3 ivory=mix(vec3(1.,.988,.953),vec3(.985,.898,.92),dusk);
      // Offset colour channels slightly, like light dispersed through glass.
      vec3 light=vec3(red,focus,blue);
      vec3 color=mix(sky,ivory,light);
      float fringe=4.*focus*(1.-focus);
      float tint=noise(p*2.8+vec2(.8,time*.012));
      float violet=fringe*smoothstep(.45,.78,tint)*.32;
      float cyan=fringe*(1.-smoothstep(.25,.55,tint))*.16;
      color=mix(color,vec3(.81,.79,.95),violet);
      color=mix(color,vec3(.75,.91,.96),cyan);
      color+=(hash(gl_FragCoord.xy)-.5)/255.;
      gl_FragColor=vec4(color,1.);
    }
    `;
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  let program;
  try {
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('Light shader link failed');
  } catch { return { move() {} }; }
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['resolution','pointer','time','dusk'].map(name=>[name,gl.getUniformLocation(program,name)]));
  layer.replaceChildren(canvas);layer.classList.add('shader-light');
  let targetX=0,targetY=0,x=0,y=0,frame=0,visible=true,dusk=0,last=0,elapsed=0;
  function draw(now){
    frame=0;
    const dt=Math.min((now-(last||now))/1000,.05);last=now;
    const smooth=1-Math.exp(-dt*24);
    x+=(targetX-x)*smooth;y+=(targetY-y)*smooth;
    dusk+=((hero.ownerDocument.body.classList.contains('dusk')?1:0)-dusk)*smooth;
    if(!reducedMotion.matches) elapsed+=dt;
    gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
    gl.uniform2f(uniforms.pointer,reducedMotion.matches?0:x,reducedMotion.matches?0:y);
    gl.uniform1f(uniforms.time,elapsed);gl.uniform1f(uniforms.dusk,dusk);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if(visible&&!document.hidden&&(!reducedMotion.matches||Math.abs((document.body.classList.contains('dusk')?1:0)-dusk)>.001)) start();
  }
  function start(){if(!frame){frame=requestAnimationFrame(draw);}}
  function resize(){const bounds=hero.getBoundingClientRect();const ratio=Math.min(devicePixelRatio,1.25);
    canvas.width=Math.round(bounds.width*ratio);canvas.height=Math.round(bounds.height*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);start();}
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();}).observe(hero);
  new MutationObserver(start).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
  reducedMotion.addEventListener('change',()=>{targetX=targetY=0;start();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;layer.classList.remove('shader-light');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  resize();
  return {move(nextX,nextY){targetX=nextX;targetY=nextY;start();}};
}
