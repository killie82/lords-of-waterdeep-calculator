import test from 'node:test';
import assert from 'node:assert/strict';
import {LORDS,count,points,liveScore,scoringEntries,lordBonus,finalScore,rankPlayers,finalScoringOrder,skullTrackPenalty,availableLords,isLordAvailable} from './scoring.js';
test('event ledger keeps gains and losses by player, undo restores prior score',()=>{
 const events=[{player:0,points:40},{player:1,points:20},{player:0,points:3},{player:0,points:-10}];
 assert.equal(liveScore(0,events),33);assert.equal(liveScore(1,events),20);assert.equal(liveScore(0,events.slice(0,-1)),43);
});
test('all ten base quest Lords score both qualifying types',()=>{
 for(const l of LORDS.filter(l=>l.kind==='pair'))assert.equal(lordBonus(l.id,{counts:{[l.types[0]]:3,[l.types[1]]:2,unrelated:99}}),20);
});
test('quest-pair Lords use one combined count without adding saved separate counts again',()=>{
 for(const l of LORDS.filter(l=>l.kind==='pair')){
   const counts={[l.types[0]]:3,[l.types[1]]:2,pairTotal:7};
   assert.equal(lordBonus(l.id,{counts}),28);
   assert.equal(lordBonus(l.id,{counts:{...counts,pairTotal:0}}),0);
 }
 assert.throws(()=>lordBonus('brianne',{counts:{pairTotal:-1}}));
});
test('Builder and expansion Lords use distinct qualifying counts',()=>{
 assert.equal(lordBonus('larissa',{counts:{qualifying:9}}),54);
 for(const id of ['halaster','sangalor'])assert.equal(lordBonus(id,{counts:{quests:7,buildings:3}}),40);
 assert.equal(lordBonus('danilo',{counts:{qualifying:12}}),36);
 assert.equal(lordBonus('trobriand',{counts:{qualifying:6}}),30);
 assert.equal(lordBonus('irusyl',{counts:{qualifying:8}}),48);
});
test('expansion quest and building bonuses use a single combined count',()=>{
 for(const id of ['halaster','sangalor']){
   assert.equal(lordBonus(id,{counts:{quests:7,buildings:3,moduleTotal:12}}),48);
   assert.equal(lordBonus(id,{counts:{quests:7,buildings:3,moduleTotal:0}}),0);
   assert.throws(()=>lordBonus(id,{counts:{moduleTotal:-1}}));
 }
});
test('Xanathar receives bonus AND penalty at every track value',()=>{
 for(let penalty=0;penalty<=9;penalty++){const s=finalScore(100,{lord:'xanathar',corruption:6},penalty);assert.equal(s.lord,24);assert.equal(s.corruption,-6*penalty);assert.equal(s.total,124-6*penalty);}
});
test('final resources round Gold down and ignore the removed catch-all from old saves',()=>{
 const s=finalScore(100,{lord:'larissa',adventurers:7,gold:9,counts:{qualifying:3},corruption:4,extra:-2},5);
 assert.equal(s.gold,4);assert.equal(s.total,109);assert.equal(Object.hasOwn(s,'extra'),false);assert.equal(finalScore(100,{lord:'danilo',gold:1}).gold,0);
});
test('ties use Gold, then share ranks',()=>{
 const rows=rankPlayers([{name:'A',gold:5,score:{total:100}},{name:'B',gold:7,score:{total:100}},{name:'C',gold:7,score:{total:100}},{name:'D',gold:9,score:{total:90}}]);
 assert.deepEqual(rows.map(r=>[r.name,r.rank]),[['B',1],['C',1],['A',3],['D',4]]);
});
test('reject invalid counts and missing Lords',()=>{
 for(const n of [-1,1.5,Infinity,'abc',10001])assert.throws(()=>count(n));
 assert.equal(points(-10),-10);assert.throws(()=>points(1.5));assert.throws(()=>finalScore(0,{lord:''}));
});
test('multiple categories yield separate ledger entries, with correction losses',()=>{
 const entries=scoringEntries({quest:'20',gems:'3',intrigue:'',building:'0',plot:'2',other:'-5'});
 assert.deepEqual(entries,[{source:'quest',points:20},{source:'gems',points:3},{source:'plot',points:2},{source:'other',points:-5}]);
 assert.equal(entries.reduce((total,e)=>total+e.points,0),20);
});
test('only corrections accept negative values; decimals and scientific notation are rejected',()=>{
 for(const key of ['quest','gems','intrigue','building','plot'])assert.throws(()=>scoringEntries({[key]:'-1'}));
 for(const raw of ['1.5','1e2','abc','10001'])assert.throws(()=>scoringEntries({quest:raw}));
 assert.throws(()=>scoringEntries({other:'-1.5'}));
 assert.throws(()=>scoringEntries({quest:'',other:'0'}));
 assert.deepEqual(scoringEntries({quest:'3',other:'-3'}),[{source:'quest',points:3},{source:'other',points:-3}]);
});
test('final reveal order is last to first with ties in player number order',()=>{
 assert.deepEqual(finalScoringOrder([50,10,30,10,70]),[1,3,2,0,4]);
 assert.deepEqual(finalScoringOrder([10,10,10]),[0,1,2]);
 assert.deepEqual(finalScoringOrder([30,30,10,10]),[2,3,0,1]);
});
test('Skullport track value permits 0 through 9 but requires an explicit choice',()=>{
 for(let i=0;i<=9;i++)assert.equal(skullTrackPenalty(String(i)),i);
 for(const n of [null,undefined,'',-1,10,1.5,'abc'])assert.throws(()=>skullTrackPenalty(n));
});
test('Lord availability follows the selected game modules',()=>{
 const skullport=['irusyl','sangalor','xanathar'],undermountain=['danilo','halaster','trobriand'];
 for(const modules of [{},{undermountain:true},{skullport:true},{undermountain:true,skullport:true}]){
   assert.equal(availableLords(modules).length,11+(modules.undermountain?3:0)+(modules.skullport?3:0));
   for(const id of skullport)assert.equal(isLordAvailable(id,modules),!!modules.skullport);
   for(const id of undermountain)assert.equal(isLordAvailable(id,modules),!!modules.undermountain);
   for(const lord of LORDS.filter(l=>l.module==='base'))assert.equal(isLordAvailable(lord.id,modules),true);
 }
 assert.equal(isLordAvailable('unknown',{skullport:true,undermountain:true}),false);
});

test('empty skull track uses unsigned multiples of ten as recorded losses',()=>{
 assert.deepEqual(scoringEntries({emptyTrack:20}),[{source:'emptyTrack',points:-20}]);
 assert.deepEqual(scoringEntries({plot:5,emptyTrack:10,other:3}),[{source:'plot',points:5},{source:'emptyTrack',points:-10},{source:'other',points:3}]);
 assert.deepEqual(scoringEntries({quest:7,emptyTrack:0}),[{source:'quest',points:7}]);
 assert.throws(()=>scoringEntries({emptyTrack:-10}));
 assert.throws(()=>scoringEntries({emptyTrack:15}));
});

test('Building Lord bonus is capped at nine controlled buildings',()=>{
 assert.equal(lordBonus('larissa',{counts:{qualifying:9}}),54);
 assert.equal(lordBonus('larissa',{counts:{qualifying:25}}),54);
 assert.equal(lordBonus('danilo',{counts:{qualifying:25}}),75);
});
