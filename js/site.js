/* ZQ3S site script, rebuild 2026-11-07. One file for every page; each part runs only where its elements exist.
   Made from the round-6 page's own script (the eyes, the cast stages, the trays, the planes of shapes, the floats,
   the accordions, the crew search) with the tabs taken out and four parts added: the player that loads a video only
   when it can play, the lazy loading of the cast library, the analytics slot (off) and the events it would send. */
(function(){
'use strict';
var D=document,W=window,H=D.documentElement;
var RM=W.matchMedia('(prefers-reduced-motion: reduce)').matches;
var AR=H.lang==='ar';
W.__crew={};
function $(s,r){return (r||D).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))}
function now(){return W.performance.now()}
if(!W.ZQ3S_T)W.ZQ3S_T=function(s){var d=W.ZQ3S_AR||{};return s&&Object.prototype.hasOwnProperty.call(d,s)&&d[s]?d[s]:s};
function T(s){return W.ZQ3S_T(s)}

/* ---------------- events, and the analytics slot (off until the owner switches it on in analytics.json)
   Every event is kept in window.ZQ3S_EVENTS whether the slot is on or off. When it is on, the build has put the
   provider's own snippet in the head and set window.ZQ3S_ANALYTICS.send, which turns an event into the provider's call.
   What is sent is only the event's name and a few short parameters (where, id, href): nothing about the visitor. */
var EV=W.ZQ3S_EVENTS=W.ZQ3S_EVENTS||[];
/* the parameters as the provider takes them: text or numbers, cut to 100 characters, empty ones left out, names cut to 40 */
function clean(p){var o={},k,v;for(k in p){if(!Object.prototype.hasOwnProperty.call(p,k))continue;v=p[k];
  if(v===''||v==null)continue;
  if(typeof v==='boolean')v=v?'true':'false';else if(typeof v!=='number')v=String(v).slice(0,100);
  o[k.slice(0,40)]=v}return o}
/* local: kept in the page's own list only, never sent (the arrival's tags, which the provider reads from the address) */
function track(name,props,local){var e={name:name,props:props||{},t:Math.round(now())};if(local)e.local=true;EV.push(e);
  if(local)return;
  var A=W.ZQ3S_ANALYTICS;if(A&&A.on&&typeof A.send==='function'){
    try{A.send(String(name).replace(/[^A-Za-z0-9_]/g,'_').slice(0,40),clean(e.props))}catch(_){}}}
W.ZQ3S_TRACK=track;
/* a click on a link that carries data-track, or on any link inside a box that carries data-track-in (the chapter list,
   the words), and a middle click too: someone who opens Subscribe in a new tab has chosen it as much as anyone */
function onClick(e){var t=e.target;if(!t||!t.closest)return;
  var a=t.closest('[data-track]');
  if(a){track(a.getAttribute('data-track'),{where:a.getAttribute('data-where')||'',href:a.getAttribute('href')||'',id:a.getAttribute('data-id')||''});return}
  var c=t.closest('[data-track-in]'),l=t.closest('a[href]');
  if(c&&l&&c.contains(l))track(c.getAttribute('data-track-in'),{where:c.getAttribute('data-where')||'',href:l.getAttribute('href')||'',id:c.getAttribute('data-id')||''})}
D.addEventListener('click',onClick,true);
D.addEventListener('auxclick',function(e){if(e.button===1)onClick(e)},true);
/* the arrival's tracking tags (utm_source, utm_medium, utm_campaign, utm_content), kept in the page's own list so they can be
   checked with the slot off. The provider reads the same tags from the address itself, so this entry is never sent. */
(function(){var q,u={},n=0;try{q=new URLSearchParams(W.location.search)}catch(_){return}
  ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(k){var v=q.get(k);
    if(v){u[k]=v.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,100);n++}});
  if(n)track('arrival',u,true)})();

/* ---------------- drawn-in sections (the crew map, the seams, the cast's tallies) */
var DRAWN='.map,.seams,.slot,.together,.ruling,.tally,.chap';
if('IntersectionObserver' in W){
  var draw=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('drawn');draw.unobserve(e.target)}
  })},{threshold:.12});
  $$(DRAWN).forEach(function(el){if(RM)el.classList.add('drawn');else draw.observe(el)});
}else{$$(DRAWN).forEach(function(el){el.classList.add('drawn')})}

/* ---------------- the eyes: every drawn character follows the pointer (a tap on touch screens) */
var PTR={x:0,y:0,t:-1e9},GAZE=function(){},HEROES=[];
function pointAt(x,y){PTR.x=x;PTR.y=y;PTR.t=now();HEROES.forEach(function(h){h.follow(x,y)});GAZE()}
if(!RM){
  D.addEventListener('pointermove',function(e){if(e.pointerType==='mouse')pointAt(e.clientX,e.clientY)},{passive:true});
  D.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')pointAt(e.clientX,e.clientY)},{passive:true});
}
function lookAtEl(el){if(RM||!el)return;var r=el.getBoundingClientRect();pointAt(r.left+Math.min(r.width/2,220),r.top+r.height/2)}

function Char(svg){
  var self=this;self.svg=svg;
  self.eyes=$$('[data-part="eye"]',svg).map(function(e){
    var w=$('[data-part="eye-white"]',e),p=$('[data-part="pupil"]',e);if(!w||!p)return null;
    var wb=w.getBBox(),pb=p.getBBox();
    return {w:w,p:p,cx:wb.x+wb.width/2-(pb.x+pb.width/2),cy:wb.y+wb.height/2-(pb.y+pb.height/2),
            mx:Math.max(2,wb.width/2-pb.width/2-3),my:Math.max(1.5,wb.height/2-pb.height/2-3)};
  }).filter(Boolean);
  self.m={};self.m0=null;
  ['closed','open','wide','rounded'].forEach(function(k){var el=$('[data-part="mouth-'+k+'"]',svg);
    if(el){self.m[k]=el;if(!self.m0&&getComputedStyle(el).display!=='none')self.m0=k}});
}
Char.prototype.center=function(){var r=this.svg.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height*.45}};
Char.prototype.lookAt=function(x,y){this.eyes.forEach(function(E){
  var r=E.w.getBoundingClientRect(),vx=x-(r.left+r.width/2),vy=y-(r.top+r.height/2),d=Math.sqrt(vx*vx+vy*vy);
  var k=Math.min(1,d/160),ux=d?vx/d*k:0,uy=d?vy/d*k:0;
  E.p.style.transform='translate('+(E.cx+ux*E.mx).toFixed(2)+'px,'+(E.cy+uy*E.my).toFixed(2)+'px)'})};
Char.prototype.viewer=function(){this.eyes.forEach(function(E){E.p.style.transform='translate('+E.cx.toFixed(2)+'px,'+E.cy.toFixed(2)+'px)'})};
Char.prototype.rest=function(){this.eyes.forEach(function(E){E.p.style.transform=''})};
Char.prototype.mouth=function(k){var m=this.m;for(var n in m)m[n].style.display=(n===k)?'inline':'none'};
Char.prototype.blink=function(){var s=this.svg;s.classList.add('blink');setTimeout(function(){s.classList.remove('blink')},130)};
Char.prototype.talk=function(n){var self=this,seq=[],i=0;for(var j=0;j<n;j++)seq.push('rounded','closed');seq.push(self.m0||'closed');
  (function step(){if(i>=seq.length)return;self.mouth(seq[i++]);setTimeout(step,120+Math.random()*70)})()};
function hero(fig){
  var chars=$$('svg.char',fig).map(function(x){return new Char(x)});if(!chars.length)return null;
  var on=false,t={},hold=0,fhold=0,turn=0,pq=0,px=0,py=0,talks=0;
  function later(k,fn,ms){clearTimeout(t[k]);t[k]=setTimeout(fn,ms)}
  function rest(){chars.forEach(function(c){c.rest()})}
  function idle(){
    var n=now();if(n<hold||n<fhold)return;var r=Math.random();
    if(r<.45){var s=chars[turn++%chars.length],p=s.center();talks++;
      chars.forEach(function(o){if(o!==s)o.lookAt(p.x,p.y)});s.viewer();s.talk(2+(Math.random()*2|0));later('back',rest,2000)}
    else if(r<.75){chars.forEach(function(o){o.viewer()});later('back',rest,1500)}
    else rest();
  }
  function start(){if(on||RM)return;on=true;
    chars.forEach(function(c,i){(function loop(){if(!on)return;c.blink();later('b'+i,loop,2600+Math.random()*4400)})()});
    later('idle',function f(){if(!on)return;idle();later('idle',f,3600+Math.random()*2800)},1800)}
  function stop(){on=false;for(var k in t)clearTimeout(t[k]);t={}}
  function look(x,y,ms){if(RM||!on)return;hold=now()+(ms||1900);chars.forEach(function(o){o.lookAt(x,y)});later('back',rest,ms||1900)}
  function lookEl(el,ms){if(!el)return;var r=el.getBoundingClientRect();look(r.left+r.width/2,r.top+r.height/2,ms)}
  function say(i,el){if(RM||!on)return;var s=chars[i]||chars[0],p=s.center();hold=now()+2600;talks++;
    chars.forEach(function(o){if(o!==s)o.lookAt(p.x,p.y)});if(el){var r=el.getBoundingClientRect();s.lookAt(r.left+r.width/2,r.top+r.height/2)}else s.viewer();
    s.talk(4);later('back',rest,2600)}
  function follow(x,y){px=x;py=y;if(pq||!on)return;pq=requestAnimationFrame(function(){pq=0;
    if(on&&now()>hold-900){fhold=now()+2400;chars.forEach(function(o){o.lookAt(px,py)});later('back',rest,2400)}})}
  if('IntersectionObserver' in W)new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!D.hidden)start();else stop()})}).observe(fig);
  else start();
  D.addEventListener('visibilitychange',function(){if(D.hidden)stop();else{var r=fig.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)start()}});
  /* what the visitor is about to press, the three look at */
  function aim(e){var x=e.target.closest&&e.target.closest('.player-btn,.ep-t a,[data-look]');if(x)lookEl(x,2200)}
  fig.addEventListener('pointerover',aim);fig.addEventListener('focusin',aim);
  var h={fig:fig,follow:follow,look:look,lookEl:lookEl,say:say,chars:chars,on:function(){return on},talks:function(){return talks}};
  return h;
}
$$('[data-hero]').forEach(function(f){var h=hero(f);if(h)HEROES.push(h)});
W.__crew.heroes=HEROES;W.__crew.hero=HEROES[0]||null;
function heroOf(el){for(var i=0;i<HEROES.length;i++)if(HEROES[i].fig.contains(el))return HEROES[i];return null}
/* the hero's buttons outside the figure: the three look at whichever one is about to be pressed */
$$('[data-look-for]').forEach(function(b){var h=null;function go(){h=h||HEROES.filter(function(x){return x.fig.id===b.getAttribute('data-look-for')})[0];if(h)h.lookEl(b,2200)}
  b.addEventListener('pointerenter',go);b.addEventListener('focus',go)});

/* ---------------- the player: the thumbnail first; the video loads only when it can play */
$$('.player[data-yt]').forEach(function(p){var b=$('.player-btn',p);if(!b)return;
  b.addEventListener('click',function(){
    var id=p.getAttribute('data-yt'),pub=p.getAttribute('data-public')==='1',h=heroOf(p);
    track('play',{id:id,where:p.getAttribute('data-where')||'',public:pub});
    if(!pub){var n=$('.player-note',p);if(n){n.hidden=false;if(h)h.say(1,n)}return}
    var f=D.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0&playsinline=1&hl='+(AR?'ar':'en');
    f.title=b.getAttribute('aria-label')||'';f.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    f.setAttribute('allowfullscreen','');f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    p.appendChild(f);b.remove();var img=$('img',p);if(img)img.remove();p.classList.add('is-live');if(h)h.lookEl(p,3000);
  });
});
D.addEventListener('click',function(e){var a=e.target.closest('[data-play-for]');if(!a)return;var p=D.getElementById(a.getAttribute('data-play-for'));
  var b=p&&$('.player-btn',p);if(!b)return;e.preventDefault();
  var r=p.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight)p.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});b.click()});
/* a chapter's time plays the film on the page from there (Luay, 2026-11-11); with a modifier key it opens YouTube */
D.addEventListener('click',function(e){var a=e.target.closest('a[data-seek]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button>0)return;
  var p=D.getElementById(a.getAttribute('data-seek-for'));if(!p||p.getAttribute('data-public')!=='1')return;
  e.preventDefault();var t=parseInt(a.getAttribute('data-seek'),10)||0,f=$('iframe',p);
  var src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(p.getAttribute('data-yt'))+'?autoplay=1&rel=0&playsinline=1&start='+t+'&hl='+(AR?'ar':'en');
  if(!f){var b=$('.player-btn',p);if(b)b.click();f=$('iframe',p)}
  if(f)f.src=src;
  var r=p.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight)p.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'})});
/* the phone menu closes on a click outside it and on Escape */
$$('details.sb-m').forEach(function(d){
  D.addEventListener('click',function(e){if(d.open&&!d.contains(e.target))d.open=false});
  D.addEventListener('keydown',function(e){if(e.key==='Escape'&&d.open){d.open=false;var s=$('summary',d);if(s)s.focus()}})});

/* ---------------- the cast library loads when a stage is near (or at once on the cast page), never before the
   first screen has drawn */
var castEls=$$('[data-cast],[data-scene]'),castGo=null;
W.ZQ3S_CAST_READY=new Promise(function(res,rej){castGo=function(){castGo=function(){};
  function load(src){return new Promise(function(ok,no){if(!src)return ok();var s=D.createElement('script');s.src=src;s.async=false;
    s.onload=function(){ok()};s.onerror=function(){no(new Error(src))};D.head.appendChild(s)})}
  Promise.all([load(H.getAttribute('data-words-src')),load(H.getAttribute('data-cast-src'))]).then(function(){res(W.ZQ3SCast)},rej)}});
if(castEls.length&&H.getAttribute('data-cast-src')){
  if(D.body.hasAttribute('data-cast-now'))castGo();
  else{
    if('IntersectionObserver' in W){var near=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){near.disconnect();castGo()}},{rootMargin:'0px 0px 140% 0px'});
      castEls.forEach(function(el){near.observe(el)})}
    W.addEventListener('load',function(){setTimeout(function(){(W.requestIdleCallback||function(f){setTimeout(f,1)})(function(){castGo()},{timeout:4000})},2500)});
  }
}

/* ---------------- the cast stages and their trays (the round-6 page's code) */
(function(){
  var R=W.ZQ3S_CAST_READY;if(!R||!castEls.length)return;
  function html(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var PLAY='<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"/></svg>';
  R.then(function(){
    var C=W.ZQ3SCast,L=W.ZQ3S_REACTIONS;if(!C||!L)return;
    var groups=L.groups(),actors={},busy={},pend={},cued={},vis=false,boxes=[],G=[],stageKeys={};
    groups.forEach(function(g){if(g.stage)g.items.forEach(function(r){stageKeys[r.key]=r.name})});
    function gaze(who,c,st){if(c&&c.base&&('look' in c.base))G.push({who:who,c:c,st:st,id:c.id,F:(c.def&&c.def.facing)||1,
      b0:[c.base.look,c.base.lookY],cur:[c.base.look,c.base.lookY]})}
    $$('[data-cast]').forEach(function(box){
      var id=box.getAttribute('data-cast');box.innerHTML='';box.classList.add('has-cast');
      var c=C.create(id,box);c.svg.setAttribute('aria-hidden','true');c.svg.setAttribute('focusable','false');
      actors[id]={c:c,fig:box.closest('figure'),tray:$('[data-acts="'+id+'"]'),level:L.LEVEL||4};boxes.push(box);gaze(id,c,null);
    });
    $$('[data-scene]').forEach(function(sc){var key=sc.getAttribute('data-scene')||'scene',vb=sc.getAttribute('data-vb'),fig=sc.closest('figure');
      $$('.hc-poster',sc).forEach(function(p){p.remove()});
      var st=C.scene(sc,vb?{viewBox:vb}:{});
      st.svg.setAttribute('aria-hidden','true');fig.hidden=false;fig.classList.add('is-live');
      actors[key]={c:st,fig:fig,tray:$('[data-acts="'+key+'"]'),level:L.LEVEL||4};boxes.push(sc);
      for(var id in st.chars)gaze(key,st.chars[id],st)});
    function sync(){if(RM){if(Object.keys(busy).length)C.start();else C.stop();return}
      if((vis||Object.keys(busy).length)&&!D.hidden)C.start();else C.stop()}
    function isScene(who){var a=actors[who];return !!(a&&a.c.chars)}
    function has(who,key){if(isScene(who)&&stageKeys[key])return true;
      return C.reactions(isScene(who)?'zq':who).some(function(r){return r.key===key})}
    function nameOf(who,key){if(isScene(who)&&stageKeys[key])return stageKeys[key];
      var list=C.reactions(isScene(who)?'zq':who);for(var i=0;i<list.length;i++)if(list[i].key===key)return list[i].name;return key}
    function setNow(who,t){var n=actors[who]&&actors[who].fig&&$('.now-name',actors[who].fig);if(n&&n.textContent!==t){var h0=n.offsetHeight;n.textContent=t;
      if(n.offsetHeight!==h0&&W.__crew.relayout)W.__crew.relayout()}}
    function setUse(who,key){var a=actors[who],u=a&&a.fig&&$('.use',a.fig);if(!u)return;
      var t=key&&L.use?T(L.use(key)||''):'';u.textContent=t?T('Use it when: {use}').replace('{use}',t):'';u.classList.toggle('on',!!t)}
    function play(who,key,lv,done,extra){
      var a=actors[who];if(!a||!has(who,key)){if(done)setTimeout(done,0);return}var token={};busy[who]=token;
      var bs=a.tray?$$('.act[data-k="'+key+'"]',a.tray):[];
      if(a.tray)$$('.act[aria-pressed="true"]',a.tray).forEach(function(x){x.setAttribute('aria-pressed','false')});
      bs.forEach(function(b){b.setAttribute('aria-pressed','true')});setNow(who,T(nameOf(who,key)));setUse(who,key);
      a.c.play(key,Object.assign({level:lv||a.level},extra||{},{onEnd:function(){
        if(busy[who]!==token)return;bs.forEach(function(b){b.setAttribute('aria-pressed','false')});
        setNow(who,T(isScene(who)?'All three at rest':'Calm base'));setUse(who,null);
        setTimeout(function(){if(busy[who]!==token)return;delete busy[who];
          if(pend[who]){var k=pend[who];delete pend[who];cue(who,k)}sync();if(done)done()},400)}}));
      sync();
    }
    function hold(who,on){if(on)busy[who]=busy[who]||{held:1};else if(busy[who]&&busy[who].held)delete busy[who];sync()}
    function cue(who,key){if(RM||!actors[who]||cued[who+':'+key])return;if(busy[who]){pend[who]=key;return}cued[who+':'+key]=1;play(who,key)}
    function chip(r){var u=L.use&&T(L.use(r.key)||'');return '<button type="button" class="act" data-k="'+html(r.key)+'" aria-pressed="false"'+
      (u?' title="'+html(u)+'"':'')+'><span class="an">'+html(r.num)+'</span>'+html(T(r.name))+'</button>'}
    Object.keys(actors).forEach(function(who){
      var a=actors[who],tray=a.tray;if(!tray)return;var sceneTray=isScene(who);
      var gs=groups.filter(function(g){return !!g.stage===sceneTray}).map(function(g){
        return {g:g,items:sceneTray?g.items:C.reactions(who).filter(function(r){return r.group===g.key})}}).filter(function(x){return x.items.length});
      if(!gs.length)return;
      var all=[].concat.apply([],gs.map(function(x){return x.items}));
      var q=(tray.getAttribute('data-quick')||'').split(' ').map(function(k){return all.filter(function(r){return r.key===k})[0]}).filter(Boolean);
      if(q.length<3)q=all.slice(0,6);
      var lvs=L.LEVELS||[],id='acts-'+who+'-all';
      tray.innerHTML='<div class="acts-h"><span class="acts-t">'+PLAY+T(sceneTray?'Make them act':'Make him act')+'</span>'+
        (lvs.length?'<div class="lv" role="group" aria-label="'+html(T('Intensity'))+'"><span class="lv-l">'+html(T('Intensity'))+'</span>'+lvs.map(function(l){
          return '<button type="button" class="lvb" data-lv="'+l.n+'" aria-pressed="'+(l.n===a.level)+'" title="'+html(l.n+' '+T(l.name)+': '+T(l.note))+'">'+
            l.n+'<span class="lvn">'+html(T(l.name))+'</span></button>'}).join('')+'</div>':'')+'</div>'+
        '<div class="chips quick">'+q.map(chip).join('')+'</div>'+
        '<div class="acts-all" data-acc><button type="button" class="all-btn" aria-expanded="false" aria-controls="'+id+'"><span>'+html(T(sceneTray?'All {n} scenes and moments':'All {n} moves').replace('{n}',all.length))+'</span><span class="tg" aria-hidden="true"></span></button>'+
        '<div class="acc-p" id="'+id+'"><div class="acc-in"><div class="all-in"><div class="agroups">'+gs.map(function(x,i){
          return '<button type="button" class="agb" data-g="'+i+'" aria-pressed="'+(i===0)+'">'+html(T(x.g.label||x.g.title))+'<span class="gn">'+x.items.length+'</span></button>'}).join('')+'</div>'+
        gs.map(function(x,i){return '<div class="chips" data-gp="'+i+'"'+(i?' hidden':'')+'>'+x.items.map(chip).join('')+'</div>'}).join('')+'</div></div></div></div>';
      tray.hidden=false;tray.removeAttribute('data-pending');
      tray.addEventListener('click',function(e){
        var v=e.target.closest('.lvb');
        if(v){a.level=+v.getAttribute('data-lv');$$('.lvb',tray).forEach(function(x){x.setAttribute('aria-pressed',String(x===v))});return}
        var g=e.target.closest('.agb');
        if(g){$$('.agb',tray).forEach(function(x){x.setAttribute('aria-pressed',String(x===g))});
          $$('[data-gp]',tray).forEach(function(p){p.hidden=p.getAttribute('data-gp')!==g.getAttribute('data-g')});
          if(W.__crew.relayout)W.__crew.relayout();return}
        var b=e.target.closest('.act');if(!b)return;
        var art=$('[data-cast],[data-scene]',a.fig)||a.fig,fr=art.getBoundingClientRect(),bar=$('.site-bar'),th=bar?bar.getBoundingClientRect().bottom:0;
        var seen=Math.max(0,Math.min(fr.bottom,innerHeight)-Math.max(fr.top,th));
        if(seen<fr.height*.7)art.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});
        track('cast_move',{where:who,id:b.getAttribute('data-k')});
        play(who,b.getAttribute('data-k'));
      });
    });
    var STAGE=C.STAGE||{w:1600,x:{'3':330,zq:800,s:1270}},graf=0;
    function eyeAt(g){var r=(g.st?g.st.svg:g.c.svg).getBoundingClientRect();if(!r.width)return null;
      return {x:r.left+(g.st?r.width*(STAGE.x[g.id]||800)/STAGE.w:r.width/2),y:r.top+r.height*.4,r:r}}
    function gazeTick(){graf=0;var live=now()-PTR.t<2600,more=false,vh=innerHeight;
      G.forEach(function(g){if(busy[g.who])return;var tl=g.b0[0],ty=g.b0[1];
        if(live){var e=eyeAt(g);if(e&&e.r.bottom>0&&e.r.top<vh){var dx=PTR.x-e.x,dy=PTR.y-e.y,d=Math.sqrt(dx*dx+dy*dy)||1,k=Math.min(1,d/240);
          tl=Math.max(-1,Math.min(1,g.b0[0]*(1-k)+dx/d*k*g.F));ty=Math.max(-.6,Math.min(.85,g.b0[1]*(1-k)+dy/d*k*.75))}}
        g.cur[0]+=(tl-g.cur[0])*.16;g.cur[1]+=(ty-g.cur[1])*.16;
        if(Math.abs(tl-g.cur[0])>.004||Math.abs(ty-g.cur[1])>.004)more=true;else{g.cur[0]=tl;g.cur[1]=ty}
        g.c.base.look=g.cur[0];g.c.base.lookY=g.cur[1]});
      if(more||live)graf=requestAnimationFrame(gazeTick)}
    GAZE=function(){if(!RM&&!graf&&G.length)graf=requestAnimationFrame(gazeTick)};
    if('IntersectionObserver' in W&&!RM){
      function onCue(io){return function(es){es.forEach(function(e){if(!e.isIntersecting)return;var v=e.target.getAttribute('data-cue').split(':');
        cue(v[0],v[1]);io.unobserve(e.target)})}}
      var early=new IntersectionObserver(function(es){onCue(early)(es)},{threshold:.08});
      var late=new IntersectionObserver(function(es){onCue(late)(es)},{threshold:.45});
      $$('[data-cue]').forEach(function(el){(el.hasAttribute('data-cue-early')?early:late).observe(el)});
    }
    C.drawAll(0);
    if('IntersectionObserver' in W){
      var seen=new IntersectionObserver(function(es){es.forEach(function(e){e.target.__on=e.isIntersecting});
        vis=boxes.some(function(x){return x.__on});sync()});
      boxes.forEach(function(x){seen.observe(x)});
    }else{vis=true;sync()}
    D.addEventListener('visibilitychange',sync);
    W.__crew.cast={actors:actors,busy:busy,play:play,cued:cued,gaze:G,hold:hold,setNow:setNow,setUse:setUse};
    if(W.__crew.relayout)W.__crew.relayout();
    (W.__crew.runs||[]).forEach(function(r){if(!RM)r.replay()});
  },function(){});
})();

/* ---------------- step-by-step sections: each step plays on its stage as it reaches the middle of the screen */
W.__crew.runs=[];
$$('[data-steps]').forEach(function(run){
  var steps=$$('.step',run),rail=$$('.rail li',run),sc=$('[data-scene]',run),who=sc?sc.getAttribute('data-scene'):'',cur=0,alt={},seq=0;
  if(!steps.length||!who)return;
  function keys(i){var spec=steps[i-1].getAttribute('data-play')||'';
    if(spec.indexOf('|')>-1){var o=spec.split('|');alt[i]=(alt[i]||0)+1;return [o[(alt[i]-1)%o.length]]}
    return spec.split('>').filter(Boolean)}
  function mark(i){steps.forEach(function(x,j){x.classList.toggle('on',j===i-1)});
    rail.forEach(function(li,j){li.classList.toggle('on',j===i-1);li.classList.toggle('done',j<i-1)})}
  function playStep(i){var K=W.__crew.cast;if(!K||!K.actors[who]||!i)return;var my=++seq,ks=keys(i);
    (function next(j){if(my!==seq||j>=ks.length)return;K.play(who,ks[j],null,function(){next(j+1)})})(0)}
  function go(i,force){if(i===cur&&!force)return;cur=i;mark(i);if(!RM||force)playStep(i)}
  if('IntersectionObserver' in W){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)go(+e.target.getAttribute('data-step'))})},
      {rootMargin:'-46% 0px -46% 0px'});
    steps.forEach(function(x){io.observe(x)});
  }
  run.addEventListener('click',function(e){var b=e.target.closest('.st-play');if(!b)return;
    var st=$('.run-stage',run),r=st.getBoundingClientRect();
    if(r.bottom<60||r.top>innerHeight-60)st.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});
    go(+b.getAttribute('data-run'),true)});
  W.__crew.runs.push({go:go,cur:function(){return cur},replay:function(){if(cur)playStep(cur)}});
});

/* ---------------- accordions, lanes and the crew search (team page) */
function setOpen(btn,open){
  if((btn.getAttribute('aria-expanded')==='true')===open)return;
  btn.setAttribute('aria-expanded',String(open));
  var box=btn.closest('[data-acc]');if(box)box.classList.toggle('is-open',open);
  if(open)lookAtEl(btn);
  layoutChanged();
}
D.addEventListener('click',function(e){
  var b=e.target.closest('button[aria-expanded][aria-controls]');
  if(b){setOpen(b,b.getAttribute('aria-expanded')!=='true');return}
  var a=e.target.closest('a[data-open]');
  if(a){e.preventDefault();openLane(a.getAttribute('data-open'))}
});
var q=$('#find'),status=$('#find-status'),empty=$('#find-empty'),seats=$$('.seat[data-s]'),TOTAL=+(D.body.getAttribute('data-total')||0);
function openLane(id){
  var lane=D.getElementById(id);if(!lane)return;
  if(lane.hidden&&q){q.value='';filter()}
  var b=$('.lane-h button',lane);if(b)setOpen(b,true);
  lane.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
  if(b)b.focus({preventScroll:true});
}
var oa=$('#open-all'),ca=$('#close-all');
if(oa)oa.addEventListener('click',function(){
  $$('.lane-h button,.team-h button').forEach(function(b){if(!b.closest('[hidden]'))setOpen(b,true)});
});
if(ca)ca.addEventListener('click',function(){
  $$('[data-acc] button[aria-expanded="true"]').forEach(function(b){setOpen(b,false)});
  var s=$('.bar-sym');if(s&&!RM){s.classList.remove('redraw');void s.getBoundingClientRect();s.classList.add('redraw')}
});
function norm(t){return t.toLowerCase().replace(/[ً-ٰٟ]/g,'').trim()}
function setCount(box,n,t){var c=box&&$('.cnt',box);if(!c)return;var tot=+c.getAttribute('data-total');
  c.textContent=t?T('{n} of {total}').replace('{n}',n).replace('{total}',tot):T(tot===1?'{n} seat':'{n} seats').replace('{n}',tot)}
function filter(){
  var t=norm(q.value),shown=0;
  seats.forEach(function(s){var m=!t||s.getAttribute('data-s').indexOf(t)>-1;s.hidden=!m;if(m)shown++});
  $$('.team').forEach(function(tm){var n=$$('.seat',tm).filter(function(s){return !s.hidden}).length;
    tm.hidden=!!t&&n===0;setCount($('.team-h',tm),n,t);if(t&&n)setOpen($('.team-h button',tm),true)});
  $$('.lane').forEach(function(l){var n=$$('.seat',l).filter(function(s){return !s.hidden}).length;
    l.hidden=!!t&&n===0;setCount($('.lane-h',l),n,t);if(t&&n)setOpen($('.lane-h button',l),true)});
  if(status)status.textContent=t?T('{n} of {total} seats match').replace('{n}',shown).replace('{total}',TOTAL):T('{n} seats').replace('{n}',TOTAL);
  if(empty)empty.hidden=!(t&&shown===0);
  layoutChanged();
}
if(q){q.addEventListener('input',filter);q.addEventListener('keydown',function(e){if(e.key==='Escape'&&q.value){q.value='';filter()}})}

/* ---------------- the planes of shapes, the floats round each actor, the coin */
var shapes=$$('.sh').map(function(el){var d=el.dataset,lay=d.local?el.closest('.decor'):null;return {el:el,near:el.parentNode.classList.contains('plane-near'),
  a:lay?lay.parentNode:$(d.a),lay:lay,at:+d.at,v:+d.v,k:RM?1:+d.k,x:+d.x,px:+d.px,s:+d.s,ps:+d.ps,r:+d.r,z:0}}).filter(function(s){return s.a});
var bar=$('.bar'),rects=[],dirty=true,dirtyUntil=0,raf=0,lastT=0,syPrev=null;
var evW=$$('.actor-wrap').map(function(w){return {w:w,c:w.closest('.chap')||w,evs:$$('.ev',w).map(function(e){var d=+(e.className.match(/ev-(\d)/)||[0,0])[1];return {e:e,k:+e.getAttribute('data-k'),pr:[0,2,1][d]}}).sort(function(a,b){return a.pr-b.pr})}});
function treeVisible(el){
  if(el.closest('[hidden]'))return false;
  var p=el.parentElement&&el.parentElement.closest('.acc-p');
  while(p){if(!p.parentElement.classList.contains('is-open'))return false;p=p.parentElement.closest('.acc-p')}
  return true;
}
var live=[],allR=[];
function cache(){
  var sy=W.scrollY;rects=[];live=[];
  $$('[data-read]').filter(treeVisible).forEach(function(el){
    if(el.closest('.prof-id')){live.push(el);return}
    var r=el.getBoundingClientRect();if(r.bottom>r.top)rects.push({t:r.top+sy,b:r.bottom+sy,l:r.left,r:r.right})});
  var vw=H.clientWidth,m=vw<760?8:16;
  evW.forEach(function(ew){var wr=ew.w.getBoundingClientRect();if(!wr.width)return;
    var mid=(wr.left+wr.right)/2,L=m,R=vw-m,g=ew.w.closest('.prof-grid');
    if(g)$$('.pintro,.acts,.prof-body',g).forEach(function(b){if(b.parentNode!==g)return;var q=b.getBoundingClientRect();if(!q.width)return;
      if(q.right<=mid)L=Math.max(L,q.right+12);else if(q.left>=mid)R=Math.min(R,q.left-12)});
    var kept=[],art=$('.actor-art svg',ew.w),ar=art&&art.getBoundingClientRect(),
      fz=ar&&ar.width?{l:ar.left+ar.width*.2,r:ar.right-ar.width*.2,t:ar.top+ar.height*.12,b:ar.top+ar.height*.62}:null,
      ff=+(ew.w.getAttribute('data-face')||.32),face=ar&&ar.width?{l:ar.left+ar.width*ff,r:ar.right-ar.width*ff,t:ar.top+ar.height*.16,b:ar.top+ar.height*.5}:null,
      capEl=$('.actor figcaption',ew.w),useEl=$('.actor .use',ew.w),cr=capEl?capEl.getBoundingClientRect():null,ur=useEl?useEl.getBoundingClientRect():null,
      cap=cr&&cr.width?{left:wr.left,right:wr.right,top:cr.top,bottom:Math.max(cr.bottom,ur&&ur.height?ur.bottom:0),width:1}:null;
    ew.evs.forEach(function(x){x.e.classList.remove('ev-off');var r=x.e.getBoundingClientRect();if(!r.width)return;
      var dx=x.dx||0,l=r.left-dx,rt=r.right-dx,d=0,j,o;
      if(rt-l>R-L){x.e.classList.add('ev-off');return}
      if(l<L)d=L-l;else if(rt>R)d=R-rt;
      if(x.k<-100&&Math.abs(d)>20){x.e.classList.add('ev-off');return}
      if(x.k<-100&&fz){var hy=Math.abs(x.k)*.6,ix=Math.min(rt+d,fz.r)-Math.max(l+d,fz.l),iy=Math.min(r.bottom+hy,fz.b)-Math.max(r.top-hy,fz.t);
        if(ix>4&&iy>4){x.e.classList.add('ev-off');return}}
      var k=RM?0:x.k,py=RM?0:(parseFloat(x.e.style.getPropertyValue('--py'))||0),t0=r.top-py,b0=r.bottom-py;
      if(x.pr===0&&face){var iy0=Math.min(r.bottom+24,face.b)-Math.max(r.top-24,face.t);
        if(iy0>4&&Math.min(rt+d,face.r)-Math.max(l+d,face.l)>4){var cxm=(l+rt)/2+d,fcx=(face.l+face.r)/2;
          d=cxm<fcx?face.l-6-rt:face.r+6-l;if(l+d<L||rt+d>R){x.e.classList.add('ev-off');return}}}
      if(cap&&cap.width){var hc=Math.abs(x.k)*.85+6,pz=parseFloat(x.e.style.getPropertyValue('--py'))||0;
        if(Math.min(rt+d,cap.right)-Math.max(l+d,cap.left)>2&&Math.min(r.bottom-pz+hc,cap.bottom)-Math.max(r.top-pz-hc,cap.top)>2){x.e.classList.add('ev-off');return}}
      for(j=0;j<kept.length;j++){o=kept[j];if((o.pr&&x.pr&&o.pr!==x.pr)||Math.min(rt+d,o.r)-Math.max(l+d,o.l)<=4)continue;
        if(Math.max(o.t-b0,t0-o.b)<.6*Math.abs(k-o.k)+4){x.e.classList.add('ev-off');return}}
      kept.push({l:l+d,r:rt+d,t:t0,b:b0,k:k,pr:x.pr});
      d=Math.round(d);if(d!==dx){x.dx=d;x.e.style.setProperty('--dx',d+'px')}})});
}
function size(){
  var vw=H.clientWidth,vh=innerHeight,ph=vw<760;
  shapes.forEach(function(s){var z=ph?s.ps*vw:Math.min(s.s*vh,s.s*vw*1.1);s.z=z;
    s.el.style.width=s.el.style.height=z.toFixed(0)+'px';
    if(s.near)s.el.style.setProperty('--b',Math.max(3,z*.014).toFixed(1)+'px')});
}
function envelope(cx,cy,R,sy,vh,br,FADE){
  var best=1e9,i,q,t,b,dx,dy,d;
  for(i=0;i<allR.length;i++){q=allR[i];t=Math.max(-60,q.t-sy);b=Math.min(vh+60,q.b-sy);if(b<=t)continue;
    dx=Math.max(q.l-cx,0,cx-q.r);dy=Math.max(t-cy,0,cy-b);d=Math.sqrt(dx*dx+dy*dy)-R;if(d<best)best=d}
  if(br&&br.bottom>0){dx=Math.max(br.left-cx,0,cx-br.right);dy=Math.max(br.top-cy,0,cy-br.bottom);d=Math.sqrt(dx*dx+dy*dy)-R;if(d<best)best=d}
  return Math.max(0,Math.min(1,best/FADE));
}
var COINS=$$('[data-coin]').map(function(s){return {s:s,c:$('.coin-in',s)}}).filter(function(x){return x.c});
var MN=$('#show-name'),NP=null;
if(MN){var nsv=$('.namesvg',MN);if(nsv)NP={z:$('#n-logo-letter-z',nsv),q:$('#n-logo-letter-q',nsv),s:$('#n-logo-letter-s',nsv),
  tri:$('#n-logo-triangle',nsv),cir:$('#n-logo-circle',nsv),sq:$('#n-logo-square',nsv),tags:$('.name-tags',MN),fig:$('.name-fig',MN),e:-1}}
function c01(v){return v<0?0:v>1?1:v}
function sstep(v){return v*v*(3-2*v)}
function tr(el,x,y){if(el)el.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px)'}
function motifs(vh){
  COINS.forEach(function(x){if(!x.s.getClientRects().length)return;var r=x.s.getBoundingClientRect();
    if(r.bottom>-60&&r.top<vh+60){var p=c01((vh-r.top)/(vh+r.height));x.c.style.setProperty('--cf',(RM?0:p*900).toFixed(1)+'deg')}});
  /* the name comes apart into its three, ZQ, 3 and S (the round-6 page's motif, now on the cast page) */
  if(NP&&MN.getClientRects().length){var r2=MN.getBoundingClientRect();
    var fr=NP.fig.getBoundingClientRect();if(r2.bottom>-60&&r2.top<vh+60){var e=RM?1:sstep(c01((vh*.92-fr.top)/(vh*.5)));
      if(Math.abs(e-NP.e)>.0005){NP.e=e;var a=Math.sin(Math.PI*e);
        tr(NP.z,-36*e,0);tr(NP.q,-36*e,0);tr(NP.s,36*e,0);
        tr(NP.cir,-138*e,-20*a);tr(NP.tri,165.5*e,24*a);tr(NP.sq,36.5*e,0);
        NP.tags.style.setProperty('--nt',c01((e-.62)/.3).toFixed(3))}}}
}
function frame(){
  raf=0;
  if(dirty||now()<dirtyUntil){cache();dirty=false}
  var tN=now(),dt=lastT?Math.min(1/30,(tN-lastT)/1000):0,settling=false;lastT=tN;
  var dsy=syPrev==null?0:W.scrollY-syPrev;syPrev=W.scrollY;
  var vw=H.clientWidth,vh=innerHeight,ph=vw<760,sy=W.scrollY,br=bar?bar.getBoundingClientRect():null,i,s,a,ys=[];
  var ls=[];
  allR=rects.concat(live.map(function(el){var r=el.getBoundingClientRect();return {t:r.top+sy,b:r.bottom+sy,l:r.left,r:r.right}}));
  for(i=0;i<shapes.length;i++){a=shapes[i].a.getBoundingClientRect();ys.push(a.top+a.height*shapes[i].at);ls.push(shapes[i].lay?shapes[i].lay.getBoundingClientRect():null)}
  for(i=0;i<shapes.length;i++){
    if(!shapes[i].a.getClientRects().length){shapes[i].op=0;shapes[i].pp=null;shapes[i].lag=0;shapes[i].el.style.opacity='0';continue}
    s=shapes[i];var p=ys[i];
    if(s.pp!=null&&!RM){var J=p-(s.pp-dsy);if(Math.abs(J)>1)s.lag=(s.lag||0)+J}s.pp=p;
    if(s.lag){s.lag*=Math.exp(-dt/.2);if(Math.abs(s.lag)<.5)s.lag=0;else settling=true;p-=s.lag}
    var cy=RM?p:s.v*vh+s.k*(p-s.v*vh),cx=(ph?s.px:s.x)*vw,z=s.z,R=z*(s.near?.56:.5);
    var rot=s.r+(RM?0:(cy/vh-.5)*s.k*5);
    var ox=ls[i]?ls[i].left:0,oy=ls[i]?ls[i].top:0;
    s.el.style.transform='translate3d('+(cx-z/2-ox).toFixed(1)+'px,'+(cy-z/2-oy).toFixed(1)+'px,0) rotate('+rot.toFixed(2)+'deg)';
    var o;
    if(cy+R<-40||cy-R>vh+40)o=0;
    else if(!s.near)o=envelope(cx,cy,R,sy,vh,null,Math.max(60,R*.8));
    else o=envelope(cx,cy,R,sy,vh,br,ph?Math.max(96,R*1.05):Math.max(120,R*.9));
    if(s.op==null)s.op=0;
    if(RM)s.op=o;
    else{s.op+=(o-s.op)*(1-Math.exp(-dt/(o<s.op?.09:.16)));if(Math.abs(o-s.op)<.003)s.op=o;else settling=true}
    s.el.style.opacity=s.op.toFixed(3);
  }
  if(!RM)for(i=0;i<evW.length;i++){var ew=evW[i],er=ew.c.getBoundingClientRect();if(!er.height||er.bottom<0||er.top>vh)continue;
    var ep=(vh/2-(er.top+er.height/2))/er.height;ew.evs.forEach(function(x){x.e.style.setProperty('--py',(ep*x.k).toFixed(1)+'px')})}
  motifs(vh);
  if(settling)schedule();
}
function schedule(){if(!raf)raf=requestAnimationFrame(frame)}
function layoutChanged(){dirty=true;dirtyUntil=now()+700;schedule();
  var until=dirtyUntil;(function tick(){if(now()<until){schedule();requestAnimationFrame(tick)}})()}
W.addEventListener('scroll',schedule,{passive:true});
W.addEventListener('resize',function(){size();shapes.forEach(function(s){s.pp=null;s.lag=0});dirty=true;schedule()});
var pg=$('.page');if(pg&&'ResizeObserver' in W)new ResizeObserver(function(){dirty=true;schedule()}).observe(pg);
if(D.fonts&&D.fonts.ready)D.fonts.ready.then(function(){dirty=true;schedule()});
size();schedule();
W.__crew.frame=frame;W.__crew.shapes=shapes;W.__crew.relayout=layoutChanged;
if(W.__crew.cast)layoutChanged();
})();

;
/* ZQ3S page system, Lubna, 2026-11-07. The small script for the new shared parts. Runs after Luay's site.js (both
   deferred, this one second) and only where its elements exist. No third-party code.
   1. (Removed: there is no email list and no form, R-2026-11-07-06.)
   2. (Removed: no address to copy, R-2026-11-07-09.)
   3. The series title screen: the ceremony plays once over its still, when it is on screen and motion is allowed.
   4. The article's paired bars draw in as they reach the screen (the report's charts on the web); still under
      reduced motion, and drawn whole without this script.
   5. The reports page's filters (Luay, 2026-11-10). */
(function(){
'use strict';
var D=document,W=window;
var RM=W.matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,r){return (r||D).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))}

/* 3. the title ceremony, once, over its still (the still is the clip's last frame, so it ends where it began) */
$$('.ps-sp-title[data-clip]').forEach(function(box){
  if(RM)return;var c=W.navigator.connection;if(c&&c.saveData)return;
  var started=false;
  function go(){if(started)return;started=true;
    var v=D.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
    v.preload='auto';v.src=box.getAttribute('data-clip');box.appendChild(v);
    v.addEventListener('playing',function(){box.classList.add('is-playing')});
    v.addEventListener('ended',function(){box.classList.add('is-done')});
    var p=v.play();if(p&&p.catch)p.catch(function(){v.remove()});
  }
  if('IntersectionObserver' in W){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();setTimeout(go,500)}},{threshold:.5});io.observe(box)}
});
/* 4. the paired bars draw in once */
$$('.ps-pairs').forEach(function(f){
  if(RM||!('IntersectionObserver' in W))return;
  f.classList.add('will-draw');
  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){f.classList.add('is-in');io.disconnect()}},{threshold:.2});io.observe(f);
});
/* 5. the reports page's filters (Luay, R-2026-11-09-07): show segment, category, month and who it is about. Without
      this script every report shows and the filters stay hidden. The choice lives in the address (?series=...), so a
      filtered list can be shared and the back button keeps it. */
$$('[data-rp-filters]').forEach(function(box){
  var list=$('[data-rp-list]'),none=$('[data-rp-none]'),count=$('[data-rp-count]',box),reset=$('[data-rp-reset]',box);
  if(!list)return;
  var sels=$$('select[data-key]',box),items=$$('.rp-item',list);
  var ar=D.documentElement.lang==='ar',tpl=count?count.getAttribute('data-tpl'):'';
  function dg(n){n=String(n);return ar?n.replace(/[0-9]/g,function(c){return '٠١٢٣٤٥٦٧٨٩'.charAt(+c)}):n}
  function match(li,k,v){if(!v)return true;
    if(k==='subject')return (li.getAttribute('data-subject')||'').indexOf(' '+v+' ')>=0;
    return li.getAttribute('data-'+k)===v}
  function apply(write){var n=0,any=false,q=[];
    sels.forEach(function(s){if(s.value){any=true;q.push(encodeURIComponent(s.getAttribute('data-key'))+'='+encodeURIComponent(s.value))}});
    items.forEach(function(li){var ok=sels.every(function(s){return match(li,s.getAttribute('data-key'),s.value)});li.hidden=!ok;if(ok)n++});
    if(none)none.hidden=n>0;if(reset)reset.hidden=!any;
    if(count)count.textContent=tpl.replace('{n}',dg(n)).replace('{t}',dg(items.length));
    if(write&&W.history&&W.history.replaceState){try{W.history.replaceState(null,'',W.location.pathname+(q.length?'?'+q.join('&'):'')+W.location.hash)}catch(_){}}}
  /* the address's choice, when it names a value the list has */
  try{var u=new URLSearchParams(W.location.search);sels.forEach(function(s){var v=u.get(s.getAttribute('data-key'));
    if(v&&$$('option',s).some(function(o){return o.value===v}))s.value=v})}catch(_){}
  sels.forEach(function(s){s.addEventListener('change',function(){apply(true);
    if(W.ZQ3S_TRACK)W.ZQ3S_TRACK('report_filter',{where:'reports',id:s.getAttribute('data-key')+':'+(s.value||'all')})})});
  if(reset)reset.addEventListener('click',function(){sels.forEach(function(s){s.value=''});apply(true);
    if(W.ZQ3S_TRACK)W.ZQ3S_TRACK('report_filter',{where:'reports',id:'reset'})});
  box.hidden=false;apply(false);
});
/* 6. the episodes list (Luay, 2026-11-11): by series, by who it is about, and a search. One page of the list filters
      itself; when the list has more pages, the choice reads every episode from list.json and shows them all as rows.
      The choice lives in the address (?series=...&q=...). Without this script the pages and their links stay. */
$$('[data-epx-filters]').forEach(function(box){
  var list=$('[data-epx-list]'),res=$('[data-epx-results]'),none=$('[data-rp-none]'),count=$('[data-rp-count]',box),reset=$('[data-rp-reset]',box);
  if(!list)return;
  var ctl=$$('[data-key]',box),groups=$$('.epx',list),paged=!!$('.pager'),all=null,loading=false;
  var ar=D.documentElement.lang==='ar',tpl=count?count.getAttribute('data-tpl'):'';
  function dg(n){n=String(n);return ar?n.replace(/[0-9]/g,function(c){return '٠١٢٣٤٥٦٧٨٩'.charAt(+c)}):n}
  function norm(t){return String(t||'').toLowerCase().replace(/[ً-ٰٟ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').trim()}
  function val(k){var c=ctl.filter(function(x){return x.getAttribute('data-key')===k})[0];return c?c.value:''}
  function ok(series,subject,q){var s=val('series'),j=val('subject'),w=norm(val('q'));
    if(s&&series!==s)return false;if(j&&(' '+subject.join(' ')+' ').indexOf(' '+j+' ')<0)return false;
    if(w){var t=norm(q);return w.split(/\s+/).every(function(x){return t.indexOf(x)>=0})}return true}
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function row(e){return '<li><a class="ps-epr" href="'+esc(e.url)+'" data-track="episode_open" data-where="episodes-search"><img src="'+esc(e.img)+
    '" width="480" height="270" alt="" loading="lazy" decoding="async"><span><b>'+esc(e.title)+'</b><span class="ps-parts">'+esc(e.series_name)+'</span></span></a></li>'}
  function apply(write){
    var any=ctl.some(function(c){return !!c.value}),n=0,t=0,q=[];
    ctl.forEach(function(c){if(c.value)q.push(encodeURIComponent(c.getAttribute('data-key'))+'='+encodeURIComponent(c.value))});
    if(paged&&any){
      if(!all){if(!loading){loading=true;fetch(box.getAttribute('data-index')).then(function(r){return r.json()}).then(function(j){all=j.episodes||[];apply(false)}).catch(function(){loading=false})}return}
      var hits=all.filter(function(e){return ok(e.series,e.subjects,e.q)});n=hits.length;t=all.length;
      res.innerHTML=hits.map(row).join('');res.hidden=false;list.hidden=true;
    }else{
      res.hidden=true;list.hidden=false;
      groups.forEach(function(g){var y=ok(g.getAttribute('data-series'),(g.getAttribute('data-subject')||'').trim().split(/\s+/),g.getAttribute('data-q'));g.hidden=!y;if(y)n++});t=groups.length;
    }
    var pg=$('.pager');if(pg)pg.hidden=any;
    if(none)none.hidden=n>0;if(reset)reset.hidden=!any;
    if(count)count.textContent=any?tpl.replace('{n}',dg(n)).replace('{t}',dg(t)):'';
    if(write&&W.history&&W.history.replaceState){try{W.history.replaceState(null,'',W.location.pathname+(q.length?'?'+q.join('&'):'')+W.location.hash)}catch(_){}}}
  try{var u=new URLSearchParams(W.location.search);ctl.forEach(function(c){var v=u.get(c.getAttribute('data-key'));
    if(v&&(c.tagName!=='SELECT'||$$('option',c).some(function(o){return o.value===v})))c.value=v})}catch(_){}
  var qt=0;
  ctl.forEach(function(c){c.addEventListener(c.tagName==='SELECT'?'change':'input',function(){clearTimeout(qt);qt=setTimeout(function(){apply(true);
    if(W.ZQ3S_TRACK)W.ZQ3S_TRACK('episode_filter',{where:'episodes',id:c.getAttribute('data-key')+(c.tagName==='SELECT'?':'+(c.value||'all'):'')})},c.tagName==='SELECT'?0:220)})});
  if(reset)reset.addEventListener('click',function(){ctl.forEach(function(c){c.value=''});apply(true)});
  box.hidden=false;apply(false);
});
})();
