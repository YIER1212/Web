import * as T from 'three'

// Three world-space paths behind the habitat. One draw call for heads and tails.
export function createComets(scene){
  const count=3*96,positions=new Float32Array(count*3),lanes=new Float32Array(count),tails=new Float32Array(count)
  for(let i=0;i<count;i++){lanes[i]=Math.floor(i/96);tails[i]=(i%96)/95}
  const geometry=new T.BufferGeometry()
  geometry.setAttribute('position',new T.BufferAttribute(positions,3))
  geometry.setAttribute('lane',new T.BufferAttribute(lanes,1))
  geometry.setAttribute('tail',new T.BufferAttribute(tails,1))
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,
    uniforms:{time:{value:0}},
    vertexShader:`
      uniform float time;attribute float lane;attribute float tail;varying float brightness;varying vec3 tint;
      void main(){
        float age=mod(time+2.+lane*7.,23.);float p=age/10.;
        float visible=(1.-step(10.,age))*smoothstep(0.,1.,age)*(1.-smoothstep(8.,10.,age));
        vec3 velocity=normalize(vec3(430.,-65.,0.));
        vec3 head=vec3(-290.+430.*p,10.-65.*p+lane*12.,-210.-lane*25.);
        vec3 spread=vec3(sin(tail*213.+lane),cos(tail*177.+lane),0.)*tail*2.4;
        vec3 point=head-velocity*tail*72.+spread;
        vec4 mv=modelViewMatrix*vec4(point,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(1100.*mix(5.5,1.7,tail)/max(1.,-mv.z),1.,32.);
        brightness=visible*pow(1.-tail,1.6)*mix(1.,.65,step(.02,tail));
        tint=mix(vec3(.32,.76,1.),vec3(1.,.76,.48),lane*.35);
      }`,
    fragmentShader:`varying float brightness;varying vec3 tint;void main(){float r=length(gl_PointCoord-.5)*2.;float glow=exp(-r*r*5.)*(1.-smoothstep(.7,1.,r));gl_FragColor=vec4(tint,glow*brightness);}`
  })
  const points=new T.Points(geometry,material);points.frustumCulled=false;scene.add(points)
  return {update:time=>{material.uniforms.time.value=time},setVisible:visible=>{points.visible=visible}}
}
