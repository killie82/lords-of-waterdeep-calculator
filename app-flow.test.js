import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as scoring from './scoring.js';
const source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8').replace(/^import .*\r?\n/,'');
function harness(saved=null){
 const handlers={},storage=new Map(),scrolls=[];
 const element={innerHTML:'',textContent:'',focus(){},showModal(){},addEventListener(){}};
 const app={innerHTML:'',textContent:'',addEventListener(t,f){handlers[t]=f},querySelector(){return element}};
 class Data{constructor(form){this.data=new Map(Object.entries(form.values||{}))}get(k){return this.data.get(k)??null}has(k){return this.data.has(k)}[Symbol.iterator](){return this.data[Symbol.iterator]()}}
 class Input{constructor(type){this.type=type;this.blurred=false}blur(){this.blurred=true}}
 let id=0;
 const context=vm.createContext({...scoring,document:{querySelector:()=>app},localStorage:{getItem:()=>saved,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{scrollTo:(...a)=>scrolls.push(a)},crypto:{randomUUID:()=>String(++id)},FormData:Data,HTMLInputElement:Input,confirm:()=>true,console});
 vm.runInContext(source,context);
 return {app,context,storage,wheel:type=>{const input=new Input(type);handlers.wheel({target:input});return input.blurred},run:s=>vm.runInContext(s,context),click:dataset=>handlers.click({target:{closest:()=>({dataset})}}),focus:target=>handlers.focusin({target}),submit:(id,values={})=>handlers.submit({preventDefault(){},target:{id,values}})};
}
test('direct scoring carries selections, baseline scores, and blanks into resource scoring',()=>{
 const h=harness();assert.ok(h.app.innerHTML.includes('Jump to end game scoring'));
 h.run("setupSelection.factions=['sashes','guard'];setupSelection.undermountain=true");h.click({action:'jump-end'});
 assert.equal(h.run('view'),'direct');assert.match(h.app.innerHTML,/score:sashes/);
 h.submit('direct-setup',{'score:sashes':'-5','score:guard':''});
 assert.equal(h.run('view'),'final');assert.equal(h.run('finishStep'),'resources');
 assert.equal(h.run('liveScore(0,game.events)'),-5);assert.equal(h.run('liveScore(1,game.events)'),0);
 assert.equal(h.run('game.undermountain'),true);assert.equal(h.run('game.directEnd'),true);
 assert.equal((h.app.innerHTML.match(/resource-player-title/g)||[]).length,2);
 h.submit('resources',{'player:0:adventurers':'20','player:1:gold':'2'});
 assert.equal(h.run('finishOrder.join(",")'),'1,0');assert.equal(h.run('finishStep'),'lord');
});
test('Skullport direct setup requires a track value selected inline',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard'];setupSelection.skullport=true");h.click({action:'jump-end'});
 h.submit('direct-setup',{});assert.equal(h.run('game'),null);
 assert.ok(h.app.innerHTML.includes('quick-track-values'));assert.ok(!h.app.innerHTML.includes('<dialog'));h.click({quickPenalty:'4'});
 assert.equal(h.run('view'),'direct');assert.equal(h.run('quickPenalty'),4);assert.equal(h.run('penaltyModal'),false);
 h.submit('direct-setup',{'score:shield':'30','score:guard':'40'});assert.equal(h.run('game.penalty'),4);
 h.submit('resources',{'player:0:corruption':'2'});assert.equal(h.run('beforeLordScore(0)'),22);
});
test('direct setup rejects invalid scores and six-player base games before creating state',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard']");h.click({action:'jump-end'});
 h.submit('direct-setup',{'score:shield':'1.5'});assert.equal(h.run('game'),null);
 h.run('setupSelection.factions=FACTIONS.map(f=>f.id)');h.submit('direct-setup',{});assert.equal(h.run('game'),null);
 h.run('setupSelection.undermountain=true');h.submit('direct-setup',{});assert.equal(h.run('game.players.length'),6);
});
test('editing initial scores preserves entered resources and saved reveal resumes',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard']");h.click({action:'jump-end'});h.submit('direct-setup',{'score:shield':'10','score:guard':'20'});
 h.run('game.players[0].final.adventurers=3');h.click({action:'jump-end'});assert.equal(h.run('quickScores.shield'),10);
 h.submit('direct-setup',{'score:shield':'15','score:guard':'20'});assert.equal(h.run('game.players[0].final.adventurers'),3);
 h.submit('resources',{'player:0:adventurers':'3'});h.submit('final',{lord:'larissa','count:qualifying':''});
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('finishStep'),'lord');assert.equal(restored.run('finishIndex'),1);assert.equal(restored.run('game.directEnd'),true);
});
test('live setup still starts with zero points and uses the Skullport dialog',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard'];setupSelection.skullport=true");h.submit('setup');assert.equal(h.run('view'),'live');assert.equal(h.run('game.events.length'),0);
 h.click({action:'end'});assert.equal(h.run('penaltyModal'),true);h.click({trackPenalty:'3'});h.click({action:'confirm-track'});assert.equal(h.run('finishStep'),'resources');assert.equal(h.run('game.penalty'),3);
});

test('score-box focus includes a faction and zero scores include untouched factions on submit',()=>{
 const h=harness();h.click({action:'jump-end'});
 assert.ok(!h.app.innerHTML.match(/id="quick-[^"]+"[^>]*disabled/));
 h.focus({name:'score:sashes'});assert.equal(h.run('setupSelection.factions.join(",")'),'sashes');
 h.submit('direct-setup',{'score:sashes':'','score:guard':'0','score:shield':''});
 assert.equal(h.run('game.players.map(p=>p.faction).join(",")'),'sashes,guard');
 assert.equal(h.run('liveScore(1,game.events)'),0);
});
test('removing a direct-scoring faction clears its score',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard'];quickScores.shield='25'");h.click({action:'jump-end'});h.click({faction:'shield'});
 assert.equal(h.run('quickScores.shield'),'');assert.equal(h.run('setupSelection.factions.includes("shield")'),false);
});

test('full track choice clears existing skulls and blocks skull input in both entry paths',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard'];setupSelection.skullport=true");h.click({action:'jump-end'});assert.ok(h.app.innerHTML.includes('0 VP, All skulls on corruption track'));h.click({quickPenalty:'0'});h.submit('direct-setup',{});
 assert.equal(h.run('game.penalty'),0);assert.ok(!h.app.innerHTML.includes(':corruption"'));
 h.run('game.players[0].final.corruption=5');h.submit('resources',{'player:0:corruption':'5'});assert.equal(h.run('game.players[0].final.corruption'),0);
 h.run("view='live';render()");h.click({action:'end'});assert.ok(h.app.innerHTML.includes('data-track-penalty="0"'));h.click({trackPenalty:'0'});h.click({action:'confirm-track'});assert.equal(h.run('game.penalty'),0);assert.ok(!h.app.innerHTML.includes('name="player:0:corruption"'));
});

test('victory headings include icons and faction colors for single and shared winners',()=>{
 const h=harness();h.run("game={players:FACTIONS.slice(0,2).map(f=>({...f,faction:f.id,final:{...emptyFinal(),lord:'larissa',counts:{qualifying:0},confirmed:true}})),events:[{player:0,points:20},{player:1,points:10}],skullport:false};view='results';render()");
 assert.match(h.app.innerHTML,/winner-heading[^>]*style="color:#e4bf64"/);
 assert.equal((h.app.innerHTML.match(/class="result-faction-name"/g)||[]).length,3);
 assert.match(h.app.innerHTML,/result-faction-name" style="color:#a3a9aa"><svg/);
 h.run('game.events[1].points=20;render()');assert.ok(h.app.innerHTML.includes('share the victory'));
 assert.equal((h.app.innerHTML.match(/class="result-faction-name"/g)||[]).length,4);
});

test('Game Reset is available on every page and clears modal and temporary state',()=>{
 const h=harness();assert.ok(h.app.innerHTML.includes('Game Reset'));h.click({action:'jump-end'});assert.ok(h.app.innerHTML.includes('Game Reset'));
 h.run("setupSelection.factions=['shield','guard'];setupSelection.skullport=true;quickPenalty=2");h.submit('direct-setup',{});assert.ok(h.app.innerHTML.includes('Game Reset'));
 h.submit('resources',{});assert.ok(h.app.innerHTML.includes('Game Reset'));h.submit('final',{lord:'larissa'});h.submit('final',{lord:'larissa'});assert.equal(h.run('view'),'results');assert.ok(h.app.innerHTML.includes('Game Reset'));
 h.run("view='live';render()");assert.ok(h.app.innerHTML.includes('Game Reset'));h.click({action:'end'});assert.match(h.app.innerHTML,/<dialog[\s\S]*Game Reset[\s\S]*<\/dialog>/);
 h.click({action:'new'});assert.equal(h.run('view'),'setup');assert.equal(h.run('game'),null);assert.equal(h.run('penaltyModal'),false);assert.equal(h.run('quickPenalty'),null);assert.equal(h.run('setupSelection.factions.length'),0);assert.equal(h.run('finishOrder.length'),0);assert.ok(!h.app.innerHTML.includes('<dialog'));
});

test('wheel scroll defocuses numeric fields without blocking normal text fields',()=>{
 const h=harness();assert.equal(h.wheel('number'),true);assert.equal(h.wheel('text'),false);
});
