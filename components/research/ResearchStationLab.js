import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ResearchPage from '@/pages/research'
import { cabinLocations, cabinPoint, dockPose, homePose, flightPlan, sampleFlight } from './stationFlight'
import styles from './ResearchStationLab.module.css'
import { STATION_PORTS } from './stationGeometry'
import { useRouter } from 'next/router'
import { createComets } from './createComets'

export default function ResearchStationLab({children,shared=false,routePath='/station-lab',port}){
  const router=useRouter()
  const currentPort=port||STATION_PORTS[0]
  const routeRef=useRef({routePath,port:currentPort});routeRef.current={routePath,port:currentPort}
  const contentRef=useRef(null)
  const markers=useRef({})
  const host=useRef(null), panel=useRef(null), panelHome=useRef(null), api=useRef(null)
  const [phase,setPhase]=useState('loading'),[error,setError]=useState('')
  const [cosmosOn,setCosmosOn]=useState(true)
  useEffect(()=>{api.current?.navigate(routePath,currentPort);if(contentRef.current)contentRef.current.scrollTop=0},[routePath])
  useEffect(()=>{
    let dead=false,cleanup=()=>{}
    Promise.all([import('three'),import('three/examples/jsm/renderers/CSS3DRenderer.js'),import('three/examples/jsm/environments/RoomEnvironment.js'),import('./createBlenderStation')]).then(async ([T,{CSS3DRenderer,CSS3DObject},{RoomEnvironment},{createBlenderStation}])=>{
      if(dead)return
      const scene=new T.Scene(),htmlScene=new T.Scene(),camera=new T.PerspectiveCamera(52,1,.08,1600)
      const model=await createBlenderStation(scene)
      if(dead){scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});model.textures.forEach(t=>t.dispose());return}
      const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor(0x02050c)
      renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap
      renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true
      const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.06)
      scene.environment=env.texture;scene.environmentIntensity=.4;room.dispose();pmrem.dispose()
      const sun=new T.DirectionalLight(0xffecd6,3.5);sun.position.set(15,20,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,far:110});sun.shadow.bias=-.0005;scene.add(sun)
      scene.add(new T.HemisphereLight(0x9fc9f5,0x080e1a,.4))
      const sky=new T.Mesh(new T.SphereGeometry(700,48,32),new T.ShaderMaterial({uniforms:{time:{value:0}},side:T.BackSide,depthWrite:false,vertexShader:`varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
        varying vec3 direction;uniform float time;
        float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+7.1;a*=.5;}return v;}
        void main(){vec3 d=normalize(direction);vec3 flow=vec3(sin(time*.12)*.22,time*.026,cos(time*.09)*.18);float n=fbm(d*6.+flow);float band=exp(-pow((d.y+.3*d.x-.08+(n-.5)*.4)*3.8,2.));float cloud=pow(fbm(d*11.+flow*2.),2.)*band;vec3 color=vec3(.005,.012,.035)+cloud*mix(vec3(.15,.48,.85),vec3(.65,.18,.7),fbm(d*4.+20.+flow*.5));color+=pow(max(0.,n-.48),2.)*band*vec3(.6,.8,1.);color*=1.+.12*sin(time*.24+d.x*4.);gl_FragColor=vec4(color,1.);}` }));scene.add(sky)
      const comets=createComets(scene)
      const stars=new Float32Array(2400*3),starColors=new Float32Array(2400*3)
      for(let i=0;i<2400;i++){const a=i*2.399963,b=Math.acos(1-2*(i+.5)/2400),r=350+(i%37)*5;stars.set([r*Math.sin(b)*Math.cos(a),r*Math.cos(b),r*Math.sin(b)*Math.sin(a)],i*3)}
      for(let i=0;i<2400;i++){const bright=.35+(i%17)/17*.65;starColors.set(i%5===0?[bright,bright*.8,bright*.65]:[bright*.7,bright*.85,bright],i*3)}
      const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(stars,3));starGeometry.setAttribute('color',new T.BufferAttribute(starColors,3));const starField=new T.Points(starGeometry,new T.PointsMaterial({vertexColors:true,size:1.3,sizeAttenuation:true,transparent:true,opacity:.9}));scene.add(starField)
      const planet=new T.Mesh(new T.SphereGeometry(85,64,32),new T.MeshStandardMaterial({color:0x244a66,roughness:1}));planet.position.set(85,-110,-195);planet.scale.setScalar(1.45);scene.add(planet)
      const earthTextures=[],loader=new T.TextureLoader()
      const loadEarth=(file,apply,color=false)=>loader.load(`/textures/earth/${file}`,texture=>{if(dead){texture.dispose();return}if(color)texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());earthTextures.push(texture);apply(texture);dirty=true},undefined,()=>{if(!dead)console.warn(`Earth texture unavailable: ${file}`)})
      loadEarth('surface.jpg',texture=>{planet.material.map=texture;planet.material.color.set(0xffffff);planet.material.needsUpdate=true},true)
      loadEarth('normal.jpg',texture=>{planet.material.normalMap=texture;planet.material.normalScale.set(.45,.45);planet.material.needsUpdate=true})
      const clouds=new T.Mesh(new T.SphereGeometry(85.6,64,32),new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false,roughness:1}));clouds.position.copy(planet.position);clouds.scale.copy(planet.scale);clouds.visible=false;scene.add(clouds)
      loadEarth('clouds.png',texture=>{clouds.material.map=texture;clouds.material.needsUpdate=true;clouds.visible=true},true)
      const atmosphere=new T.Mesh(new T.SphereGeometry(87,64,32),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`varying vec3 normalView;varying vec3 view;void main(){vec4 p=modelViewMatrix*vec4(position,1.);normalView=normalize(normalMatrix*normal);view=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 normalView;varying vec3 view;void main(){float rim=pow(1.-max(0.,dot(normalize(normalView),normalize(view))),3.5);gl_FragColor=vec4(.18,.54,1.,rim*.65);}`}));atmosphere.position.copy(planet.position);scene.add(atmosphere)
      atmosphere.scale.copy(planet.scale)
      const css=new CSS3DRenderer();css.domElement.className=styles.cssLayer;host.current.append(renderer.domElement,css.domElement)
      const object=new CSS3DObject(panel.current);object.position.set(-.45,.5,-4.64);object.rotation.y=.2;object.scale.setScalar(.0045);htmlScene.add(object)
      let docked=shared&&routeRef.current.routePath!=='/'?routeRef.current.port.id:null,desired=docked,motion=null,last=0,frame,reported='',dirty=true,lastDraw=0,elapsed=0
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
      let ambientEnabled=!reduced.matches;setCosmosOn(ambientEnabled);comets.setVisible(ambientEnabled)
      const placeDisplay=id=>{if(!id)return;object.position.set(...cabinPoint(id,[-.45,.5,-4.64]));object.rotation.y=cabinLocations.find(c=>c.id===id).yaw+.2}
      placeDisplay(docked)
      const start=to=>{desired=to;dirty=true;if(motion)return;if(to===docked)return;if(reduced.matches){docked=to;placeDisplay(to);return}motion={...flightPlan(docked,to),from:docked,to,progress:0};placeDisplay(to);setPhase(to?'approach':'returning')}
      api.current={enter:()=>start('research'),exit:()=>start(null),navigate:(path,nextPort)=>start(path==='/'?null:nextPort.id),toggleCosmos:()=>{ambientEnabled=!ambientEnabled;setCosmosOn(ambientEnabled);comets.setVisible(ambientEnabled);dirty=true}}
      const raycaster=new T.Raycaster()
      const pick=event=>{const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);return raycaster.intersectObjects(model.root.children,true)[0]}
      const pickedPort=event=>{const hit=pick(event);return hit?.object.userData.portId||hit?.object.userData.portIds?.[hit.instanceId]}
      const click=event=>{if(!docked&&!motion){const id=pickedPort(event);if(id){if(shared)router.push(STATION_PORTS.find(p=>p.id===id).href);else start(id)}}}
      const hover=event=>{renderer.domElement.style.cursor=!docked&&!motion&&pickedPort(event)?'pointer':'default'}
      renderer.domElement.addEventListener('click',click);renderer.domElement.addEventListener('pointermove',hover)
      const resize=()=>{if(!host.current)return;const {width,height}=host.current.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(26))/Math.min(1,camera.aspect)));camera.updateProjectionMatrix();const panelWidth=width<640?420:1000;panel.current.style.width=`${panelWidth}px`;panel.current.style.height=`${panelWidth*.66}px`;object.scale.setScalar(3.51/panelWidth);renderer.setSize(width,height);css.setSize(width,height);dirty=true}
      const observer=new ResizeObserver(resize);observer.observe(host.current);resize()
      const key=e=>{if(e.key==='Escape'){if(shared)router.push('/');else start(null)}};window.addEventListener('keydown',key)
      const lost=e=>{e.preventDefault();setError('三维画面连接中断，请刷新后重试。')};renderer.domElement.addEventListener('webglcontextlost',lost)
      const render=time=>{
        frame=requestAnimationFrame(render)
        const dt=last?Math.max(0,(time-last)/1000):0;last=time
        if(document.hidden)return
        if(ambientEnabled)elapsed+=dt
        if(motion){motion.progress=Math.min(1,motion.progress+dt/motion.duration);if(motion.progress===1){docked=motion.to;motion=null;if(desired!==docked)start(desired)}}
        if(!motion&&!dirty&&(!ambientEnabled||time-lastDraw<33))return
        dirty=false;lastDraw=time
        if(ambientEnabled){sky.material.uniforms.time.value=elapsed;comets.update(elapsed);sky.rotation.y=elapsed*.003;starField.rotation.y=elapsed*.0015;starField.material.opacity=.86+Math.sin(elapsed*.65)*.1;planet.rotation.y=elapsed*.006;clouds.rotation.y=elapsed*.009}
        const pose=motion?sampleFlight(motion,motion.progress):docked?dockPose(docked):homePose;camera.position.set(...pose.position);camera.lookAt(...pose.look)
        const arrival=motion?(motion.to?T.MathUtils.smoothstep(motion.progress,.9,1):0):docked?1:0
        const departure=motion?.from?1-T.MathUtils.smoothstep(motion.progress,0,.2):0
        const halfFov=26+6.5*Math.max(arrival,departure);camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(halfFov))/Math.min(1,camera.aspect)));camera.updateProjectionMatrix()
        for(const cabin of model.cabins)cabin.setDoor(cabin.id===docked||cabin.id===motion?.from||cabin.id===motion?.to?1:0)
        const inside=arrival>0&&(!shared||routeRef.current.port.id===(motion?.to||docked));css.domElement.style.visibility=inside?'visible':'hidden';css.domElement.style.pointerEvents=!motion&&docked?'auto':'none';panel.current.style.opacity=String(arrival)
        host.current.dataset.cabin=docked||'exterior';host.current.dataset.destination=motion?.to||''
        const next=motion?(motion.to?'approach':'returning'):docked?'inside':'outside'
        if(next!==reported){reported=next;setPhase(next)}
        camera.updateMatrixWorld()
        if(!motion&&!docked)for(const location of cabinLocations){const marker=markers.current[location.id];if(marker){const p=new T.Vector3(...cabinPoint(location.id,[0,2.8,5])).project(camera);marker.style.left=`${(p.x+1)*50}%`;marker.style.top=`${(1-p.y)*50}%`}}
        renderer.render(scene,camera);if(inside)css.render(htmlScene,camera)
      };frame=requestAnimationFrame(render);setPhase(docked?'inside':'outside')
      cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',key);renderer.domElement.removeEventListener('click',click);renderer.domElement.removeEventListener('pointermove',hover);renderer.domElement.removeEventListener('webglcontextlost',lost);api.current=null;if(panelHome.current&&panel.current)panelHome.current.appendChild(panel.current);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});model.textures.concat(earthTextures).forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();css.domElement.remove()}
    }).catch(e=>{if(!dead){setError('三维场景暂时无法启动，可先访问研究内容。');setPhase('error');console.error(e)}})
    return()=>{dead=true;cleanup()}
  },[])
  const labels={loading:'正在准备三维场景',outside:'研究舱外部 · 点击进入观景窗',approach:'01 / 绕行至入口正面',entry:'02 / 沿入口轴线进入',settling:'03 / 转向研究显示屏',inside:'研究舱内 · 显示屏可交互',returning:'沿原路径退出舱段',error:'三维场景不可用'}
  return <main className={styles.lab}>
    <div ref={host} className={styles.world} />
    {shared&&routePath==='/'&&phase==='outside'&&<nav className={styles.portMarkers} aria-label='空间站实体舱段'>{STATION_PORTS.map(p=><Link key={p.id} href={p.href} ref={node=>{markers.current[p.id]=node}} style={{'--port-color':p.color}}>{p.title} ↗</Link>)}</nav>}
    <header className={styles.header}><Link href='/'>← 返回空间站</Link><span>SONGJUN / {currentPort.en}</span><nav className={styles.nav} aria-label='舱室导航'>{STATION_PORTS.map(p=><Link key={p.id} href={p.href} aria-current={routePath===p.href?'page':undefined}>{{research:'研究',achievements:'成果',courses:'课程',blog:'博客'}[p.id]}</Link>)}</nav></header>
    {shared&&routePath==='/'&&phase==='outside'&&<div className={styles.overview}><p>ORBITAL RESEARCH STATION</p><h1>Brain <em>Changes</em> World</h1><p>脑海无垠，进一寸有进一寸的欢喜。</p><nav aria-label='选择目的舱室'>{STATION_PORTS.map(p=><Link key={p.id} href={p.href} style={{'--port-color':p.color}}><strong>{p.title} ↗</strong><small>{p.description}</small></Link>)}</nav></div>}
    <div ref={panelHome} className={styles.panelHome}><div ref={panel} className={styles.panel}><div className={styles.panelBar}>{currentPort.en} / 0{STATION_PORTS.indexOf(currentPort)+1} <span>● ONLINE</span></div><div ref={contentRef} className={styles.content} tabIndex={0} role='region' aria-label={`${currentPort.title}内容，可滚动`}>{shared?children:<ResearchPage />}</div><div className={styles.panelFoot}><span>SONGJUN · {currentPort.en}</span><span>滚动阅读 ↓</span></div></div></div>
    {error&&<p className={styles.error} role='alert'>{error}<br/><Link href={`${currentPort.href}?view=plain`}>打开普通阅读页面 ↗</Link></p>}
    <footer className={styles.controls}><div><small>{currentPort.en}</small><p role='status'>{shared?(phase==='inside'?`${currentPort.title} · 显示屏可交互`:phase==='outside'?'选择目的舱室':phase==='loading'?'正在连接空间站':'正在穿越观景窗…'):labels[phase]}</p></div><div><button disabled={phase==='loading'||phase==='error'} aria-pressed={cosmosOn} onClick={()=>api.current?.toggleCosmos()}>{cosmosOn?'暂停太空动效':'开启太空动效'}</button>{!shared&&<button disabled={phase==='loading'||phase==='error'||phase==='inside'} onClick={()=>api.current?.enter()}>进入研究舱</button>}<button disabled={phase==='outside'||phase==='loading'||phase==='error'} onClick={()=>shared?router.push('/'):api.current?.exit()}>退出 / Esc</button></div></footer>
  </main>
}
