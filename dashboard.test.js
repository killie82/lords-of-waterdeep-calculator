import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTS,BUILDINGS} from './catalog.js';
import {questCatalog,buildingCatalog,questReward,recalculateQuestEvents,changeBuilding,ownedBuildings,upkeepItems,trackedLordCounts} from './dashboard.js';
const fresh=()=>({players:[{name:'Red'},{name:'Blue'}],events:[],undermountain:true,skullport:true,dashboard:{buildings:{},history:[]},round:4});
const quest=name=>QUESTS.find(q=>q.name===name);
const building=name=>BUILDINGS.find(b=>b.name===name);
function complete(g,player,name,inputs={}){const q=quest(name),score=questReward(g,player,q.id,inputs);const e={id:String(g.events.length),player,questId:q.id,questInputs:{...inputs,printed:inputs.printed??q.vp},points:score.total,questParts:score.parts};g.events.push(e);return e;}
test('catalog includes all modules, sorts alphabetically, and excludes mandatory quests',()=>{
 const g=fresh();assert.equal(questCatalog(g).length,120);assert.equal(buildingCatalog(g).length,48);g.undermountain=false;g.skullport=false;assert.equal(questCatalog(g).length,60);assert.equal(buildingCatalog(g).length,24);
 assert.ok(questCatalog(g).every(q=>q.type!=='Mandatory'));assert.deepEqual(questCatalog(g).map(q=>q.name),questCatalog(g).map(q=>q.name).sort((a,b)=>a.localeCompare(b)));
});
test('Plot bonuses activate after completion, belong to their player, and explain points',()=>{
 const g=fresh(),plot=complete(g,0,'Quell Mercenary Uprising');assert.equal(plot.points,8);
 const next=complete(g,0,'Ambush Artor Morlin');assert.equal(next.points,quest('Ambush Artor Morlin').vp+2);assert.equal(next.questParts.at(-1).label,'Quell Mercenary Uprising');
 const other=complete(g,1,'Bolster City Guard');assert.equal(other.points,quest('Bolster City Guard').vp);
});
test('variable quest rewards use scoring details only and reject invalid cube counts',()=>{
 const g=fresh(),q=quest("Root Out Loviatar's Faithful");assert.equal(questReward(g,0,q.id,{variable:4}).total,23);assert.throws(()=>questReward(g,0,q.id,{variable:5}));
 assert.equal(questReward(g,0,quest('Unleash Crime Spree').id,{payment:true}).total,22);
 assert.equal(questReward(g,0,quest('Establish Harpers Safe House').id,{variable:3,heroes:true}).total,18);
});
test('ownership transfer, destruction, history and module tags do not award points',()=>{
 const g=fresh(),b=building('Monsters Made to Order');changeBuilding(g,b.id,'purchase',0);assert.equal(ownedBuildings(g,0)[0].module,'skullport');assert.equal(g.events.length,0);assert.throws(()=>changeBuilding(g,b.id,'gain',1));
 changeBuilding(g,b.id,'transfer',1);assert.equal(ownedBuildings(g,0).length,0);assert.equal(ownedBuildings(g,1).length,1);changeBuilding(g,b.id,'destroy',0);assert.equal(ownedBuildings(g,1).length,0);assert.equal(g.dashboard.history.length,3);assert.throws(()=>changeBuilding(g,b.id,'transfer',0));
});
test('nine-building limit applies to purchases and transfers',()=>{
 const g=fresh();BUILDINGS.slice(0,9).forEach(b=>changeBuilding(g,b.id,'purchase',0));assert.throws(()=>changeBuilding(g,BUILDINGS[9].id,'purchase',0));changeBuilding(g,BUILDINGS[9].id,'gain',1);assert.throws(()=>changeBuilding(g,BUILDINGS[9].id,'transfer',0));
});
test('round five reminder and building upkeep follow current ownership and play state',()=>{
 const g=fresh();const b=building('Spires of the Morning');changeBuilding(g,b.id,'purchase',0);complete(g,0,"Recover the Magister's Orb");complete(g,1,"Ally with the Xanathar's Guild");
 const items=upkeepItems(g,5);assert.match(items.general.join(' '),/extra Agent/);assert.match(items.general.join(' '),/white cube/);assert.ok(items.players.every(p=>p.reminders.length===1));assert.doesNotMatch(upkeepItems(g,6).general.join(' '),/extra Agent/);
 changeBuilding(g,b.id,'destroy',0);assert.doesNotMatch(upkeepItems(g,6).general.join(' '),/Spires/);
});
test('undo recalculates later Plot bonuses but preserves variable reward snapshots',()=>{
 const g=fresh(),plot=complete(g,0,'Quell Mercenary Uprising'),later=complete(g,0,'Ambush Artor Morlin'),variable=complete(g,0,'Establish Harpers Safe House',{variable:4});
 g.events=g.events.filter(e=>e!==plot);const changes=recalculateQuestEvents(g);assert.equal(changes.length,1);assert.equal(later.points,quest('Ambush Artor Morlin').vp);assert.equal(variable.points,16);
});
test('Lord counts use quest type, printed VP, expansion and current ownership',()=>{
 const g=fresh();complete(g,0,'Quell Mercenary Uprising');complete(g,0,'Ambush Artor Morlin');complete(g,0,"Root Out Loviatar's Faithful",{variable:4});changeBuilding(g,building('Monsters Made to Order').id,'gain',0);
 assert.deepEqual(trackedLordCounts(g,0,'piergeiron'),{pairTotal:3});assert.deepEqual(trackedLordCounts(g,0,'larissa'),{qualifying:1});assert.deepEqual(trackedLordCounts(g,0,'halaster'),{moduleTotal:1});assert.deepEqual(trackedLordCounts(g,0,'sangalor'),{moduleTotal:1});assert.deepEqual(trackedLordCounts(g,0,'danilo'),{qualifying:3});assert.deepEqual(trackedLordCounts(g,0,'irusyl','Warfare'),{qualifying:2});
 const expected=g.events.filter(e=>e.questInputs.printed>=10).length;assert.equal(trackedLordCounts(g,0,'trobriand').qualifying,expected);
});

test('Tax Collector grants Heroes Garden owner bonus on own use and recalculates without rewriting ownership',()=>{
 const g=fresh(),q=quest('Ambush Artor Morlin'),tax=complete(g,0,'Impersonate Tax Collector');
 assert.equal(questReward(g,0,q.id,{printed:10,heroes:true,heroesOwner:0}).total,16);
 assert.equal(questReward(g,0,q.id,{printed:10,heroes:true,heroesOwner:1}).total,14);
 assert.equal(questReward(g,1,q.id,{printed:10,heroes:true,heroesOwner:1}).total,14);
 assert.equal(questReward(g,0,q.id,{printed:10,heroes:false,heroesOwner:0}).total,10);
 const e=complete(g,0,'Ambush Artor Morlin',{printed:10,heroes:true,heroesOwner:0});assert.match(e.questParts.at(-1).label,/Impersonate Tax Collector/);
 changeBuilding(g,building("Heroes' Garden").id,'gain',1);recalculateQuestEvents(g);assert.equal(e.points,16);
 g.events=g.events.filter(e=>e.id!==tax.id);recalculateQuestEvents(g);assert.equal(e.points,14);
});

test('Ambassador round reminder is general and follows whether the Palace is in play',()=>{
 const g=fresh(),b=building('The Palace of Waterdeep');
 assert.doesNotMatch(upkeepItems(g,5).general.join(' '),/Ambassador/);
 changeBuilding(g,b.id,'purchase',0);
 const items=upkeepItems(g,5);assert.match(items.general.join(' '),/Whoever holds the Ambassador/);
 assert.ok(items.players.every(p=>!p.reminders.some(r=>r.name===b.name)));
 changeBuilding(g,b.id,'transfer',1);assert.match(upkeepItems(g,6).general.join(' '),/Ambassador/);
 changeBuilding(g,b.id,'destroy',1);assert.doesNotMatch(upkeepItems(g,6).general.join(' '),/Ambassador/);
});
