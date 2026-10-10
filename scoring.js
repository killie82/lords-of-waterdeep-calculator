export const QUEST_TYPES = ['Arcana', 'Commerce', 'Piety', 'Skullduggery', 'Warfare'];
const pair = (id, name, types) => ({id, name, module:'base', kind:'pair', types, rate:4});
export const LORDS = [
  pair('brianne', 'Brianne Byndraeth', ['Arcana','Skullduggery']),
  pair('caladorn', 'Caladorn Cassalanter', ['Skullduggery','Warfare']),
  pair('durnan', 'Durnan the Wanderer', ['Commerce','Warfare']),
  pair('khelben', 'Khelben Arunsun, the Blackstaff', ['Arcana','Warfare']),
  pair('kyriani', 'Kyriani Agrivar', ['Arcana','Piety']),
  {id:'larissa', name:'Larissa Neathal · The Builder', module:'base',kind:'builder',rate:6},
  pair('mirt', 'Mirt the Moneylender', ['Commerce','Piety']),
  pair('nindil', 'Nindil Jalbuck', ['Piety','Skullduggery']),
  pair('nymara', 'Nymara Scheiron', ['Commerce','Skullduggery']),
  pair('piergeiron', 'Piergeiron the Paladinson', ['Piety','Warfare']),
  pair('sammereza', 'Sammereza Sulphontis', ['Arcana','Commerce']),
  {id:'danilo',name:'Danilo Thann',module:'undermountain',kind:'all',rate:3},
  {id:'halaster',name:'Halaster Blackcloak',module:'undermountain',kind:'module',rate:4},
  {id:'trobriand',name:'Trobriand',module:'undermountain',kind:'large',rate:5},
  {id:'irusyl',name:'Irusyl Eraneth',module:'skullport',kind:'choice',rate:6},
  {id:'sangalor',name:'Sangalor',module:'skullport',kind:'module',rate:4},
  {id:'xanathar',name:'The Xanathar',module:'skullport',kind:'corruption',rate:4}
];
export function availableLords(modules = {}) {
  return LORDS.filter(lord=>lord.module==='base'||modules[lord.module]===true);
}
export function isLordAvailable(id, modules = {}) {
  return availableLords(modules).some(lord=>lord.id===id);
}
export function count(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0 || n > 10000) throw new Error('Enter a whole number from 0 to 10,000.');
  return n;
}
export function points(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || Math.abs(n) > 10000) throw new Error('Enter whole points between −10,000 and 10,000.');
  return n;
}
export const liveScore = (player, events) => events.filter(e=>e.player===player).reduce((sum,e)=>sum+e.points,0);
export function scoringEntries(values) {
  const entries=[];
  for (const source of ['quest','gems','intrigue','building','plot','emptyTrack','other']) {
    const raw=String(values[source]??'').trim();
    if (!raw) continue;
    if (!(source==='other'?/^-?\d+$/:/^\d+$/).test(raw)) throw new Error(source==='other'?'Corrections must be whole numbers.':'Only Other / correction allows point losses. Use whole positive numbers in the other sections.');
    const amount=source==='other'?points(raw):count(raw);
    if(source==='emptyTrack'&&amount%10!==0)throw new Error('Empty skull track penalties must be multiples of 10.');
    if(amount)entries.push({source,points:source==='emptyTrack'?-amount:amount});
  }
  if(!entries.length)throw new Error('Enter points in at least one section.');
  return entries;
}
export function lordBonus(lordId, final) {
  const lord = LORDS.find(l=>l.id===lordId);
  if (!lord) throw new Error('Select a Lord to finish scoring.');
  const counts = final.counts || {};
  if (lord.kind === 'pair') return (counts.pairTotal!==undefined?count(counts.pairTotal):lord.types.reduce((sum,t)=>sum+count(counts[t] ?? 0),0))*4;
  if (lord.kind === 'corruption') return count(final.corruption ?? 0)*4;
  if (lord.kind === 'module') return (counts.moduleTotal!==undefined?count(counts.moduleTotal):count(counts.quests ?? 0)+count(counts.buildings ?? 0))*4;
  return count(counts.qualifying ?? 0)*lord.rate;
}
export function finalScore(live, final, penalty = 0) {
  const adventurers = count(final.adventurers ?? 0);
  const gold = Math.floor(count(final.gold ?? 0)/2);
  const lord = lordBonus(final.lord, final);
  const corruption = -count(final.corruption ?? 0)*count(penalty);
  return {live, adventurers, gold, lord, corruption, total:live+adventurers+gold+lord+corruption};
}
export function rankPlayers(rows) {
  const sorted = [...rows].sort((a,b)=>b.score.total-a.score.total || b.gold-a.gold);
  return sorted.map((row,i)=>({...row,rank:i && row.score.total===sorted[i-1].score.total && row.gold===sorted[i-1].gold ? sorted.findIndex(r=>r.score.total===row.score.total && r.gold===row.gold)+1 : i+1}));
}
export function finalScoringOrder(scores) {
  return scores.map((score,index)=>({score,index}))
    .sort((a,b)=>a.score-b.score||a.index-b.index).map(row=>row.index);
}
export function skullTrackPenalty(value) {
  if(value===null||value===undefined||String(value).trim()==='')throw new Error('Choose a skull track value from 0 through 9.');
  const n=count(value);
  if(n>9)throw new Error('Choose a skull track value from 0 through 9.');
  return n;
}
