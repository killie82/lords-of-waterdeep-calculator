import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as scoring from './scoring.js';
import * as dashboard from './dashboard.js';
import {QUESTS, BUILDINGS} from './catalog.js';
const source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8').replace(/^import .*\r?\n/gm,'');
function harness(saved=null){
 const handlers={},storage=new Map(),scrolls=[];
 const element={innerHTML:'',textContent:'',focus(){},showModal(){},addEventListener(){}};
 const app={innerHTML:'',textContent:'',addEventListener(t,f){handlers[t]=f},querySelector(){return element}};
 class Data{constructor(form){this.data=new Map(Object.entries(form.values||{}))}get(k){return this.data.get(k)??null}has(k){return this.data.has(k)}[Symbol.iterator](){return this.data[Symbol.iterator]()}}
 class Input{constructor(type){this.type=type;this.blurred=false}blur(){this.blurred=true}}
 let id=0;
 const context=vm.createContext({...scoring,...dashboard,QUESTS,BUILDINGS,document:{querySelector:()=>app},localStorage:{getItem:()=>saved,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{scrollTo:(...a)=>scrolls.push(a)},crypto:{randomUUID:()=>String(++id)},FormData:Data,HTMLInputElement:Input,confirm:()=>true,console});
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
 const h=harness();assert.match(h.app.innerHTML,/Game Reset|Reset Game/);h.click({action:'jump-end'});assert.match(h.app.innerHTML,/Game Reset|Reset Game/);
 h.run("setupSelection.factions=['shield','guard'];setupSelection.skullport=true;quickPenalty=2");h.submit('direct-setup',{});assert.match(h.app.innerHTML,/Game Reset|Reset Game/);
 h.submit('resources',{});assert.match(h.app.innerHTML,/Game Reset|Reset Game/);h.submit('final',{lord:'larissa'});h.submit('final',{lord:'caladorn'});assert.equal(h.run('view'),'results');assert.match(h.app.innerHTML,/Game Reset|Reset Game/);
 h.run("view='live';render()");assert.match(h.app.innerHTML,/Game Reset|Reset Game/);h.click({action:'end'});assert.match(h.app.innerHTML,/<dialog[\s\S]*Game Reset[\s\S]*<\/dialog>/);
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
 h.submit('event',{quest:'123'});assert.match(h.run('scoreboard()'),/<strong>\?\?\?<\/strong>/);assert.doesNotMatch(h.run('scoreboard()'),/>123</);
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('game.expert'),true);assert.doesNotMatch(restored.run('scoreboard()'),/>123</);
 h.click({action:'new'});assert.equal(h.run('setupSelection.expert'),false);
 h.run("setupSelection.factions=['shield','guard']");h.submit('setup');h.submit('event',{quest:'123'});assert.match(h.run('scoreboard()'),/>123</);
});

test('Expert resources and Lord previews stay hidden until each Lord is confirmed',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=false;setupSelection.factions=['shield','guard'];setupSelection.expert=true");h.submit('setup');
 h.submit('event',{quest:'123'});h.click({player:'1'});h.submit('event',{quest:'456'});h.click({action:'end'});
 assert.match(h.app.innerHTML,/id="resource-total-0">\?\?\?</);assert.doesNotMatch(h.app.innerHTML,/>123</);
 const resources={values:{'player:0:adventurers':'5'},id:'resources'};h.change({closest:selector=>selector==='#resources'?resources:null});assert.equal(h.element.textContent,'???');
 h.submit('resources',resources.values);assert.equal(h.run('finishIndex'),0);assert.equal(h.run('beforeLordScore(0)'),128);
 assert.doesNotMatch(h.app.innerHTML,/class="breakdown(?: lord-score-preview)?"/);assert.doesNotMatch(h.run('standings()'),/>128<|>456</);
 h.run("game.players[0].final.lord='larissa'");const form={values:{lord:'larissa','count:qualifying':'1'}};
 h.change({closest:selector=>selector==='#final'?form:null});assert.doesNotMatch(h.element.innerHTML,/class="breakdown(?: lord-score-preview)?"|134/);
 h.submit('final',form.values);assert.equal(h.run('finishIndex'),1);assert.match(h.run('standings()'),/>134</);assert.doesNotMatch(h.run('standings()'),/>456</);assert.doesNotMatch(h.app.innerHTML,/class="breakdown(?: lord-score-preview)?"/);
 const restored=harness(h.run('JSON.stringify(game)'));assert.match(restored.run('standings()'),/>134</);assert.doesNotMatch(restored.run('standings()'),/>456</);
 const pair=h.run("LORDS.find(l=>l.kind==='pair').id");h.submit('final',{lord:pair,'count:pairTotal':'3'});assert.equal(h.run('view'),'results');assert.match(h.app.innerHTML,/>468</);assert.match(h.app.innerHTML,/>134</);
});

test('Normal mode and older saves retain resource totals and Lord previews',()=>{
 const h=harness();h.run("setupSelection.factions=['shield','guard']");h.submit('setup');h.submit('event',{quest:'123'});h.click({action:'end'});
 assert.match(h.app.innerHTML,/id="resource-total-0">123</);h.submit('resources',{});h.submit('final',{lord:'larissa','count:qualifying':'1'});
 h.run("game.players[finishIndex].final.lord=LORDS.find(l=>l.kind==='pair').id;delete game.expert;render()");
 assert.match(h.app.innerHTML,/class="breakdown(?: lord-score-preview)?"/);const restored=harness(h.run('JSON.stringify(game)'));assert.match(restored.app.innerHTML,/class="breakdown(?: lord-score-preview)?"/);
});



test('Expert standings rank only revealed scores and never compare hidden totals',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=false;setupSelection.factions=['shield','guard','sashes'];setupSelection.expert=true");h.submit('setup');
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

test('Dashboard is the default, records explained quests, and preserves manual point entry',()=>{
 const h=harness();assert.equal(h.run('setupSelection.dashboardMode'),true);assert.doesNotMatch(h.app.innerHTML,/data-action="toggle-dashboard"/);h.run("setupSelection.factions=['sashes','guard'];setupSelection.undermountain=true;setupSelection.skullport=true");h.submit('setup');
 assert.equal(h.run('game.dashboardMode'),true);assert.equal(h.run('game.trackRounds'),true);assert.match(h.app.innerHTML,/dashboard-quest-select/);assert.doesNotMatch(h.app.innerHTML,/id="round-tracking"/);
 const q=h.run("QUESTS.find(q=>q.name==='Quell Mercenary Uprising').id");h.change({name:'questId',value:q,closest:s=>s==='#dashboard-quest'?{values:{}}:null});assert.match(h.app.innerHTML,/Scoring explanation/);
 h.submit('dashboard-quest',{questId:q,printed:'8'});assert.equal(h.run('liveScore(0,game.events)'),8);
 const next=h.run("QUESTS.find(q=>q.name==='Ambush Artor Morlin').id");h.submit('dashboard-quest',{questId:next,printed:'10'});assert.equal(h.run('game.events.at(-1).points'),12);assert.match(h.run('game.events.at(-1).note'),/Quell Mercenary Uprising/);
 h.submit('dashboard-quest',{questId:next,printed:'10'});assert.equal(h.run('game.events.length'),2);
 h.submit('event',{intrigue:'8'});assert.equal(h.run('liveScore(0,game.events)'),28);
 const restored=harness(h.run('JSON.stringify(game)'));assert.match(restored.app.innerHTML,/id="dashboard-quest-select"/);assert.equal(restored.run('completedQuests(game,0).length'),2);
 h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('game.events[0].points'),10);assert.doesNotMatch(h.run('game.events[0].note'),/Quell Mercenary Uprising/);
 h.click({action:'new'});assert.equal(h.run('setupSelection.dashboardMode'),true);
});

test('Dashboard ownership, Round 5 modal, reload, undo and Expert hiding work together',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=true;setupSelection.expert=true;setupSelection.factions=['sashes','guard'];setupSelection.skullport=true");h.submit('setup');
 const b=h.run("BUILDINGS.find(b=>b.name==='Spires of the Morning').id");h.submit('dashboard-building',{buildingId:b,action:'purchase',owner:'0'});assert.equal(h.run('game.events.length'),0);
 h.run('game.round=4');h.click({action:'round'});assert.match(h.app.innerHTML,/Game Upkeep/);assert.match(h.app.innerHTML,/extra Agent/);assert.match(h.app.innerHTML,/Spires of the Morning/);
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('game.upkeepRound'),5);assert.match(restored.app.innerHTML,/id="upkeep-modal"/);
 h.click({action:'close-upkeep'});assert.equal(h.run('game.upkeepRound'),undefined);
 h.click({buildingOwner:b,ownerPlayer:'1'});assert.equal(h.run('ownedBuildings(game,0).length'),0);h.click({destroyBuilding:b});assert.equal(h.run('ownedBuildings(game,1).length'),0);
 h.click({action:'undo-ownership'});assert.equal(h.run('ownedBuildings(game,1).length'),1);assert.doesNotMatch(h.run('scoreboard()'),/>0</);
 h.click({action:'end'});h.click({trackPenalty:'3'});h.click({action:'confirm-track'});h.submit('resources',{});h.click({bonus:'larissa'});assert.equal(h.run('game.players[finishIndex].final.counts.qualifying'),0);assert.doesNotMatch(h.app.innerHTML,/class="breakdown(?: lord-score-preview)?"/);
 h.submit('final',{lord:'larissa','count:qualifying':'0'});h.click({bonus:'sangalor'});assert.equal(h.run('game.players[finishIndex].final.counts.moduleTotal'),0);
});

test('Dashboard prefilled Lord counts reflect tracked pairs, expansions, and chosen quest type',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=true;setupSelection.factions=['sashes','guard'];setupSelection.skullport=true;setupSelection.undermountain=true");h.submit('setup');
 const q=h.run("QUESTS.find(q=>q.name==='Ambush Artor Morlin').id");h.submit('dashboard-quest',{questId:q,printed:'10'});h.click({action:'end'});h.click({trackPenalty:'1'});h.click({action:'confirm-track'});h.submit('resources',{});
 // First reveal is guard (zero score); the second reveal is Red Sashes.
 h.submit('final',{lord:'larissa','count:qualifying':'0'});h.click({questType:'Warfare'});h.click({questType:'Piety'});assert.equal(h.run('game.players[finishIndex].final.counts.pairTotal'),1);
 h.click({bonus:'irusyl'});h.click({dashboardChoice:'Warfare'});assert.equal(h.run('game.players[finishIndex].final.counts.qualifying'),1);
 h.click({bonus:'danilo'});assert.equal(h.run('game.players[finishIndex].final.counts.qualifying'),1);
});

test('canceling a cascading quest undo preserves every score and completion',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=true;setupSelection.factions=['sashes','guard']");h.submit('setup');
 const plot=h.run("QUESTS.find(q=>q.name==='Quell Mercenary Uprising').id"),next=h.run("QUESTS.find(q=>q.name==='Ambush Artor Morlin').id");h.submit('dashboard-quest',{questId:plot,printed:'8'});h.submit('dashboard-quest',{questId:next,printed:'10'});
 const before=h.run('JSON.stringify(game.events)');h.context.confirm=()=>false;h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('JSON.stringify(game.events)'),before);
});

test('simplified building controls sync recipients, retain drafts, filter available tiles and transfer with icons',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=true;setupSelection.factions=['sashes','guard'];setupSelection.skullport=true");h.submit('setup');
 const b=h.run("BUILDINGS.find(b=>b.name==='Spires of the Morning').id");
 h.change({name:'buildingId',value:b,closest:s=>s==='#dashboard-building'?{}:null});h.click({buildingAcquisition:'gain'});h.click({buildingPlayer:'1'});
 assert.equal(h.run('selected'),1);assert.match(h.run('dashboardBuildingsPanel()'),new RegExp('value="'+b+'" selected'));assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/id="dashboard-owner"|id="dashboard-building-action"/);
 h.run("entryDraft().values.gems='7'");h.click({recordPlayer:'0'});assert.equal(h.run('buildingDraft().id'),b);h.click({buildingPlayer:'1'});assert.equal(h.run('entryDraft().values.gems'),'7');
 h.submit('dashboard-building',{buildingId:b});assert.equal(h.run('game.dashboard.buildings["'+b+'"].owner'),1);assert.equal(h.run('game.dashboard.history.at(-1).action'),'gain');assert.equal(h.run('game.events.length'),0);
 assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),new RegExp('<option value="'+b+'"'));assert.match(h.run('dashboardBuildingsPanel()'),/--selected-player:1/);
 h.click({buildingOwner:b,ownerPlayer:'0'});assert.equal(h.run('selected'),1);assert.equal(h.run('game.dashboard.buildings["'+b+'"].owner'),0);assert.match(h.run('dashboardBuildingsPanel()'),/--selected-player:0/);
 h.click({buildingOwner:b,ownerPlayer:'0'});assert.equal(h.run('game.dashboard.history.length'),2);
 h.submit('event',{gems:'7'});assert.equal(h.run('liveScore(1,game.events)'),7);assert.equal(h.run('liveScore(0,game.events)'),0);
 h.click({destroyBuilding:b});assert.equal(h.run('ownedBuildings(game,0).length'),0);assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),new RegExp('id="owner-picker-'+b+'"'));
 h.click({action:'undo-ownership'});assert.equal(h.run('game.dashboard.buildings["'+b+'"].owner'),0);h.click({action:'undo-ownership'});h.click({action:'undo-ownership'});assert.match(h.run('dashboardBuildingsPanel()'),new RegExp('<option value="'+b+'"'));
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('buildingDraft().action'),'gain');
});

test('Dashboard point buttons accrue gains and losses until recorded for the selected faction',()=>{
 const h=harness();h.run("setupSelection.dashboardMode=true;setupSelection.expert=true;setupSelection.factions=['sashes','guard']");h.submit('setup');
 assert.doesNotMatch(h.app.innerHTML,/id="entry-gems"|id="entry-intrigue"|id="entry-other"/);assert.match(h.app.innerHTML,/id="dashboard-pending-points"/);
 h.click({pointsStep:'5'});h.click({pointsStep:'1'});h.click({pointsStep:'-1'});assert.equal(h.run('game.dashboard.pendingPoints'),5);assert.equal(h.run('game.events.length'),0);
 h.click({recordPlayer:'1'});assert.equal(h.run('game.dashboard.pendingPoints'),5);h.submit('dashboard-points');assert.equal(h.run('liveScore(1,game.events)'),5);assert.equal(h.run('liveScore(0,game.events)'),0);assert.equal(h.run('game.dashboard.pendingPoints'),0);assert.match(h.run('scoreboard()'),/>\?\?\?</);
 h.submit('dashboard-points');assert.equal(h.run('game.events.length'),1);
 h.click({pointsStep:'-5'});h.click({pointsStep:'-1'});assert.match(h.run('dashboardAdditionalPoints()'),/pending-points loss/);
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('game.dashboard.pendingPoints'),-6);
 restored.context.crypto.randomUUID=()=> 'restored-entry';restored.click({buildingPlayer:'1'});restored.submit('dashboard-points');assert.equal(restored.run('liveScore(1,game.events)'),-1);assert.equal(restored.run('game.dashboard.pendingPoints'),0);restored.click({action:'undo'});assert.equal(restored.run('liveScore(1,game.events)'),5);
});

test('Heroes Garden bonus is available only while the building is in play',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');
 const q=h.run("QUESTS.find(q=>q.name==='Ambush Artor Morlin').id");h.change({name:'questId',value:q,closest:s=>s==='#dashboard-quest'?{values:{}}:null});
 assert.doesNotMatch(h.app.innerHTML,/data-action="quest-heroes"/);
 h.run("updateBuildingOwnership('b17','gain',1)");assert.match(h.app.innerHTML,/data-action="quest-heroes"/);
 h.click({action:'quest-heroes'});assert.equal(h.run('dashboardDraft().heroes'),true);assert.match(h.app.innerHTML,/City Guard · Heroes’ Garden owner/);assert.match(h.app.innerHTML,/quest-owner-benefit/);const total=h.run('questReward(game,selected,dashboardDraft().questId,dashboardDraft()).total');assert.ok(h.app.innerHTML.includes('Red Sashes: '+total+' VP'));assert.ok(h.app.innerHTML.indexOf('Red Sashes: '+total+' VP')<h.app.innerHTML.indexOf('City Guard · Heroes’ Garden owner'));
 h.run("updateBuildingOwnership('b17','destroy',null)");assert.doesNotMatch(h.app.innerHTML,/data-action="quest-heroes"/);assert.equal(h.run('dashboardDraft().heroes'),false);
 h.submit('dashboard-quest',{questId:q,printed:'10'});assert.equal(h.run('game.events.at(-1).points'),10);
});

test('Heroes Garden credits the current other owner and undoes linked points together',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');
 const q=h.run("QUESTS.find(q=>q.name==='Ambush Artor Morlin').id");
 h.run("updateBuildingOwnership('b17','gain',1)");h.click({action:'quest-heroes'});h.submit('dashboard-quest',{questId:q,printed:'10'});
 assert.equal(h.run('liveScore(0,game.events)'),14);assert.equal(h.run('liveScore(1,game.events)'),2);
 assert.equal(h.run('completedQuests(game,1).length'),0);
 h.run("updateBuildingOwnership('b17','transfer',0)");assert.equal(h.run('liveScore(1,game.events)'),2);
 h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('game.events.length'),0);
 h.click({action:'quest-heroes'});h.submit('dashboard-quest',{questId:q,printed:'10'});assert.equal(h.run('game.events.length'),1);assert.equal(h.run('liveScore(0,game.events)'),14);
 h.click({action:'undo'});assert.equal(h.run('game.events.length'),0);
 h.run("updateBuildingOwnership('b17','transfer',1)");h.click({action:'quest-heroes'});h.submit('dashboard-quest',{questId:q,printed:'10'});h.click({action:'undo'});assert.equal(h.run('game.events.length'),0);
});

test('Owner with Tax Collector sees and receives Heroes Garden owner points in their quest total',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.undermountain=true");h.submit('setup');
 h.submit('dashboard-quest',{questId:'q88',printed:'9'});h.run("updateBuildingOwnership('b17','gain',0)");
 const q=h.run("QUESTS.find(q=>q.name==='Ambush Artor Morlin').id");h.change({name:'questId',value:q,closest:s=>s==='#dashboard-quest'?{values:{}}:null});h.run("dashboardDraft().printed='10'");h.click({action:'quest-heroes'});
 assert.match(h.app.innerHTML,/Red Sashes: 16 VP/);assert.match(h.app.innerHTML,/Heroes’ Garden owner benefit · Impersonate Tax Collector/);
 h.submit('dashboard-quest',{questId:q,printed:'10'});assert.equal(h.run('liveScore(0,game.events)'),25);assert.equal(h.run('game.events.length'),2);
 h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('liveScore(0,game.events)'),14);
});

test('Destroyed buildings appear in the activity log and undo restores their previous owner',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');h.run("updateBuildingOwnership('b17','gain',1)");h.click({destroyBuilding:'b17'});
 assert.match(h.app.innerHTML,/Heroes&#39; Garden destroyed/);assert.equal(h.run('game.events.at(-1).source'),'buildingDestroyed');assert.equal(h.run('liveScore(1,game.events)'),0);
 const restored=harness(h.run('JSON.stringify(game)'));restored.click({delete:restored.run('game.events.at(-1).id')});assert.equal(restored.run('game.dashboard.buildings.b17.owner'),1);assert.equal(restored.run('game.events.length'),0);
 h.click({action:'undo'});assert.equal(h.run('game.dashboard.buildings.b17.owner'),1);
});
test('Threaten modal validates atomically, records gained buildings for its faction, and undoes the group',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.undermountain=true");h.submit('setup');
 h.submit('dashboard-quest',{questId:'q42',printed:'13'});assert.match(h.app.innerHTML,/id="threaten-buildings-modal"/);assert.equal(h.run('game.events.length'),0);
 h.submit('threaten-buildings',{building1:'b17',building2:'b17',building3:'b18'});assert.equal(h.run('game.events.length'),0);assert.equal(h.run('ownedBuildings(game,0).length'),0);
 h.submit('threaten-buildings',{building1:'b17',building2:'b18',building3:'b54'});assert.equal(h.run('game.events.length'),0);assert.equal(h.run('ownedBuildings(game,0).length'),0);
 const restored=harness(h.run('JSON.stringify(game)'));restored.run('selected=1');restored.submit('threaten-buildings',{building1:'b17',building2:'b18',building3:'b19'});
 assert.equal(restored.run('ownedBuildings(game,0).length'),3);assert.equal(restored.run('ownedBuildings(game,1).length'),0);assert.equal(restored.run('liveScore(0,game.events)'),13);assert.ok(restored.run("game.dashboard.history.every(h=>h.action==='gain')"));assert.equal(restored.run('game.dashboard.pendingQuest'),undefined);
 restored.click({delete:restored.run('game.events[0].id')});assert.equal(restored.run('ownedBuildings(game,0).length'),0);assert.equal(restored.run('game.events.length'),0);assert.equal(restored.run('game.dashboard.history.length'),0);
 h.click({action:'cancel-threaten'});assert.equal(h.run('game.dashboard.pendingQuest'),undefined);assert.equal(h.run('game.events.length'),0);
});
test('Quest building gains enforce capacity and require later ownership changes to be undone first',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.undermountain=true");h.submit('setup');
 h.run("['b12','b13','b14','b15','b16','b20','b21'].forEach(id=>updateBuildingOwnership(id,'gain',0))");h.submit('dashboard-quest',{questId:'q42',printed:'13'});
 h.submit('threaten-buildings',{building1:'b17',building2:'b18',building3:'b19'});assert.equal(h.run('game.events.length'),0);assert.equal(h.run('ownedBuildings(game,0).length'),7);
 h.submit('threaten-buildings',{building1:'b17',building2:'b18'});assert.equal(h.run('ownedBuildings(game,0).length'),9);
 h.click({destroyBuilding:'b17'});h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('game.events.length'),2);
 h.click({delete:h.run('game.events.at(-1).id')});assert.equal(h.run('ownedBuildings(game,0).length'),9);h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('ownedBuildings(game,0).length'),7);
});

for(const [id,name,n,module] of [['q31','Lure Artisans of Mirabar',1,'base'],['q32','Placate the Walking Statue',1,'base'],['q96',"Swindle the Builder's Guilds",2,'skullport']])test(name+' records its building reward through the shared modal',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true");h.submit('setup');
 const vp=h.run('QUESTS.find(q=>q.id==='+JSON.stringify(id)+').vp');h.submit('dashboard-quest',{questId:id,printed:String(vp)});
 assert.equal(h.run('game.events.length'),0);assert.equal((h.app.innerHTML.match(/id="threaten-building-[0-9]"/g)||[]).length,n);
 if(id==='q32')assert.match(h.app.innerHTML,/physically drew from the building stack/);if(id==='q96')assert.match(h.app.innerHTML,/Refill Builder’s Hall/);
 h.submit('threaten-buildings',{building1:'b17',building2:n===1?'b18':'b17'});assert.equal(h.run('game.events.length'),0);
 const values={building1:'b17'};if(n===2)values.building2='b18';h.submit('threaten-buildings',values);
 assert.equal(h.run('ownedBuildings(game,0).length'),n);assert.equal(h.run('liveScore(0,game.events)'),vp);assert.ok(h.run("game.dashboard.history.every(h=>h.action==='gain')"));
 h.click({action:'undo'});assert.equal(h.run('ownedBuildings(game,0).length'),0);assert.equal(h.run('game.events.length'),0);
});

test('Infiltrate Builders Hall purchase notice follows the selected faction and acquisition toggle',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');
 assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-purchase-bonus/);
 h.submit('dashboard-quest',{questId:'q29',printed:'6'});assert.ok(h.run('dashboardBuildingsPanel()').includes('Red Sashes: +4 VP'));
 h.click({buildingAcquisition:'gain'});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-purchase-bonus/);
 h.click({buildingAcquisition:'purchase'});h.click({buildingPlayer:'1'});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-purchase-bonus/);
 h.click({buildingPlayer:'0'});assert.match(h.run('dashboardBuildingsPanel()'),/building-purchase-bonus/);
 h.click({delete:h.run('game.events[0].id')});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-purchase-bonus/);
});

test('Purchase awards Infiltrate bonus to its faction, persists, and undoes with ownership',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');h.submit('dashboard-quest',{questId:'q29',printed:'6'});
 h.submit('dashboard-building',{buildingId:'b17'});assert.equal(h.run('liveScore(0,game.events)'),10);assert.equal(h.run('game.events.at(-1).points'),4);
 h.submit('dashboard-building',{buildingId:'b17'});assert.equal(h.run('liveScore(0,game.events)'),10);
 const restored=harness(h.run('JSON.stringify(game)'));restored.click({action:'undo'});assert.equal(restored.run('liveScore(0,game.events)'),6);assert.equal(restored.run('game.dashboard.buildings.b17'),undefined);
 h.click({buildingPlayer:'1'});h.submit('dashboard-building',{buildingId:'b18'});assert.equal(h.run('liveScore(1,game.events)'),0);
 h.click({buildingPlayer:'0'});h.click({buildingAcquisition:'gain'});h.submit('dashboard-building',{buildingId:'b19'});assert.equal(h.run('liveScore(0,game.events)'),10);
 h.click({delete:h.run('game.events[0].id')});assert.equal(h.run('liveScore(0,game.events)'),0);assert.equal(h.run('game.dashboard.buildings.b17.owner'),0);
 h.click({delete:h.run('game.events.find(e=>e.purchaseBonusId).id')});assert.equal(h.run('game.dashboard.buildings.b17'),undefined);
});

test('Activity log separates building additions from scores and supports addition undo',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');h.submit('dashboard-quest',{questId:'q29',printed:'6'});h.submit('dashboard-building',{buildingId:'b17'});
 assert.equal(h.run("activityEntries().filter(e=>e.source==='buildingAdded').length"),1);assert.equal(h.run("activityEntries().filter(e=>e.purchaseBonusId).length"),1);assert.equal(h.run('liveScore(0,game.events)'),10);
 assert.match(h.app.innerHTML,/Building added/);assert.match(h.app.innerHTML,/Heroes&#39; Garden · Purchased/);
 h.click({undoBuildingHistory:'0'});assert.equal(h.run('game.dashboard.buildings.b17'),undefined);assert.equal(h.run('liveScore(0,game.events)'),6);
 h.click({buildingAcquisition:'gain'});h.submit('dashboard-building',{buildingId:'b18'});assert.equal(h.run('activityEntries().at(-1).source'),'buildingAdded');
 const restored=harness(h.run('JSON.stringify(game)'));restored.click({action:'undo'});assert.equal(restored.run('game.dashboard.buildings.b18'),undefined);assert.equal(restored.run('liveScore(0,game.events)'),6);
});

test('Building gems share a draft, show the total, record separately, and undo with the building',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');h.click({buildingGemStep:'-1'});assert.equal(h.run('buildingDraft().gems'),0);
 h.click({buildingGemStep:'1'});h.click({buildingGemStep:'1'});h.click({buildingGemStep:'-1'});assert.equal(h.run('buildingDraft().gems'),1);
 h.click({buildingEntryPlayer:'1'});assert.equal(h.run('buildingDraft().gems'),1);h.submit('dashboard-building',{buildingId:'b17'});assert.equal(h.run('liveScore(1,game.events)'),1);assert.equal(h.run('buildingDraft().gems'),0);
 h.click({undoBuildingHistory:'0'});assert.equal(h.run('game.dashboard.buildings.b17'),undefined);assert.equal(h.run('liveScore(1,game.events)'),0);
 h.click({buildingEntryPlayer:'0'});h.submit('dashboard-quest',{questId:'q29',printed:'6'});h.click({buildingGemStep:'1'});h.click({buildingGemStep:'1'});assert.ok(h.run('dashboardBuildingsPanel()').includes('Red Sashes: +6 VP'));
 h.submit('dashboard-building',{buildingId:'b18'});assert.equal(h.run('liveScore(0,game.events)'),12);assert.equal(h.run('game.events.filter(e=>e.source==="gems").length'),1);
 h.click({delete:h.run('game.events.find(e=>e.questId==="q29").id')});assert.equal(h.run('liveScore(0,game.events)'),2);
 h.click({undoBuildingHistory:'0'});assert.equal(h.run('game.dashboard.buildings.b18'),undefined);assert.equal(h.run('liveScore(0,game.events)'),0);
 h.click({buildingAcquisition:'gain'});h.click({buildingGemStep:'1'});h.submit('dashboard-building',{buildingId:'b19'});assert.equal(h.run('liveScore(0,game.events)'),1);
});

test('Stocking building purchases show a persistent setup reminder without adding points',()=>{
 for(const b of BUILDINGS.filter(b=>b.upkeep)){
  const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true;setupSelection.undermountain=true");h.submit('setup');
  h.submit('dashboard-building',{buildingId:b.id});
  assert.equal(h.run('game.dashboard.pendingBuildingSetup'),b.id);assert.match(h.app.innerHTML,/id="building-setup-modal"/);assert.ok(h.app.innerHTML.includes(b.upkeep));assert.equal(h.run('liveScore(0,game.events)'),0);
  const restored=harness(h.run('JSON.stringify(game)'));assert.match(restored.app.innerHTML,/id="building-setup-modal"/);restored.click({action:'close-building-setup'});assert.doesNotMatch(restored.app.innerHTML,/id="building-setup-modal"/);assert.equal(restored.run('ownedBuildings(game,0).length'),1);
 }
});
test('Setup reminders do not appear for other buildings, gains or transfers, and disappear on undo',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard']");h.submit('setup');
 h.submit('dashboard-building',{buildingId:'b17'});assert.doesNotMatch(h.app.innerHTML,/id="building-setup-modal"/);
 h.click({buildingAcquisition:'gain'});h.submit('dashboard-building',{buildingId:'b28'});assert.doesNotMatch(h.app.innerHTML,/id="building-setup-modal"/);
 h.run("updateBuildingOwnership('b28','transfer',1)");assert.doesNotMatch(h.app.innerHTML,/id="building-setup-modal"/);
 h.click({buildingAcquisition:'purchase'});h.submit('dashboard-building',{buildingId:'b33'});assert.match(h.app.innerHTML,/id="building-setup-modal"/);
 h.click({action:'undo'});assert.doesNotMatch(h.app.innerHTML,/id="building-setup-modal"/);assert.equal(h.run('game.dashboard.pendingBuildingSetup'),undefined);
});

test('Quest building modals show only remaining ownership slots and explain the cap',()=>{
 for(const [owned,id,slots] of [[7,'q42',2],[8,'q42',1],[9,'q42',0],[9,'q32',0],[9,'q96',0],[9,'q31',0]]){
  const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true;setupSelection.undermountain=true");h.submit('setup');
  h.run(`BUILDINGS.slice(0,${owned}).forEach(b=>changeBuilding(game,b.id,'gain',0))`);
  h.submit('dashboard-quest',{questId:id,printed:'10'});
  assert.equal((h.app.innerHTML.match(/id="threaten-building-[0-9]"/g)||[]).length,slots);
  assert.ok(h.app.innerHTML.includes('already controls '+owned+' buildings'));assert.match(h.app.innerHTML,/at most 9 buildings/);
  if(id==='q32')assert.match(h.app.innerHTML,/cannot place a building from the deck under your control/);
  if(slots)assert.ok(h.app.innerHTML.includes('gain only '+slots+' of the 3 buildings'));
  h.submit('threaten-buildings',{building1:'b33',building2:'b34',building3:'b35'});assert.equal(h.run('game.events.length'),0);assert.equal(h.run('ownedBuildings(game,0).length'),owned);
  const values={};if(slots>0)values.building1='b33';if(slots>1)values.building2='b34';h.submit('threaten-buildings',values);
  assert.equal(h.run('ownedBuildings(game,0).length'),9);assert.equal(h.run('liveScore(0,game.events)'),10);assert.equal(h.run('game.dashboard.pendingQuest'),undefined);
 }
});
test('Building entry blocks purchases and gains at nine and unlocks for another faction',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true");h.submit('setup');
 h.run("BUILDINGS.slice(0,9).forEach(b=>changeBuilding(game,b.id,'gain',0));render()");
 for(const action of ['purchase','gain']){
  h.click({buildingAcquisition:action});assert.match(h.run('dashboardBuildingsPanel()'),/cannot purchase or gain another building/);assert.match(h.run('dashboardBuildingsPanel()'),/disabled>Put building in play/);
  h.submit('dashboard-building',{buildingId:'b33'});assert.equal(h.run('ownedBuildings(game,0).length'),9);assert.equal(h.run('game.events.length'),0);
 }
 h.click({buildingEntryPlayer:'1'});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/cannot purchase or gain another building/);h.submit('dashboard-building',{buildingId:'b33'});assert.equal(h.run('ownedBuildings(game,1).length'),1);
});

test('Defame Rival Business purchase reminder belongs to its faction and sits below the action',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true");h.submit('setup');
 assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-defame-reminder/);
 h.submit('dashboard-quest',{questId:'q43',printed:'9'});
 let panel=h.run('dashboardBuildingsPanel()');assert.match(panel,/building-defame-reminder/);assert.match(panel,/move 1 skull from your Tavern to any action space/);assert.ok(panel.indexOf('building-defame-reminder')>panel.indexOf('Put building in play</button>'));assert.match(panel,/Red Sashes<\/strong>: When purchasing/);
 h.click({buildingAcquisition:'gain'});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-defame-reminder/);
 h.click({buildingAcquisition:'purchase'});h.click({buildingEntryPlayer:'1'});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-defame-reminder/);
 h.click({buildingEntryPlayer:'0'});assert.match(h.run('dashboardBuildingsPanel()'),/building-defame-reminder/);
 h.click({delete:h.run('game.events[0].id')});assert.doesNotMatch(h.run('dashboardBuildingsPanel()'),/building-defame-reminder/);
});

test('Dashboard Lord totals are read-only, reject manual overrides and require a choice for One Quest Type',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true;setupSelection.undermountain=true");h.submit('setup');
 h.submit('dashboard-quest',{questId:'q103',printed:'8'});
 h.run("changeBuilding(game,'b17','gain',0);changeBuilding(game,'b25','gain',0);view='final';finishStep='lord';finishOrder=[0,1];finishPosition=0;finishIndex=0;render()");
 h.click({bonus:'larissa'});assert.equal(h.run('game.players[0].final.counts.qualifying'),2);assert.match(h.app.innerHTML,/Lords by name/);assert.doesNotMatch(h.run('lordFields(game.players[0].final)'),/<input/);
 h.run("readFinal({values:{lord:'larissa','count:qualifying':'9'}})");assert.equal(h.run('game.players[0].final.counts.qualifying'),2);
 h.click({bonus:'irusyl'});h.submit('final',{lord:'irusyl'});assert.equal(h.run('game.players[0].final.confirmed'),false);
 h.click({dashboardChoice:'Warfare'});assert.equal(h.run('game.players[0].final.counts.qualifying'),1);h.submit('final',{lord:'irusyl','count:qualifying':'99'});assert.equal(h.run('game.players[0].final.counts.qualifying'),1);assert.equal(h.run('game.players[0].final.confirmed'),true);
});
test('Jump to end game retains editable Lord counts',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.skullport=true");h.click({action:'jump-end'});h.click({quickPenalty:'1'});h.submit('direct-setup',{'score:sashes':'0','score:guard':'10'});h.submit('resources',{});
 h.click({bonus:'irusyl'});assert.match(h.run('lordFields(game.players[0].final)'),/name="count:qualifying"/);assert.doesNotMatch(h.run('lordFields(game.players[0].final)'),/data-dashboard-choice/);
 h.submit('final',{lord:'irusyl','count:qualifying':'3'});assert.equal(h.run('game.players[0].final.counts.qualifying'),3);assert.equal(h.run('finalPreview(0).lord'),18);
});

test('Manual Lord override persists, preserves Expert hiding, resets on Lord change and can restore tracked totals',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.expert=true;setupSelection.skullport=true");h.submit('setup');h.run("changeBuilding(game,'b17','gain',0);view='final';finishStep='lord';finishOrder=[0,1];finishIndex=0;finishPosition=0;render()");
 h.click({bonus:'larissa'});assert.match(h.app.innerHTML,/lord-override-button/);assert.equal(h.run('game.players[0].final.counts.qualifying'),1);
 h.click({action:'toggle-lord-override'});assert.match(h.run('lordFields(game.players[0].final)'),/name="count:qualifying"/);assert.match(h.app.innerHTML,/Use tracked total/);
 h.run("readFinal({values:{lord:'larissa','count:qualifying':'3'}})");assert.equal(h.run('game.players[0].final.counts.qualifying'),3);assert.doesNotMatch(h.run('lordPreviewMarkup()'),/lord-score-preview/);
 const restored=harness(h.run('JSON.stringify(game)'));assert.equal(restored.run('game.players[0].final.manualLordCount'),true);assert.equal(restored.run('game.players[0].final.counts.qualifying'),3);
 h.click({action:'toggle-lord-override'});assert.equal(h.run('game.players[0].final.counts.qualifying'),1);assert.equal(h.run('game.players[0].final.manualLordCount'),false);
 h.click({action:'toggle-lord-override'});h.run("readFinal({values:{lord:'larissa','count:qualifying':'99'}})");assert.equal(h.run('game.players[0].final.counts.qualifying'),9);
 h.click({bonus:'sangalor'});assert.equal(h.run('game.players[0].final.manualLordCount'),false);assert.equal(h.run('game.players[0].final.counts.moduleTotal'),0);
 h.click({action:'toggle-lord-override'});h.submit('final',{lord:'sangalor','count:moduleTotal':'2'});assert.equal(h.run('game.players[0].final.confirmed'),true);assert.equal(h.run('finalPreview(0).lord'),8);
});

test('Victory controls edit all resources and Gold notes appear only for a points tie broken by Gold',()=>{
 const h=harness();h.run("setupSelection.factions=['sashes','guard'];setupSelection.undermountain=true");h.click({action:'jump-end'});h.submit('direct-setup',{'score:sashes':'10','score:guard':'20'});h.submit('resources',{});h.submit('final',{lord:'larissa','count:qualifying':'0'});h.submit('final',{lord:'danilo','count:qualifying':'0'});
 assert.equal(h.run('view'),'results');assert.doesNotMatch(h.app.innerHTML,/data-edit=|Return to scoreboard|Start New Game|Gold remaining/);assert.equal((h.app.innerHTML.match(/>Edit Final Scoring</g)||[]).length,1);assert.match(h.app.innerHTML,/victory-bottom-actions/);
 h.run('game.events[1].points=10;game.players[0].final.gold=1;render()');assert.equal((h.app.innerHTML.match(/Gold breaks the points tie/g)||[]).length,2);
 h.run('game.players[1].final.gold=1;render()');assert.doesNotMatch(h.app.innerHTML,/Gold remaining/);
 h.click({action:'edit-final'});assert.equal(h.run('view'),'final');assert.equal(h.run('finishStep'),'resources');assert.equal(h.run('game.players[0].final.gold'),1);assert.equal(h.run('game.finished'),false);assert.equal(h.run('game.players[0].final.confirmed'),false);
});
