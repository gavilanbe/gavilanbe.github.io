const {JSDOM, VirtualConsole} = require('jsdom');
const css = require('css-tree');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const root=require('node:path').join(__dirname,'..');
const html=fs.readFileSync(root+'/index.html','utf8');
const data=fs.readFileSync(root+'/data.js','utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function insertCart'));
const cssErrors=[];
css.parse(html.match(/<style>([\s\S]*?)<\/style>/)[1], {onParseError:e=>cssErrors.push(e.message)});
assert.deepEqual(cssErrors,[]);

function createFixture({mobile=false,reduce=false,width=468}={}){
  const errors=[];
  const vc=new VirtualConsole(); vc.on('jsdomError',e=>{if(!e.message.includes('Could not parse CSS'))errors.push(e)});
  const dom=new JSDOM(html,{url:'http://127.0.0.1:4173',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,d=w.document;
  w.matchMedia=q=>({matches:q.includes('reduced-motion')?reduce:q.includes('760px')?mobile:false,addEventListener(){},removeEventListener(){}});
  w.localStorage.setItem('gb-metido','1'); w.localStorage.setItem('gb-mute','1');
  let now=0,seq=0;
  const timers=new Map();
  w.setTimeout=(fn,ms=0)=>{timers.set(++seq,{at:now+ms,fn});return seq};
  w.clearTimeout=id=>timers.delete(id);
  w.requestAnimationFrame=()=>++seq; w.cancelAnimationFrame=()=>{};
  w.DOMMatrix=class{constructor(s){this.m42=Number(s?.match(/translateY\(([-\d.]+)px\)/)?.[1]||0);this.m31=0;this.m11=1;}};
  const realComputed=w.getComputedStyle.bind(w);
  w.getComputedStyle=el=>{const style=realComputed(el);return new Proxy(style,{get(obj,p){if(p==='transform')return el.style.transform||'none';return Reflect.get(obj,p)}})};
  const opened=[]; w.open=url=>{const child={opener:w};opened.push({url,child});return child};
  const hook=`window.__gbaTest={openDex,closeDex,insertCart,settle,cartridgeTarget,launchTimers,getGame:()=>dexGame,getTimers:()=>dexTimers};`;
  w.eval(data+'\n'+source.replace(/\}\)\(\);\s*$/,hook+'})();'));
  const test=w.__gbaTest;
  assert.ok(test,'test hooks attached to the unmodified production functions');
  const H=mobile?420:570;
  const cw=mobile?Math.min(width*.9,350):Math.min(width*.92,440);
  const ch=cw/1.82,ct=H-(mobile?40:46)-ch,cl=(width-cw)/2;
  const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});
  d.querySelector('#dex-stage').getBoundingClientRect=()=>rect(0,0,width,H);
  d.querySelector('#dex-dock').getBoundingClientRect=()=>rect(cl,ct,cw,ch);
  d.querySelector('.cslot').getBoundingClientRect=()=>rect(cl+cw*.34,ct-ch*.025,cw*.32,ch*.05);
  d.querySelector('#dex-well').getBoundingClientRect=()=>rect(0,mobile?54:38,width,H-(mobile?236:302)-(mobile?54:38));
  d.querySelector('#dex-screen').getBoundingClientRect=()=>rect(cl+cw*.2704,ct+ch*.158,cw*.4592,cw*.4592/1.5);
  const itemWidth=mobile?128:180;
  Object.defineProperty(w.HTMLElement.prototype,'offsetWidth',{get(){return this.classList.contains('rowitem')?itemWidth:100}});
  Object.defineProperty(w.HTMLElement.prototype,'offsetHeight',{get(){return this.classList.contains('cart')?itemWidth/1.55:100}});
  function tick(ms){const end=now+ms;let count=0;while(true){const candidates=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!candidates.length)break;const[id,t]=candidates[0];timers.delete(id);now=t.at;t.fn();assert.ok(++count<500,'no timer loop')}now=end;}
  const first=d.querySelector('.slot3d[data-name]');
  assert.ok(first,'catalogue rendered'); first.click();
  const dex=d.querySelector('#dex');assert.equal(dex.hidden,false);
  const cart=d.querySelector('.rowitem.center .cart');
  cart.getBoundingClientRect=()=>{const wr=d.querySelector('#dex-well').getBoundingClientRect();return rect((width-itemWidth)/2,wr.top+wr.height/2-itemWidth/1.55/2,itemWidth,itemWidth/1.55)};
  assert.equal(d.querySelectorAll('.boot-letter').length,9);
  assert.equal(d.querySelectorAll('#dex-screen .gbboot').length,1);
  const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length,'unique ids');
  for(const use of d.querySelectorAll('.boot-letter use')) assert.ok(d.querySelector(use.getAttribute('href')),'glyph reference resolves');
  return {dom,w,d,test,tick,dex,opened,errors,slotTop:ct-ch*.025,itemWidth};
}

for(const config of [{width:468},{width:357},{mobile:true,width:300},{mobile:true,width:370},{mobile:true,width:720}]){
  const f=createFixture(config),{test,d,dex,tick,opened}=f;
  const game=test.getGame(),cart=d.querySelector('.rowitem.center .cart');
  const target=test.cartridgeTarget(cart);
  assert.ok(Number.isFinite(target.seated)&&target.scale>0&&target.scale<=1);
  const wr=d.querySelector('#dex-well').getBoundingClientRect(),h=f.itemWidth/1.55;
  const finalTop=wr.top+wr.height/2-h/2+h*(1-target.scale)/2+target.seated;
  assert.ok(Math.abs(finalTop-(f.slotTop-3))<.001,'cartridge seats exactly at the slot');
  d.querySelector('#dex-dock').click();
  assert.equal(dex.classList.contains('inserting'),true);
  test.settle(1);assert.equal(test.getGame().name,game.name,'cannot switch cartridges during insertion');
  d.querySelector('#dex-dock').click();
  tick(899);assert.equal(dex.classList.contains('seated'),false);
  tick(1);assert.equal(dex.classList.contains('seated'),true);assert.equal(d.querySelectorAll('.loaded-pak .cart').length,1);
  tick(180);assert.ok(dex.classList.contains('poweron'));
  tick(120);assert.ok(dex.classList.contains('zooming'));
  tick(720);assert.ok(dex.classList.contains('booting'));
  assert.equal(opened.length,0);
  tick(3280);assert.equal(opened.length,1);assert.equal(opened[0].url,game.play);assert.equal(opened[0].child.opener,null);
  assert.equal(dex.hidden,true);assert.equal(d.querySelector('.loaded-pak').childElementCount,0);
  assert.deepEqual(f.errors,[]);f.dom.window.close();
}
for(const cancelAt of [200,700,1100,2200,4900]){
  const f=createFixture();f.test.insertCart();f.tick(cancelAt);f.d.querySelector('#dex-x').click();f.tick(6000);
  assert.equal(f.opened.length,0,'dismissal cancels pending launch');assert.equal(f.dex.hidden,true);
  f.d.querySelector('.slot3d[data-name]').click();assert.equal(f.dex.classList.contains('booting'),false);
  f.test.insertCart();f.tick(5200);assert.equal(f.opened.length,1,'can start another cartridge after cancellation');
  assert.deepEqual(f.errors,[]);f.dom.window.close();
}
{
  const f=createFixture({reduce:true});f.test.insertCart();assert.equal(f.opened.length,1);assert.equal(f.dex.hidden,true);assert.equal(f.test.getTimers().length,0);f.dom.window.close();
}
for(const config of [{width:468},{mobile:true,width:370}]){
  const f=createFixture(config),well=f.d.querySelector('#dex-well');
  const pointer=(type,y)=>{const e=new f.w.Event(type,{bubbles:true});Object.assign(e,{clientX:180,clientY:y,pointerId:1});well.dispatchEvent(e)};
  pointer('pointerdown',0);pointer('pointermove',15);assert.ok(f.dex.classList.contains('docking'));
  pointer('pointercancel',15);assert.equal(f.dex.classList.contains('docking'),false);assert.equal(f.dex.classList.contains('inserting'),false);
  pointer('pointerdown',0);pointer('pointermove',400);assert.ok(f.dex.classList.contains('inserting'),'dragging into slot launches');
  f.tick(5200);assert.equal(f.opened.length,1);assert.deepEqual(f.errors,[]);f.dom.window.close();
}
{
  const f=createFixture(),{d,w,test,tick}=f;
  test.closeDex();
  const search=d.querySelector('#search');
  const query=value=>{search.value=value;search.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const visible=()=>[...d.querySelectorAll('#grid-web [data-search],#grid-term [data-search]')].filter(el=>!el.classList.contains('hidden'));
  query('pokemon');const a=visible().map(el=>el.dataset.search);
  query('POKÉMON');assert.deepEqual(visible().map(el=>el.dataset.search),a);assert.ok(a.length>0,'accent-insensitive search finds games');
  query('pokemon opus');assert.ok(visible().every(el=>el.dataset.search.includes('pokemon')&&el.dataset.search.includes('opus')));
  d.querySelector('#search-clear').click();assert.equal(search.value,'');assert.equal(d.querySelector('#search-clear').hidden,true);
  d.querySelector('[data-f="terminal"]').click();assert.ok(visible().every(el=>el.dataset.type==='terminal'));
  assert.equal(d.querySelector('[data-f="terminal"]').getAttribute('aria-pressed'),'true');
  d.querySelector('.chip[data-m="fable"]').click();assert.equal(d.querySelector('.chip[data-m="fable"]').getAttribute('aria-pressed'),'true');
  query('there-is-no-such-game');assert.equal(visible().length,0);
  d.querySelector('#empty-clear').click();assert.ok(visible().length>50);assert.equal(d.querySelector('[data-f="all"]').getAttribute('aria-pressed'),'true');
  assert.equal(d.querySelector('.chip.on'),null);assert.equal(d.querySelector('#sec-feat').classList.contains('hidden'),false);
  const daily=d.querySelector('#daily-pick');daily.focus();daily.click();assert.equal(d.querySelector('#dex-title').textContent,d.querySelector('#daily-title').textContent);
  assert.equal(d.querySelector('main').inert,true);
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'/',bubbles:true}));assert.notEqual(d.activeElement,search);
  d.querySelector('#dex-repo').focus();d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(d.activeElement,d.querySelector('#dex-x'));
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(d.activeElement,d.querySelector('#dex-repo'));
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(d.activeElement,daily);assert.equal(d.querySelector('main').inert,false);
  const shelf=d.querySelector('#shelf');
  Object.defineProperty(shelf,'clientWidth',{value:400});Object.defineProperty(shelf,'scrollWidth',{value:1000});
  shelf.scrollBy=({left})=>{shelf.scrollLeft+=left;shelf.dispatchEvent(new w.Event('scroll'));};
  w.dispatchEvent(new w.Event('resize'));assert.equal(d.querySelector('#shelf-prev').disabled,true);assert.equal(d.querySelector('#shelf-next').disabled,false);
  d.querySelector('#shelf-next').click();assert.equal(shelf.scrollLeft,320);assert.equal(d.querySelector('#shelf-prev').disabled,false);
  d.querySelector('#shelf-prev').click();assert.equal(shelf.scrollLeft,0);
  for(const img of d.querySelectorAll('img[src]')){const url=new URL(img.src);if(url.hostname==='127.0.0.1')assert.ok(fs.existsSync(root+decodeURIComponent(url.pathname)),`asset exists: ${url.pathname}`);}
  assert.equal(d.querySelectorAll('#grid-web .cart-caption').length,d.querySelectorAll('#grid-web .slot3d').length);
  const coin=d.querySelector('#coin');coin.click();coin.click();assert.equal(coin.disabled,true);tick(520);assert.equal(coin.disabled,false);assert.equal(f.dex.hidden,false);
  test.closeDex();tick(6000);assert.equal(f.opened.length,0);
  assert.deepEqual(f.errors,[]);f.dom.window.close();
}
console.log('PASS: startup and drag gestures, 5 responsive docking sizes, cancellation, replay, reduced motion, accent and multiword search, filters and reset, daily pick, focus trap and restoration, shelf controls, local images, captions, and duplicate coin prevention.');
