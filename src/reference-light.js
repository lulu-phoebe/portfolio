// A focused light field transformed through waves, diagonal cells, and optical blur.
// The passes deliberately share a source instead of drawing a fixed set of blobs.
import { createLight as fallbackLight } from './light.js';

export function createLight(hero,reducedMotion){
  const layer=hero.querySelector('.light'),canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true});
  if(!gl)return fallbackLight(hero,reducedMotion);
  canvas.setAttribute('aria-hidden','true');
  const vertex=`attribute vec2 position;varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const common=`precision highp float;varying vec2 uv;uniform sampler2D inputImage;
    uniform vec2 resolution;uniform vec2 pointer;uniform float time;uniform float dusk;
    vec3 linear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
    vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
    vec2 randomPoint(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
    vec4 sampleImage(vec2 p){return texture2D(inputImage,clamp(p,vec2(.001),vec2(.999)));}`;
  const sources=[
    // Small warm source, with a cool surrounding field. Work in linear colour.
    `void main(){float aspect=resolution.x/resolution.y;
      vec2 delta=(uv-pointer)*vec2(aspect*.54,.46);
      float edge=smoothstep(.133,.222,length(delta));edge=mix(edge,1.,.16);
      vec3 warm=linear(mix(vec3(1.,.918,.839),vec3(.173,.294,.835),dusk));
      vec3 cool=linear(mix(vec3(.380,.588,1.),vec3(0.,0.,.051),dusk));
      gl_FragColor=vec4(mix(warm,cool,edge),1.);}`,
    // Wave displacement pulls the focused light out into irregular streaks.
    `void main(){vec2 p=uv*2.-1.;float phase=time*.25;
      p.x+=sin((p.y+pointer.y)*7.+phase)*.236;
      gl_FragColor=sampleImage(p*.5+.5);}`,
    // Thin diagonal cells offset neighbouring samples differently, opening blue gaps.
    `void main(){float aspect=resolution.x/resolution.y;
      vec2 p=(uv-.5)*vec2(aspect,1.)*16.;
      p=vec2((p.x+p.y)*.70710678,(-p.x+p.y)*.070710678);
      vec2 cell=floor(p),inside=fract(p),nearest=vec2(0.);float best=100.;
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
        vec2 offset=vec2(float(x),float(y));vec2 seed=randomPoint(cell+offset);
        vec2 point=.5+.5*sin(vec2(5.+time*.2)+seed*6.2831853);
        vec2 d=offset+point-inside;float distance=dot(d,d);
        if(distance<best){best=distance;nearest=point;}
      }
      vec2 displacement=(nearest-.5)*.36;
      gl_FragColor=sampleImage(uv+displacement);}`,
    // Disc blur with highlight weighting preserves bright centres and soft edges.
    `void main(){vec3 sum=vec3(0.),weights=vec3(0.);
      float aspect=resolution.x/resolution.y;
      float radius=2.356*(.5+.0*length(uv-pointer));
      for(int i=0;i<24;i++){float index=float(i)+.5;
        float angle=index*2.39996323;float distance=sqrt(index*2.)-1.;
        vec2 offset=vec2(cos(angle)/aspect,sin(angle))*distance*.003*radius;
        vec3 colour=sampleImage(uv+offset).rgb;
        vec3 weight=vec3(5.)+pow(colour,vec3(9.))*150.;sum+=colour*weight;weights+=weight;
      }
      gl_FragColor=vec4(sum/weights,1.);}`,
    `void main(){vec3 warm=linear(mix(vec3(1.,.918,.839),vec3(.173,.294,.835),dusk));
      vec3 base=mix(warm,vec3(1.),.61);
      vec3 tint=linear(mix(vec3(.675,1.,.725),vec3(0.,.204,.298),dusk))*.35;
      vec3 filtered=clamp(sampleImage(uv).rgb+tint,0.,1.);
      vec3 result=base*mix(vec3(1.),filtered,mix(.65,.95,dusk));
      gl_FragColor=vec4(srgb(result),1.);}`
  ];
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  let passes;
  try{passes=sources.map(source=>{const program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,common+source);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    return {program,position:gl.getAttribLocation(program,'position'),uniforms:Object.fromEntries(['inputImage','resolution','pointer','time','dusk'].map(key=>[key,gl.getUniformLocation(program,key)]))};});
  }catch{return fallbackLight(hero,reducedMotion);}
  const vertices=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  function target(){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);return {texture,framebuffer};}
  const targets=[target(),target()];
  let width=1,height=1,x=0,y=0,targetX=0,targetY=0,elapsed=0,last=0,frame=0,visible=true,dusk=0;
  layer.replaceChildren(canvas);layer.classList.add('shader-light');canvas.dataset.lightPipeline='waves-cells-bokeh';
  function start(){if(!frame)frame=requestAnimationFrame(draw);}
  function draw(now){frame=0;const dt=Math.min((now-(last||now))/1000,.05);last=now;
    const smoothing=1-Math.exp(-dt*24);x+=(targetX-x)*smoothing;y+=(targetY-y)*smoothing;
    const theme=document.body.classList.contains('dusk')?1:0;dusk+=(theme-dusk)*(1-Math.exp(-dt*8));
    if(!reducedMotion.matches)elapsed+=dt;
    let previous=null;
    for(let i=0;i<passes.length;i++){const pass=passes[i],output=i===passes.length-1?null:targets[i%2];
      gl.bindFramebuffer(gl.FRAMEBUFFER,output?.framebuffer||null);
      gl.viewport(0,0,output?width:canvas.width,output?height:canvas.height);
      gl.useProgram(pass.program);gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.enableVertexAttribArray(pass.position);
      gl.vertexAttribPointer(pass.position,2,gl.FLOAT,false,0,0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,previous?.texture||null);
      gl.uniform1i(pass.uniforms.inputImage,0);gl.uniform2f(pass.uniforms.resolution,width,height);
      gl.uniform2f(pass.uniforms.pointer,.5+(reducedMotion.matches?0:x),.5-(reducedMotion.matches?0:y));
      gl.uniform1f(pass.uniforms.time,elapsed);gl.uniform1f(pass.uniforms.dusk,dusk);
      gl.drawArrays(gl.TRIANGLES,0,6);previous=output;
    }
    if(visible&&!document.hidden&&(!reducedMotion.matches||Math.abs(theme-dusk)>.001))start();
  }
  function resize(){const rect=hero.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,1.25);
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
    width=Math.max(1,Math.round(rect.width*.4));height=Math.max(1,Math.round(rect.height*.4));
    for(const output of targets){gl.bindTexture(gl.TEXTURE_2D,output.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);}
    start();}
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();}).observe(hero);
  new MutationObserver(start).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
  reducedMotion.addEventListener('change',()=>{targetX=targetY=0;start();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;layer.classList.remove('shader-light');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  resize();return {move(nextX,nextY){targetX=nextX;targetY=nextY;start();}};
}
