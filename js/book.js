/* ZQ3S report reader (Luay, 2026-11-11): the flip book beside the scroll reader, on each report's reading page only.
   Built from the page's own list of page pictures (ol.rp-pages), so without this script the pages simply show one under
   another, as before. No third-party code: the page turn is drawn here (a fold line between the grabbed corner and the
   pointer; the part past the fold is mirrored onto the other side, with the page behind it showing through).
   - Two pages side by side when there is room, one page on a phone; Arabic turns right to left, English left to right.
   - Drag a page (mouse, finger or pen), click or tap it, use the arrows, the keys, the page number or the slider.
   - Only the pages near the one open are fetched.
   - Reduced motion: the pages fade instead of turning.
   - The switch (flip through / scroll) remembers the visitor's choice in this browser only. */
(function(){
'use strict';
var D=document,W=window,H=D.documentElement;
var box=D.querySelector('[data-reader]');if(!box)return;
var list=box.querySelector('.rp-pages'),bk=box.querySelector('[data-book]'),bar=box.querySelector('[data-rd-bar]');
if(!list||!bk||!bar)return;
var RTL=H.getAttribute('dir')==='rtl',AR=H.lang==='ar';
var RM=W.matchMedia('(prefers-reduced-motion: reduce)').matches;
var FINE=W.matchMedia('(hover:hover) and (pointer:fine)').matches;
var RID=box.getAttribute('data-id')||'';
function $(s,r){return (r||D).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))}
function dg(n){n=String(n);return AR?n.replace(/[0-9]/g,function(c){return '٠١٢٣٤٥٦٧٨٩'.charAt(+c)}):n}
function num(t){t=String(t||'').replace(/[٠-٩]/g,function(c){return String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))}).replace(/[^0-9]/g,'');return t?parseInt(t,10):NaN}
function track(n,p){if(W.ZQ3S_TRACK)W.ZQ3S_TRACK(n,p||{})}
function now(){return W.performance.now()}
function store(k,v){try{if(v===undefined)return W.localStorage.getItem(k);W.localStorage.setItem(k,v)}catch(_){return null}}

var PG=$$('img',list).map(function(i){return {src:i.getAttribute('src'),w:+i.getAttribute('width')||1100,h:+i.getAttribute('height')||1557,alt:i.getAttribute('alt')||''}});
var N=PG.length;if(!N)return;
var ASP=PG[0].h/PG[0].w;
var tpl=($('[data-rd-count]',bar)||{getAttribute:function(){return ''}}).getAttribute('data-tpl')||'{n} / {t}';

/* ---------------- the book's parts */
var view=$('.bk-view',bk),ctl=$('.bk-ctl',bk);
view.innerHTML='<div class="bk-stage"><div class="bk-pg bk-l"><img alt="" decoding="async"></div><div class="bk-pg bk-r"><img alt="" decoding="async"></div>'+
  '<div class="bk-spine" aria-hidden="true"></div>'+
  '<div class="bk-turn" aria-hidden="true" hidden><div class="bk-ush"><i></i></div><div class="bk-front"><img alt=""></div>'+
  '<div class="bk-backw"><div class="bk-back"><img alt=""></div></div><div class="bk-bsh"><i></i></div></div></div>';
var stage=$('.bk-stage',view),SL={l:$('.bk-l',stage),r:$('.bk-r',stage)},spine=$('.bk-spine',stage);
var turnEl=$('.bk-turn',stage),front=$('.bk-front',turnEl),back=$('.bk-back',turnEl),backw=$('.bk-backw',turnEl);
var ush=$('.bk-ush',turnEl),ushI=$('i',ush),bsh=$('.bk-bsh',turnEl),bshI=$('i',bsh);
var atIn=$('[data-at]',ctl),scrub=$('[data-scrub]',ctl),fullB=$('[data-full]',ctl);
var countEl=$('[data-rd-count]',bar);
if(RTL)stage.classList.add('is-rtl');

/* ---------------- fetching only what is near */
var got={};
function want(i){if(i<0||i>=N||got[i])return;var im=new Image();im.decoding='async';im.src=PG[i].src;got[i]=im}
function setImg(img,i){if(i==null||i<0||i>=N){img.removeAttribute('src');img.alt='';img.parentNode.classList.add('is-empty');return}
  img.parentNode.classList.remove('is-empty');if(img.getAttribute('src')!==PG[i].src)img.src=PG[i].src;img.alt=PG[i].alt;want(i)}

/* ---------------- layout: a spread or one page */
var spread=true,pw=0,ph=0,SW=0,cur=0,anchor=0;   // cur: the view (spread or page) open; anchor: its first page
function views(){return spread?Math.floor(N/2)+1:N}
function pagesOf(v){if(!spread)return {l:null,r:v};var l=2*v-1,r=2*v;return {l:l>=0&&l<N?l:null,r:r<N?r:null}}
function viewOf(p){return spread?Math.floor((p+1)/2):p}
function firstOf(v){var q=pagesOf(v);return q.l!=null?q.l:q.r}
function isFull(){return box.classList.contains('is-full')||D.fullscreenElement===box||D.webkitFullscreenElement===box}
function layout(){
  var cs=getComputedStyle(view),aw=view.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  var vh=W.innerHeight,ch=ctl.offsetHeight||56;
  var bh=(bar.offsetHeight||0)+(parseFloat(getComputedStyle(bar).marginBottom)||0),tab=parseFloat(getComputedStyle(H).getPropertyValue('--tabh'))||60;
  var ah=isFull()?vh-ch-bh-28:vh-tab-bh-ch-36;
  /* on a computer the book starts high on the page: it fits the first screen, controls included, without a scroll */
  var docTop=view.getBoundingClientRect().top+W.scrollY;
  if(!isFull()&&docTop<vh*.45)ah=Math.min(ah,vh-docTop-ch-28);
  ah=Math.max(300,Math.min(ah,1100));aw=Math.max(200,aw);
  var pwh=ah/ASP;
  if(aw>=2*pwh*0.98){spread=true;ph=ah;pw=ph/ASP}
  else if(aw>=560&&aw/ah>1.05){spread=true;pw=aw/2;ph=pw*ASP}
  else{spread=false;pw=Math.min(aw,ah/ASP);ph=pw*ASP}
  pw=Math.floor(pw);ph=Math.floor(pw*ASP);SW=spread?2*pw:pw;
  stage.style.width=SW+'px';stage.style.height=ph+'px';view.style.height=(ph+(spread?24:16))+'px';
  stage.classList.toggle('is-spread',spread);
  [SL.l,SL.r,front,back].forEach(function(e){e.style.width=pw+'px';e.style.height=ph+'px'});
  SL.l.style.left='0px';SL.r.style.left=(spread?pw:0)+'px';SL.l.hidden=!spread;
  spine.hidden=!spread;
  cur=Math.min(viewOf(anchor),views()-1);
  draw();
}

/* the closed cover and the closed back sit in the middle, as a book on a table does */
function shiftFor(v){if(!spread)return 0;var q=pagesOf(v);if(q.l==null)return -pw/2;if(q.r==null)return pw/2;return 0}
function setShift(s){stage.style.transform='translateX('+((RTL?-1:1)*s).toFixed(1)+'px)'+(RTL?' scaleX(-1)':'')}

/* ---------------- the open pages, at rest */
function draw(){
  var q=pagesOf(cur);
  if(spread)setImg($('img',SL.l),q.l);
  setImg($('img',SL.r),q.r);
  spine.classList.toggle('is-off',!(q.l!=null&&q.r!=null));
  setShift(shiftFor(cur));
  anchor=firstOf(cur);
  for(var k=-2;k<=4;k++){var p=pagesOf(cur+k);if(cur+k>=0&&cur+k<views()){if(p.l!=null)want(p.l);if(p.r!=null)want(p.r)}}
  say();
}
function shown(){var q=pagesOf(cur),a=[];if(q.l!=null)a.push(q.l+1);if(q.r!=null)a.push(q.r+1);return a}
var sayT=0;
function say(){
  var a=shown(),n=a.length>1?dg(a[0])+'–'+dg(a[1]):dg(a[0]);
  if(atIn&&D.activeElement!==atIn)atIn.value=dg(a[0]);
  if(scrub){scrub.value=String(a[0]);scrub.setAttribute('aria-valuetext',tpl.replace('{n}',n).replace('{t}',dg(N)))}
  $$('[data-go="prev"]',ctl).forEach(function(b){b.disabled=cur<=0});
  $$('[data-go="next"]',ctl).forEach(function(b){b.disabled=cur>=views()-1});
  if(mode==='book'&&countEl){clearTimeout(sayT);sayT=setTimeout(function(){countEl.textContent=tpl.replace('{n}',n).replace('{t}',dg(N))},120)}
  if(mode==='book'&&touched&&W.history&&W.history.replaceState){try{W.history.replaceState(null,'',W.location.pathname+W.location.search+'#page-'+a[0])}catch(_){}}
}

/* ---------------- the turn
   Local frame of the turning leaf: the spine at x=0, the leaf spans [0,pw] x [0,ph]. C is the grabbed corner at rest
   (pw, 0 or ph); P is where that corner is now. The fold is the perpendicular bisector of C-P: the part of the leaf on
   C's side of it is folded over (its back shows, mirrored across the fold), the rest lies flat. */
var T=null,raf=0,state='idle';
function clipHalf(pg,nx,ny,c,keep){var o=[],i,a,b,da,db,t;
  for(i=0;i<pg.length;i++){a=pg[i];b=pg[(i+1)%pg.length];da=(a[0]*nx+a[1]*ny-c)*keep;db=(b[0]*nx+b[1]*ny-c)*keep;
    if(da>=0)o.push(a);if((da>=0)!==(db>=0)){t=da/(da-db);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}return o}
function poly(pts,dx){if(pts.length<3)return 'polygon(0 0,0 0,0 0)';
  return 'polygon('+pts.map(function(p){return (p[0]+(dx||0)).toFixed(1)+'px '+p[1].toFixed(1)+'px'}).join(',')+')'}
function f4(x){return x.toFixed(4)}
function begin(dir,corner){
  if(T||RM)return null;
  var to=cur+dir;if(to<0||to>=views())return null;
  var q0=pagesOf(cur),q1=pagesOf(to),t={dir:dir,to:to,from:cur,cy:corner?ph:0};
  if(spread){
    t.mirror=dir<0;t.ox=pw;
    if(dir>0){t.front=q0.r;t.back=q1.l;setImg($('img',SL.l),q0.l);setImg($('img',SL.r),q1.r)}
    else{t.front=q0.l;t.back=q1.r;setImg($('img',SL.l),q1.l);setImg($('img',SL.r),q0.r)}
    t.s0=shiftFor(cur);t.s1=shiftFor(to);
    spine.classList.toggle('is-off',false);
  }else{
    t.mirror=false;t.ox=0;t.back=null;
    if(dir>0){t.front=cur;setImg($('img',SL.r),to)}else{t.front=to;setImg($('img',SL.r),cur)}
    t.s0=t.s1=0;
  }
  t.C=[pw,t.cy];
  /* forward: the leaf starts flat (P = C) and lands on the other side (P = -C); a single page going back starts
     landed and comes back */
  t.rest=(!spread&&dir<0)?[-pw,t.cy]:[pw,t.cy];
  t.done=(!spread&&dir<0)?[pw,t.cy]:[-pw,t.cy];
  setImg($('img',front),t.front);
  var bi=$('img',back);
  if(t.back!=null)setImg(bi,t.back);else{bi.removeAttribute('src');back.classList.add('is-empty')}
  turnEl.classList.toggle('is-back',t.mirror);
  turnEl.classList.toggle('img-flip',t.mirror!==RTL);
  front.style.left=t.ox+'px';ush.style.left=t.ox+'px';ush.style.width=pw+'px';ush.style.height=ph+'px';
  turnEl.style.width=SW+'px';turnEl.style.height=ph+'px';
  turnEl.hidden=false;T=t;t.P=t.rest.slice();render(t.P);
  stage.classList.add('is-turning');
  return t;
}
function limit(P){var t=T,s1=[0,t.cy],s2=[0,ph-t.cy],R=Math.sqrt(pw*pw+ph*ph),dx,dy,l;
  dx=P[0]-s1[0];dy=P[1]-s1[1];l=Math.sqrt(dx*dx+dy*dy);if(l>pw){P=[s1[0]+dx*pw/l,s1[1]+dy*pw/l]}
  dx=P[0]-s2[0];dy=P[1]-s2[1];l=Math.sqrt(dx*dx+dy*dy);if(l>R){P=[s2[0]+dx*R/l,s2[1]+dy*R/l]}
  return P}
function progress(P){var t=T;return Math.max(0,Math.min(1,(t.rest[0]-P[0])/(t.rest[0]-t.done[0])))}
function render(P){
  var t=T;if(!t)return;P=limit(P);t.P=P;
  var C=t.C,dx=P[0]-C[0],dy=P[1]-C[1],len=Math.sqrt(dx*dx+dy*dy),ox=t.ox;
  var pr=1-Math.max(0,Math.min(1,(P[0]+pw)/(2*pw)));    // 0 flat on its own side, 1 landed on the other
  if(t.s0!==t.s1)setShift(t.s0+(t.s1-t.s0)*pr);
  if(len<0.6){front.style.clipPath='none';backw.style.visibility='hidden';ush.style.visibility='hidden';bsh.style.visibility='hidden';return}
  backw.style.visibility=ush.style.visibility=bsh.style.visibility='visible';
  var nx=dx/len,ny=dy/len,mx=(P[0]+C[0])/2,my=(P[1]+C[1])/2,c=mx*nx+my*ny;
  var rect=[[0,0],[pw,0],[pw,ph],[0,ph]],flat=clipHalf(rect,nx,ny,c,1),fold=clipHalf(rect,nx,ny,c,-1);
  front.style.clipPath=poly(flat);
  /* the back: reflected across the fold, and the back of a page is its mirror image, so together a rotation */
  var a=2*nx*nx-1,b=2*nx*ny,cc=-2*nx*ny,d=1-2*ny*ny,e=pw*(1-2*nx*nx)+2*c*nx+ox,f=-2*nx*ny*pw+2*c*ny;
  back.style.transform='matrix('+f4(a)+','+f4(b)+','+f4(cc)+','+f4(d)+','+e.toFixed(2)+','+f.toFixed(2)+')';
  back.style.clipPath=poly(fold.map(function(p){return [pw-p[0],p[1]]}));
  /* the shadow the lifted leaf throws on the page under it, and the curl's light on its back */
  var L=2*Math.sqrt(pw*pw+ph*ph),k=Math.min(1,len/(pw*.35))*Math.min(1,(1-pr)*3.2),sw=Math.min(pw*.42,40+len*.4);
  ush.style.clipPath=poly(fold);
  ushI.style.width=sw+'px';ushI.style.height=L+'px';ushI.style.opacity=k.toFixed(3);
  ushI.style.transform='matrix('+f4(-nx)+','+f4(-ny)+','+f4(-ny)+','+f4(nx)+','+(mx+ny*L/2).toFixed(2)+','+(my-nx*L/2).toFixed(2)+')';
  var ref=fold.map(function(p){var s=2*(p[0]*nx+p[1]*ny-c);return [p[0]-s*nx+ox,p[1]-s*ny]});
  bsh.style.clipPath=poly(ref);
  bshI.style.width=Math.min(pw*.6,60+len*.5)+'px';bshI.style.height=L+'px';
  bshI.style.transform='matrix('+f4(nx)+','+f4(ny)+','+f4(-ny)+','+f4(nx)+','+(mx+ox+ny*L/2).toFixed(2)+','+(my-nx*L/2).toFixed(2)+')';
}
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function run(to,dur,lift,cb,st){
  cancelAnimationFrame(raf);var t=T;if(!t)return;var from=t.P.slice(),t0=now(),sg=t.cy>0?1:-1;state=st||'anim';
  function step(){if(T!==t)return;var u=Math.min(1,(now()-t0)/dur),e=ease(u);
    render([from[0]+(to[0]-from[0])*e,from[1]+(to[1]-from[1])*e-sg*lift*Math.sin(Math.PI*e)]);
    if(u<1)raf=requestAnimationFrame(step);else cb()}
  raf=requestAnimationFrame(step);
}
function end(complete){
  var t=T;if(!t)return;cancelAnimationFrame(raf);
  if(complete)cur=t.to;
  T=null;state='idle';turnEl.hidden=true;front.style.clipPath='';stage.classList.remove('is-turning');back.classList.remove('is-empty');
  draw();
  if(complete){flips++;if(flips===1)track('report_flip',{where:'reader',id:RID})}
  if(queued){var q=queued;queued=0;go(q)}
}
var flips=0,queued=0,touched=0;
function flipTime(){return spread?(pw>420?950:820):640}
function go(dir){
  if(mode!=='book')return;touched=1;
  if(RM){fade(cur+dir);return}
  if(state==='anim'){queued=dir;return}
  if(state==='peek'||state==='drag'){if(T&&T.dir===dir){run(T.done,flipTime()*.8,0,function(){end(true)});return}if(T)end(false)}
  if(!begin(dir,true))return;
  var dur=flipTime();run(T.done,dur,ph*.18,function(){end(true)});
}
function fade(to){
  to=Math.max(0,Math.min(views()-1,to));if(to===cur)return;
  stage.classList.add('is-fading');
  setTimeout(function(){cur=to;draw();stage.classList.remove('is-fading')},140);
}
function jump(p){
  touched=1;p=Math.max(1,Math.min(N,p|0));var to=viewOf(p-1);if(T)end(false);
  if(to===cur){say();return}
  if(!RM&&Math.abs(to-cur)===1){go(to-cur);return}
  fade(to);
}

/* ---------------- the pointer: grab, drag, let go; a click or tap turns; a mouse near a corner lifts it a little */
function frameXY(e){var r=stage.getBoundingClientRect(),fx=RTL?r.right-e.clientX:e.clientX-r.left;return [fx,e.clientY-r.top]}
function localXY(e){var f=frameXY(e),x=f[0];if(T&&T.mirror)x=SW-x;return [x-(T?T.ox:0),f[1]]}
function sideOf(e){var f=frameXY(e);if(f[1]<-20||f[1]>ph+20)return 0;
  if(spread){var q=pagesOf(cur);if(f[0]>pw&&f[0]<=2*pw+20&&q.r!=null)return 1;if(f[0]<pw&&f[0]>=-20&&q.l!=null)return -1;
    /* the closed cover or back: either half of the page turns it */
    if(q.l==null&&f[0]>0)return 1;if(q.r==null&&f[0]<2*pw)return -1;return 0}
  return f[0]>pw/2?1:-1}
var ptr=null;
view.addEventListener('pointerdown',function(e){
  if(mode!=='book'||e.button>0||state==='anim')return;
  var s=sideOf(e);if(!s)return;
  var to=cur+s;if(to<0||to>=views())return;
  var f=frameXY(e);
  ptr={id:e.pointerId,x:e.clientX,y:e.clientY,t:now(),side:s,moved:false,lx:e.clientX,lt:now(),vx:0,corner:f[1]>ph/2};
  if(state==='peek'&&T&&T.dir!==s)end(false);
});
view.addEventListener('pointermove',function(e){
  if(mode!=='book')return;
  if(ptr&&e.pointerId===ptr.id){
    var dx=e.clientX-ptr.x,dy=e.clientY-ptr.y;
    if(!ptr.moved){if(Math.abs(dx)<6&&Math.abs(dy)<6)return;
      if(Math.abs(dy)>Math.abs(dx)*1.2&&e.pointerType!=='mouse'){ptr=null;return}
      ptr.moved=true;
      if(RM)return;
      if(!(state==='peek'&&T&&T.dir===ptr.side)){if(T)end(false);if(!begin(ptr.side,ptr.corner)){ptr=null;return}}
      try{view.setPointerCapture(e.pointerId)}catch(_){}
      state='drag';ptr.p0=T.P.slice();ptr.t0=now();
    }
    if(RM||!T)return;
    var t1=now();ptr.vx=(e.clientX-ptr.lx)/Math.max(1,t1-ptr.lt);ptr.lx=e.clientX;ptr.lt=t1;
    var L=localXY(e),u=Math.min(1,(t1-ptr.t0)/120);   // the corner catches up with the finger in a moment
    render([ptr.p0[0]+(L[0]-ptr.p0[0])*u,ptr.p0[1]+(L[1]-ptr.p0[1])*u]);
    e.preventDefault();return;
  }
  if(!FINE||e.pointerType!=='mouse'||RM)return;
  peekAt(e);
});
function release(e,cancel){
  if(!ptr||(e&&e.pointerId!==ptr.id))return;var p=ptr;ptr=null;
  if(!p.moved){if(!cancel)go(p.side);return}
  if(RM){var dx=e.clientX-p.x;if(Math.abs(dx)>40)go((RTL?-1:1)*(dx<0?1:-1));return}
  if(!T)return;
  /* the pointer's speed in the leaf's own frame, toward where the leaf lands: a quick flick turns it */
  var pr=progress(T.P),v=p.vx*(RTL?-1:1)*(T.mirror?-1:1)*(T.done[0]<T.rest[0]?-1:1);
  var ok=!cancel&&(pr>.28||v>.45);
  var dur=Math.max(220,flipTime()*(ok?1-pr:pr)*1.1);
  run(ok?T.done:T.rest,dur,0,function(){end(ok)});
}
view.addEventListener('pointerup',function(e){release(e,false)});
view.addEventListener('pointercancel',function(e){release(e,true)});
view.addEventListener('lostpointercapture',function(e){if(ptr&&ptr.moved&&e.pointerId===ptr.id)release(e,false)});
/* a mouse near an outer corner lifts it, so the visitor sees the page can turn */
function peekAt(e){
  if(state==='anim'||state==='drag')return;
  var f=frameXY(e),q=pagesOf(cur),zone=Math.min(90,pw*.2),s=0,cy=null;
  var outR=spread?2*pw:pw,nearY=f[1]<zone?0:(f[1]>ph-zone?1:-1);
  if(nearY>=0){
    if(f[0]>outR-zone&&f[0]<=outR+8&&cur<views()-1&&(spread?q.r!=null:true))s=1;
    else if(spread&&f[0]<zone&&f[0]>=-8&&cur>0&&q.l!=null)s=-1;
    cy=nearY===1;
  }
  if(!s){if(state==='peek'&&T&&!T.out){var t=T;t.out=1;run(t.rest,200,0,function(){if(T===t)end(false)},'peek')}return}
  if(state==='peek'&&T&&!T.out&&T.dir===s&&(T.cy>0)===cy){if(!T.settled)return;var L=localXY(e);render([Math.min(pw-8,L[0]),L[1]]);return}
  if(T)end(false);
  if(!begin(s,cy))return;
  var C=T.C,t2=T;run([C[0]-pw*.12,C[1]+(cy?-1:1)*ph*.07],220,0,function(){t2.settled=1},'peek');
}
view.addEventListener('pointerleave',function(){if(state==='peek'&&T&&!ptr&&!T.out){var t=T;t.out=1;run(t.rest,220,0,function(){if(T===t)end(false)},'peek')}});

/* ---------------- buttons, keys, the page number and the slider */
ctl.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(b){go(b.getAttribute('data-go')==='next'?1:-1);return}
  if(e.target.closest('[data-full]'))toggleFull()});
function typing(el){return el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable)}
function bookNear(){var r=view.getBoundingClientRect();return r.bottom>W.innerHeight*.25&&r.top<W.innerHeight*.75}
D.addEventListener('keydown',function(e){
  if(mode!=='book'||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='Escape'&&box.classList.contains('is-full')){toggleFull();return}
  if(typing(e.target)&&e.target!==scrub)return;
  if(!(isFull()||box.contains(D.activeElement)||bookNear()))return;
  var k=e.key,d=0;
  if(k==='ArrowRight')d=RTL?-1:1;else if(k==='ArrowLeft')d=RTL?1:-1;else if(k==='PageDown')d=1;else if(k==='PageUp')d=-1;
  else if(k==='Home'){e.preventDefault();jump(1);return}else if(k==='End'){e.preventDefault();jump(N);return}
  if(d&&e.target!==scrub){e.preventDefault();go(d)}
});
if(atIn){
  atIn.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var n=num(atIn.value);if(n)jump(n);atIn.select()}});
  atIn.addEventListener('change',function(){var n=num(atIn.value);if(n)jump(n);else say()});
  atIn.addEventListener('focus',function(){atIn.select()});
  atIn.addEventListener('blur',function(){setTimeout(say,0)});
}
if(scrub){var sT=0;scrub.addEventListener('input',function(){clearTimeout(sT);var n=+scrub.value;sT=setTimeout(function(){jump(n)},90)})}

/* ---------------- full screen: the browser's own when it has it, else the reader fills the window */
function toggleFull(){
  var on=isFull();
  if(on){if(D.fullscreenElement||D.webkitFullscreenElement){(D.exitFullscreen||D.webkitExitFullscreen).call(D)}else{box.classList.remove('is-full');H.classList.remove('rd-locked');afterFull()}return}
  var req=box.requestFullscreen||box.webkitRequestFullscreen;
  if(req){try{var p=req.call(box);if(p&&p.catch)p.catch(function(){fallbackFull()})}catch(_){fallbackFull()}}else fallbackFull();
  track('report_full',{where:'reader',id:RID});
}
function fallbackFull(){box.classList.add('is-full');H.classList.add('rd-locked');afterFull()}
function afterFull(){var on=isFull();box.classList.toggle('is-fs',on);
  if(fullB){fullB.setAttribute('aria-pressed',String(on));fullB.setAttribute('aria-label',fullB.getAttribute(on?'data-l-off':'data-l-on'))}
  setTimeout(layout,60)}
D.addEventListener('fullscreenchange',afterFull);D.addEventListener('webkitfullscreenchange',afterFull);

/* ---------------- the switch: flip through, or every page one under another */
var mode='scroll',io=null,seenPage=1;
function setMode(m,user){
  if(m===mode&&!user)return;
  if(isFull()&&m==='scroll')toggleFull();
  var keep=m==='book'?seenPage:(anchor+1);
  mode=m;box.setAttribute('data-view',m);bk.hidden=m!=='book';
  $$('[data-view]',bar).forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-view')===m))});
  if(m==='book'){anchor=keep-1;layout()}
  else{
    var li=D.getElementById('page-'+keep);
    if(user&&li){var y=li.getBoundingClientRect().top+W.scrollY-(parseFloat(getComputedStyle(H).getPropertyValue('--tabh'))||60)-(bar.offsetHeight||0)-12;
      W.scrollTo(0,Math.max(0,y))}
    sayScroll();
  }
  if(user){store('zq3s.reader',m);track('report_view',{where:'reader',id:m})}
}
bar.addEventListener('click',function(e){var b=e.target.closest('[data-view]');if(b)setMode(b.getAttribute('data-view'),true)});
/* the scroll reader: each page settles into place as it arrives, and the bar says which page is in view */
var lis=$$('li',list);
function sayScroll(){if(mode!=='scroll'||!countEl)return;countEl.textContent=tpl.replace('{n}',dg(seenPage)).replace('{t}',dg(N))}
if('IntersectionObserver' in W){
  if(!RM){box.classList.add('js-reveal');
    var rv=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('is-in');rv.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.04});
    lis.forEach(function(li,i){li.style.setProperty('--tilt',(i%2?1.6:-1.6)+'deg');rv.observe(li)})}
  io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){var n=lis.indexOf(x.target)+1;if(n>0){seenPage=n;sayScroll()}}})},{rootMargin:'-45% 0px -50% 0px'});
  lis.forEach(function(li){io.observe(li)});
}

/* ---------------- start: the page in the address, else the cover; the visitor's last choice, else the book */
var m0=/^#page-(\d+)$/.exec(W.location.hash||'');
if(m0){seenPage=Math.max(1,Math.min(N,+m0[1]))}
anchor=seenPage-1;
bar.hidden=false;
var pref=store('zq3s.reader');
var startScroll=pref==='scroll';
if(startScroll){mode='book';setMode('scroll')}else{setMode('book')}
if(m0&&startScroll){var li0=D.getElementById('page-'+seenPage);if(li0)li0.scrollIntoView()}
var rz=0;W.addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){if(mode==='book'&&!T)layout()},120)});
if(D.fonts&&D.fonts.ready)D.fonts.ready.then(function(){if(mode==='book'&&!T)layout()});
W.__book={go:go,jump:jump,setMode:setMode,state:function(){return {mode:mode,spread:spread,cur:cur,views:views(),shown:shown(),pw:pw,ph:ph,turning:!!T,st:state}},
  begin:begin,render:render,end:end,T:function(){return T}};
})();
