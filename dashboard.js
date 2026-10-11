import {QUESTS, BUILDINGS} from './catalog.js';
import {count, LORDS} from './scoring.js';
export const moduleLabel = module => ({base:'Base',undermountain:'Undermountain',skullport:'Skullport'}[module]);
const inGame=(card,game)=>card.module==='base'||game[card.module]===true;
export const questCatalog=game=>QUESTS.filter(q=>inGame(q,game)).sort((a,b)=>a.name.localeCompare(b.name));
export const buildingCatalog=game=>BUILDINGS.filter(b=>inGame(b,game)).sort((a,b)=>a.name.localeCompare(b.name));
export const completedQuests=(game,player)=>game.events.filter(e=>e.player===player&&e.questId);
export const ownedBuildings=(game,player)=>buildingCatalog(game).filter(b=>game.dashboard?.buildings?.[b.id]?.owner===player);
export function questReward(game,player,questId,inputs={},prior=game.events){
 const quest=questCatalog(game).find(q=>q.id===questId);if(!quest)throw Error('Choose a quest from the selected game modules.');
 const printed=count(inputs.printed??quest.vp),parts=[{label:'Quest reward',points:printed}];
 if(quest.variable==='clerics'){
  const n=count(inputs.variable||0);if(n>quest.max)throw Error(`This quest accepts at most ${quest.max} white cubes in its flexible requirement.`);
  parts.push({label:`${n} white cubes × ${quest.rate} VP`,points:n*quest.rate});
 }
 if(quest.variable==='buildings'&&count(inputs.variable||0)>9)throw Error('A faction can control at most 9 buildings.');
 if(quest.variable==='buildings')parts.push({label:`${count(inputs.variable||0)} buildings × ${quest.rate} VP`,points:count(inputs.variable||0)*quest.rate});
 if(quest.variable==='payment'&&inputs.payment)parts.push({label:`Optional ${quest.payment} payment`,points:quest.rate});
 if(inputs.heroes)parts.push({label:'Immediate completion at Heroes’ Garden',points:4});
 if(inputs.heroes&&inputs.heroesOwner===player&&prior.some(e=>e.player===player&&QUESTS.find(q=>q.id===e.questId)?.name==='Impersonate Tax Collector'))parts.push({label:'Heroes’ Garden owner benefit · Impersonate Tax Collector',points:2});
 for(const event of prior.filter(e=>e.player===player&&e.questId)){
  const effect=QUESTS.find(q=>q.id===event.questId);
  if(effect?.bonusType===quest.type)parts.push({label:effect.name,points:effect.bonus});
 }
 return {quest,printed,parts,total:parts.reduce((sum,p)=>sum+p.points,0)};
}
// Recalculate later quest bonuses after removing an earlier completion.
// Variable answers are snapshots: never use today's ownership to rewrite past rewards.
export function recalculateQuestEvents(game){
 const prior=[];const changes=[];
 for(const event of game.events){
  if(event.questId){const score=questReward(game,event.player,event.questId,event.questInputs,prior);if(score.total!==event.points)changes.push({id:event.id,before:event.points,after:score.total});event.points=score.total;event.questParts=score.parts;event.note=score.quest.name+' · '+score.parts.map(p=>p.label+' '+(p.points>0?'+':'')+p.points+' VP').join(' · ');}
  if(event.purchaseBonusId){const score=prior.some(e=>e.player===event.player&&e.questId===event.purchaseBonusId)?4:0;if(score!==event.points)changes.push({id:event.id,before:event.points,after:score});event.points=score;}
  prior.push(event);
 }
 return changes;
}
export function changeBuilding(game,id,action,owner){
 if(!buildingCatalog(game).some(b=>b.id===id))throw Error('Choose a building from the selected modules.');
 const state=game.dashboard.buildings[id],present=state?.owner!==null&&state?.owner!==undefined;
 if(['transfer','destroy'].includes(action)&&!present)throw Error('That building is not currently owned.');
 if(['purchase','gain'].includes(action)&&present)throw Error('That building already has an owner. Use Transfer ownership.');
 if(!['purchase','gain','transfer','destroy'].includes(action))throw Error('Choose a building action.');
 if(action!=='destroy'){
  if(!Number.isInteger(owner)||!game.players[owner])throw Error('Choose the new owner.');
  if(action==='transfer'&&state.owner===owner)throw Error('Choose a different owner.');
  if(ownedBuildings(game,owner).length>=9)throw Error('A faction can control at most 9 buildings.');
 }
 const before=state?{...state}:null;
 game.dashboard.buildings[id]={owner:action==='destroy'?null:owner,destroyed:action==='destroy'};
 game.dashboard.history.push({id,before,action,owner,round:game.round});
 return BUILDINGS.find(b=>b.id===id);
}
export function upkeepItems(game,round){
 const general=['Add the round’s VP gems to the buildings in Builder’s Hall.'];
 if(round===5)general.push('Retrieve each faction’s extra Agent from the Round 5 tracker.');
 for(const building of buildingCatalog(game))if(game.dashboard?.buildings?.[building.id]?.owner!==null&&game.dashboard?.buildings?.[building.id]?.owner!==undefined){if(building.upkeep)general.push(`${building.name}: ${building.upkeep}`);if(building.roundReminder)general.push(building.roundReminder);}
 const players=game.players.map((p,i)=>({player:i,reminders:[...completedQuests(game,i).map(e=>QUESTS.find(q=>q.id===e.questId)).filter(q=>q?.plot&&q.reminder).map(q=>({name:q.name,text:q.reminder})),...ownedBuildings(game,i).filter(b=>b.reminder).map(b=>({name:b.name,text:b.reminder}))]}));
 return {general,players};
}
export function trackedLordCounts(game,player,lordId,choice){
 const lord=LORDS.find(l=>l.id===lordId);if(!lord)return {};
 const quests=completedQuests(game,player),buildings=ownedBuildings(game,player);
 if(lord.kind==='pair')return {pairTotal:quests.filter(e=>lord.types.includes(QUESTS.find(q=>q.id===e.questId)?.type)).length};
 if(lord.kind==='builder')return {qualifying:buildings.length};
 if(lord.kind==='module')return {moduleTotal:quests.filter(e=>QUESTS.find(q=>q.id===e.questId)?.module===lord.module).length+buildings.filter(b=>b.module===lord.module).length};
 if(lord.kind==='all')return {qualifying:quests.length};
 if(lord.kind==='large')return {qualifying:quests.filter(e=>count(e.questInputs?.printed??QUESTS.find(q=>q.id===e.questId)?.vp)>=10).length};
 if(lord.kind==='choice'&&choice)return {qualifying:quests.filter(e=>QUESTS.find(q=>q.id===e.questId)?.type===choice).length};
 return {};
}
