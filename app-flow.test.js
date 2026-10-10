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
 return {app,context,storage,element,change:target=>handlers.change({target}),wheel:type=>{const input=new Input(type);handlers.wheel({target:input});return input.blurred},run:s=>vm.runInContext(s,context),click:dataset=>handlers.click({target:{closest:()=>({dataset})}}),focus:target=>handlers.focusin({target}),submit:(id,values={})=>handlers.submit({preventDefault(){},target:{id,values}})};
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
test('direct setup requires an expansion for six factions',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard']");h.click({action:'jump-end'});
 h.submit('direct-setup',{'score:shield':'1.5'});assert.equal(h.run('game'),null);
 h.run('setupSelection.factions=FACTIONS.map(f=>f.id)');h.submit('direct-setup',{});assert.equal(h.run('game'),null);h.click({action:'quick-undermountain'});h.submit('direct-setup',{});assert.equal(h.run('game.players.length'),6);assert.equal(h.run('game.undermountain'),true);
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
 h.submit('resources',{});assert.ok(h.app.innerHTML.includes('Game Reset'));h.submit('final',{lord:'larissa'});h.submit('final',{lord:'caladorn'});assert.equal(h.run('view'),'results');assert.ok(h.app.innerHTML.includes('Game Reset'));
 h.run("view='live';render()");assert.ok(h.app.innerHTML.includes('Game Reset'));h.click({action:'end'});assert.match(h.app.innerHTML,/<dialog[\s\S]*Game Reset[\s\S]*<\/dialog>/);
 h.click({action:'new'});assert.equal(h.run('view'),'setup');assert.equal(h.run('game'),null);assert.equal(h.run('penaltyModal'),false);assert.equal(h.run('quickPenalty'),null);assert.equal(h.run('setupSelection.factions.length'),0);assert.equal(h.run('finishOrder.length'),0);assert.ok(!h.app.innerHTML.includes('<dialog'));
});

test('wheel scroll defocuses numeric fields without blocking normal text fields',()=>{
 const h=harness();assert.equal(h.wheel('number'),true);assert.equal(h.wheel('text'),false);
});

test('starting score fields use text inputs with explicit numeric keypad hints',()=>{
 const h=harness();h.click({action:'jump-end'});
 const fields=h.app.innerHTML.match(/<input[^>]+name="score:[^>]+>/g);assert.equal(fields.length,6);
 for(const field of fields){assert.match(field,/type="text"/);assert.match(field,/inputmode="numeric"/);assert.match(field,/pattern="-\?\[0-9\]\*"/);}
});

test('confirmed Lords block names and unique pills but remain editable by their owner',()=>{
 const h=harness();h.run("game={players:FACTIONS.slice(0,2).map(f=>({...f,faction:f.id,final:emptyFinal()})),events:[],skullport:false};game.players[0].final={...emptyFinal(),lord:'larissa',confirmed:true};finishIndex=1;finishStep='lord';finishOrder=[0,1];finishPosition=1;view='final';render()");
 assert.match(h.app.innerHTML,/data-lord="larissa" disabled/);assert.match(h.app.innerHTML,/data-bonus="larissa" disabled/);
 h.submit('final',{lord:'larissa','count:qualifying':'1'});assert.equal(h.run('game.players[1].final.confirmed'),false);
 h.run('finishIndex=0;render()');assert.ok(!h.app.innerHTML.includes('data-lord="larissa" disabled'));
 h.submit('final',{lord:'larissa','count:qualifying':'15'});assert.equal(h.run('game.players[0].final.counts.qualifying'),9);
});
test('quest pairing exclusions are symmetric and progressive',()=>{
 const h=harness();h.run("game={players:FACTIONS.slice(0,5).map(f=>({...f,faction:f.id,final:emptyFinal()})),events:[],skullport:false};finishIndex=4;game.players[0].final.lord=LORDS.find(l=>l.kind==='pair'&&l.types.includes('Warfare')&&l.types.includes('Skullduggery')).id;game.players[0].final.confirmed=true");
 assert.equal(h.run("questTypeBlocked('Skullduggery',{selectionMode:'types',questTypes:['Warfare']})"),true);
 assert.equal(h.run("questTypeBlocked('Warfare',{selectionMode:'types',questTypes:['Skullduggery']})"),true);
 h.run("game.players.forEach(p=>p.final=emptyFinal());['Commerce','Warfare','Piety'].forEach((type,i)=>{game.players[i].final.lord=LORDS.find(l=>l.kind==='pair'&&l.types.includes('Arcana')&&l.types.includes(type)).id;game.players[i].final.confirmed=true})");
 for(const type of ['Commerce','Warfare','Piety'])assert.equal(h.run("questTypeBlocked('"+type+"',{selectionMode:'types',questTypes:['Arcana']})"),true);
 assert.equal(h.run("questTypeBlocked('Skullduggery',{selectionMode:'types',questTypes:['Arcana']})"),false);
 assert.equal(h.run("questTypeBlocked('Arcana',{selectionMode:'types',questTypes:[]})"),false);
 h.run("game.players[3].final.lord=LORDS.find(l=>l.kind==='pair'&&l.types.includes('Arcana')&&l.types.includes('Skullduggery')).id;game.players[3].final.confirmed=true");
 assert.equal(h.run("questTypeBlocked('Arcana',{selectionMode:'types',questTypes:[]})"),true);
});

test('module toggles precede scores and govern sixth faction and last expansion removal',()=>{
 const h=harness();h.click({action:'jump-end'});
 assert.ok(h.app.innerHTML.indexOf('quick-undermountain')<h.app.innerHTML.indexOf('quick-skullport'));
 assert.ok(h.app.innerHTML.indexOf('quick-skullport')<h.app.innerHTML.indexOf('direct-factions-panel'));
 for(const id of ['shield','guard','silverstars','harpers','sashes'])h.focus({name:'score:'+id});
 h.focus({name:'score:hands',blur(){}});assert.equal(h.run('setupSelection.factions.length'),5);
 h.click({action:'quick-undermountain'});assert.ok(h.app.innerHTML.includes('Undermountain selected'));h.focus({name:'score:hands'});assert.equal(h.run('setupSelection.factions.length'),6);
 h.click({action:'quick-undermountain'});assert.equal(h.run('setupSelection.undermountain'),true);
 h.click({action:'quick-skullport'});assert.ok(h.app.innerHTML.includes('Skullport selected'));h.click({action:'quick-undermountain'});assert.equal(h.run('setupSelection.undermountain'),false);
 h.click({action:'quick-skullport'});assert.equal(h.run('setupSelection.skullport'),true);
 h.click({faction:'hands'});h.click({action:'quick-skullport'});assert.equal(h.run('setupSelection.skullport'),false);
});


test('Normal is default, Expert toggle persists for live play, and reset restores Normal',()=>{
 const h=harness();assert.equal(h.run('setupSelection.expert'),false);assert.match(h.app.innerHTML,/Points displayed normally/);
 h.click({action:'toggle-expert'});assert.match(h.app.innerHTML,/expert-selected/);assert.match(h.app.innerHTML,/All points hidden until end/);
 h.run("setupSelection.factions=['shield','guard']");h.submit('setup');assert.equal(h.run('game.expert'),true);
 h.submit('event',{quest:'123'});assert.match(h.run('scoreboard()'),/<strong>Hidden<\/strong>/);assert.doesNotMatch(h.run('scoreboard()'),/>123</);
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('game.expert'),true);assert.doesNotMatch(restored.run('scoreboard()'),/>123</);
 h.click({action:'new'});assert.equal(h.run('setupSelection.expert'),false);
 h.run("setupSelection.factions=['shield','guard']");h.submit('setup');h.submit('event',{quest:'123'});assert.match(h.run('scoreboard()'),/>123</);
});

test('Expert resources and Lord previews stay hidden until each Lord is confirmed',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard'];setupSelection.expert=true");h.submit('setup');
 h.submit('event',{quest:'123'});h.click({player:'1'});h.submit('event',{quest:'456'});h.click({action:'end'});
 assert.match(h.app.innerHTML,/id="resource-total-0">Hidden</);assert.doesNotMatch(h.app.innerHTML,/>123</);
 const resources={values:{'player:0:adventurers':'5'},id:'resources'};h.change({closest:selector=>selector==='#resources'?resources:null});assert.equal(h.element.textContent,'Hidden');
 h.submit('resources',resources.values);assert.equal(h.run('finishIndex'),0);assert.equal(h.run('beforeLordScore(0)'),128);
 assert.doesNotMatch(h.app.innerHTML,/class="breakdown"/);assert.doesNotMatch(h.run('standings()'),/>128<|>456</);
 h.run("game.players[0].final.lord='larissa'");const form={values:{lord:'larissa','count:qualifying':'1'}};
 h.change({closest:selector=>selector==='#final'?form:null});assert.doesNotMatch(h.element.innerHTML,/class="breakdown"|134/);
 h.submit('final',form.values);assert.equal(h.run('finishIndex'),1);assert.match(h.run('standings()'),/>134</);assert.doesNotMatch(h.run('standings()'),/>456</);assert.doesNotMatch(h.app.innerHTML,/class="breakdown"/);
 const restored=harness(h.run('JSON.stringify(game)'));assert.match(restored.run('standings()'),/>134</);assert.doesNotMatch(restored.run('standings()'),/>456</);
 const pair=h.run("LORDS.find(l=>l.kind==='pair').id");h.submit('final',{lord:pair,'count:pairTotal':'3'});assert.equal(h.run('view'),'results');assert.match(h.app.innerHTML,/>468</);assert.match(h.app.innerHTML,/>134</);
});

test('Normal mode and older saves retain resource totals and Lord previews',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard']");h.submit('setup');h.submit('event',{quest:'123'});h.click({action:'end'});
 assert.match(h.app.innerHTML,/id="resource-total-0">123</);h.submit('resources',{});h.submit('final',{lord:'larissa','count:qualifying':'1'});
 h.run("game.players[finishIndex].final.lord=LORDS.find(l=>l.kind==='pair').id;delete game.expert;render()");
 assert.match(h.app.innerHTML,/class="breakdown"/);const restored=harness(h.run('JSON.stringify(game)'));assert.match(restored.app.innerHTML,/class="breakdown"/);
});



test('Expert standings rank only revealed scores and never compare hidden totals',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard','sashes'];setupSelection.expert=true");h.submit('setup');
 h.submit('event',{quest:'10'});h.click({player:'1'});h.submit('event',{quest:'20'});h.click({player:'2'});h.submit('event',{quest:'30'});h.click({action:'end'});h.submit('resources',{});
 assert.equal(h.run('finishOrder.join(",")'),'0,1,2');assert.doesNotMatch(h.run('standings()'),/standing-rank/);
 h.submit('final',{lord:'larissa','count:qualifying':'9'});
 const first=h.run('standings()');assert.match(first,/<strong>64<\/strong>/);
 const revealed=first.match(/<ol aria-label="Revealed standings">(.*?)<\/ol>/s)[1];assert.match(revealed,/Knights of the Shield/);assert.doesNotMatch(revealed,/City Guard|Red Sashes/);
 const pending=first.match(/<ul class="pending-reveals"[^>]*>(.*?)<\/ul>/s)[1];assert.ok(pending.indexOf('City Guard')<pending.indexOf('Red Sashes'));assert.doesNotMatch(pending,/standing-rank/);
 h.run('game.events.find(e=>e.player===2).points=999');assert.equal(h.run('standings()'),first);
 h.run('game.events.find(e=>e.player===2).points=30');
 const pair=h.run("LORDS.find(l=>l.kind==='pair').id");h.submit('final',{lord:pair,'count:pairTotal':'20'});
 const second=h.run('standings()').match(/<ol aria-label="Revealed standings">(.*?)<\/ol>/s)[1];assert.ok(second.indexOf('City Guard')<second.indexOf('Knights of the Shield'));assert.match(second,/>100</);assert.doesNotMatch(second,/Red Sashes/);
 assert.equal(h.run('finishIndex'),2);
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('standings()'),h.run('standings()'));
 h.run('game.expert=false');assert.match(h.run('standings()'),/Current standings/);assert.doesNotMatch(h.run('standings()'),/pending-reveals/);
});
