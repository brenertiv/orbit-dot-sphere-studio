// Orbit canvas runtime. No dependencies, geometry generation, or React frame updates.
export function createSphere(canvas, config, options = {}) {
  const ctx = canvas.getContext('2d', { alpha:true });
  if (!ctx) return { update(){}, destroy(){} };
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const themeQuery = matchMedia('(prefers-color-scheme: dark)');
  let opts = { theme:'system', paused:false, ...options };
  let data, xyz, projected, order, count, frame = 0, time = 0, last = 0;
  let rotation = 0, drift = 0, shimmer = 0, breath = 0, surface = 0;
  let width = 0, height = 0, dpr = 1, visible = true, destroyed = false;
  let palette, fromPalette = null, themeStart = 0, frameCount = 0, cost = 0, quality = 1;
  const rgb = hex => [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  const themeName = () => opts.theme === 'system' ? (themeQuery.matches ? 'dark':'light') : opts.theme;
  const active = () => !destroyed && visible && !document.hidden && !opts.paused && !motionQuery.matches && width > 0 && height > 0 && (data.motion.speed || data.motion.deformation*(data.motion.driftSpeed ?? 0.65) || data.motion.pulse*(data.motion.pulseSpeed ?? 1.3) || (data.motion.breathing || 0)*(data.motion.breathSpeed ?? 0.6) || (data.motion.waveHeight || 0)*(data.motion.waveSpeed ?? 0.8));
  function setData(next) {
    if (!next || next.version !== 1 || !Array.isArray(next.points) || next.points.length % 3 || next.points.length > 3600 || !next.themes?.dark || !next.themes?.light) throw new Error('Unsupported Orbit sphere configuration.');
    if (next.points !== data?.points) {
      count = next.points.length/3; xyz = new Float32Array(next.points);
      projected = new Float32Array(count*4); order = Array.from({length:count},(_,i)=>i);
    }
    data = next;
  }
  function setPalette(animate) {
    const p = data.themes[themeName()] || data.themes.dark;
    fromPalette = animate && !motionQuery.matches && palette ? palette : null;
    palette = { colors:p.colors.map(rgb), line:rgb(p.line) }; themeStart = performance.now();
  }
  function color(values, previous, blend) {
    if (!previous) return 'rgb('+values.join(',')+')';
    return 'rgb('+values.map((v,i)=>Math.round(previous[i]+(v-previous[i])*blend)).join(',')+')';
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75)*quality;
    canvas.width = Math.max(1,Math.round(width*dpr)); canvas.height = Math.max(1,Math.round(height*dpr));
    draw(performance.now()); schedule();
  }
  function draw(now) {
    if (!width || !height || destroyed) return;
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
    const blend = Math.min(1,(now-themeStart)/260);
    const colors = palette.colors.map((c,i)=>color(c,fromPalette?.colors[i],blend));
    const line = color(palette.line,fromPalette?.line,blend);
    if (blend >= 1) fromPalette = null;
    const motion=data.motion, axis=motion.axis || 'y';
    const angle = rotation, ay=0.34+(['y','tumble'].includes(axis)?angle:0);
    const ax=axis==='x'?angle:axis==='tumble'?angle*0.61:0, az=axis==='z'?angle:0;
    const ca=Math.cos(ay),sa=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax),cz=Math.cos(az),sz=Math.sin(az);
    const breathing=1+(motion.breathing || 0)*Math.sin(breath);
    // Fit the largest possible deformation, keeping breathing/waves clear of the edges.
    const bound=(1+motion.deformation*0.23)*(1+(motion.waveHeight || 0))*(1+(motion.breathing || 0));
    const fit=Math.min(0.365,0.43*Math.sqrt(3.8*3.8-bound*bound)/(3.8*bound));
    const tilt = -0.17, ct = Math.cos(tilt), st = Math.sin(tilt), scale = Math.min(width,height)*fit;
    const frequency=(motion.waveFrequency ?? 2.2)*Math.PI;
    for (let i = 0; i < count; i++) {
      const at=i*3, to=i*4;
      const ripple=motion.waveHeight ? motion.waveHeight*(0.65*Math.sin((xyz[at+1]*0.88+xyz[at]*0.45)*frequency+surface)+0.35*Math.sin((xyz[at+2]*0.8-xyz[at]*0.35)*frequency-surface*0.7)) : 0;
      const wave=(1+Math.sin(drift+xyz[at+1]*3+xyz[at]*2)*motion.deformation*0.23)*(1+ripple)*breathing;
      let x=xyz[at]*wave, y=xyz[at+1]*wave, z=xyz[at+2]*wave;
      if(motion.twist){const a=motion.twist*y,c=Math.cos(a),s=Math.sin(a),originalX=x;x=x*c+z*s;z=z*c-originalX*s;}
      const yx=x*ca+z*sa, yz=z*ca-x*sa, xy=y*cx-yz*sx, xz=y*sx+yz*cx;
      const rx=yx*cz-xy*sz, zy=yx*sz+xy*cz, ry=zy*ct-xz*st, depth=zy*st+xz*ct;
      const perspective=3.8/(3.8-depth);
      projected[to]=width/2+rx*scale*perspective;
      projected[to+1]=height/2+ry*scale*perspective;
      projected[to+2]=depth; projected[to+3]=perspective;
    }
    ctx.strokeStyle=line; ctx.lineWidth=0.65;
    // Three depth batches keep the network soft without one draw call per edge.
    for (let bucket=0; bucket<3; bucket++) {
      ctx.globalAlpha=data.appearance.lineOpacity*(0.42+bucket*0.29); ctx.beginPath();
      for (let i=0; i<data.links.length; i+=2) {
        const a=data.links[i]*4,b=data.links[i+1]*4;
        const depth=(projected[a+2]+projected[b+2])*0.5;
        if (Math.min(2,Math.max(0,Math.floor((depth+1)*1.5)))!==bucket) continue;
        ctx.moveTo(projected[a],projected[a+1]); ctx.lineTo(projected[b],projected[b+1]);
      }
      ctx.stroke();
    }
    order.sort((a,b)=>projected[a*4+2]-projected[b*4+2]);
    const sizeScale=Math.min(1.45,Math.max(0.5,Math.min(width,height)/580));
    for (let j=0; j<count; j++) {
      const i=order[j], at=i*4, depth=(projected[at+2]+1)*0.5;
      const pulse=1-motion.pulse*(0.5+0.5*Math.sin(shimmer+i*2.39));
      ctx.globalAlpha=Math.max(0.12,Math.min(1,(1-data.appearance.depth*(1-depth)*0.73)*pulse));
      ctx.fillStyle=colors[data.colors[i]];
      ctx.beginPath(); ctx.arc(projected[at],projected[at+1],Math.max(0.35,data.appearance.size*data.sizes[i]*projected[at+3]*sizeScale),0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function tick(now) {
    frame=0;
    if (destroyed || !visible || document.hidden) { last=0; return; }
    if (active()) {
      if(last) {
        const dt=Math.min((now-last)/1000,0.05),m=data.motion;time+=dt;
        rotation+=dt*m.speed*0.3*(m.direction ?? 1);drift+=dt*(m.driftSpeed ?? 0.65);
        shimmer+=dt*(m.pulseSpeed ?? 1.3);breath+=dt*(m.breathSpeed ?? 0.6);
        surface+=dt*(m.waveSpeed ?? 0.8);
      }
      last=now;
    } else last=0;
    const start=performance.now(); draw(now); cost+=performance.now()-start; frameCount++;
    if (frameCount===120) {
      const average=cost/frameCount;
      opts.onMetrics?.({drawMs:average,points:count,connections:data.links.length/2,pixelRatio:dpr});
      if (average>8 && quality>0.65) {quality=Math.max(0.65,quality-0.15);resize();}
      frameCount=0;cost=0;
    }
    schedule();
  }
  function schedule() {
    if (!frame && !destroyed && visible && !document.hidden && (active() || fromPalette)) frame=requestAnimationFrame(tick);
  }
  function reconcile() {
    if(frame) cancelAnimationFrame(frame);frame=0;last=0;
    // A preference change must also stop a palette transition already in progress.
    if(motionQuery.matches) fromPalette=null;
    if(visible && !document.hidden) draw(performance.now());schedule();
  }
  function themeChanged() { if(opts.theme==='system') {setPalette(true);reconcile();} }
  const resizeObserver=new ResizeObserver(resize);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;reconcile();});
  setData(config);setPalette(false);resize();resizeObserver.observe(canvas);intersection.observe(canvas);
  document.addEventListener('visibilitychange',reconcile);
  motionQuery.addEventListener('change',reconcile);themeQuery.addEventListener('change',themeChanged);
  return {
    getState() { return {time,rotation,drift,shimmer,breath,surface}; },
    seek(state) {
      if(typeof state==='number') {
        time=Math.max(0,state);const m=data.motion;rotation=time*m.speed*0.3*(m.direction ?? 1);
        drift=time*(m.driftSpeed ?? 0.65);shimmer=time*(m.pulseSpeed ?? 1.3);breath=time*(m.breathSpeed ?? 0.6);
        surface=time*(m.waveSpeed ?? 0.8);
      } else ({time,rotation,drift,shimmer,breath,surface=0}=state);
      last=0;reconcile();
    },
    update(nextConfig,nextOptions={}) {
      if(destroyed)return;
      const oldTheme=themeName();opts={...opts,...nextOptions};
      if(nextConfig && nextConfig!==data) {setData(nextConfig);setPalette(true);}
      else if(oldTheme!==themeName())setPalette(true);
      reconcile();
    },
    destroy() {
      destroyed=true;if(frame)cancelAnimationFrame(frame);
      resizeObserver.disconnect();intersection.disconnect();
      document.removeEventListener('visibilitychange',reconcile);
      motionQuery.removeEventListener('change',reconcile);themeQuery.removeEventListener('change',themeChanged);
    }
  };
}
