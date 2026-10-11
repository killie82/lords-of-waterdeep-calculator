import {LORDS, QUEST_TYPES, count, points, liveScore, scoringEntries, finalScore, rankPlayers, finalScoringOrder, skullTrackPenalty, availableLords, isLordAvailable} from './scoring.js';
import {QUESTS, BUILDINGS} from './catalog.js';
import {moduleLabel, questCatalog, buildingCatalog, completedQuests, ownedBuildings, questReward, recalculateQuestEvents, changeBuilding, upkeepItems, trackedLordCounts} from './dashboard.js';
const app = document.querySelector('#app');
const KEY = 'waterdeep-scorekeeper-v1';
const colors = ['#e4bf64','#67aee4','#b079d2','#df6d62','#83b37f','#abb8bb'];
const FACTIONS = [
  {id:'shield',name:'Knights of the Shield',color:'#e4bf64',tone:'Yellow',icon:'shield'},
  {id:'guard',name:'City Guard',color:'#a3a9aa',tone:'Black',icon:'guard'},
  {id:'silverstars',name:'Silverstars',color:'#67aee4',tone:'Blue',icon:'star'},
  {id:'harpers',name:'Harpers',color:'#83b37f',tone:'Green',icon:'harp'},
  {id:'sashes',name:'Red Sashes',color:'#df6d62',tone:'Red',icon:'sash'},
  {id:'hands',name:'Gray Hands',color:'#bbc3c7',tone:'Gray',icon:'hand'}
];
const setupSelection = {undermountain:false,skullport:false,expert:false,dashboardMode:true,factions:[]};
const QUEST_COLORS = {
  Arcana:{background:'#805293',ink:'#fff7ed',border:'#bc8dca'},
  Commerce:{background:'#70843c',ink:'#fff8e6',border:'#b0c477'},
  Piety:{background:'#eee0bb',ink:'#393429',border:'#d0b985'},
  Skullduggery:{background:'#393831',ink:'#f3ead7',border:'#938c72'},
  Warfare:{background:'#ca6038',ink:'#fff7e8',border:'#eaa078'}
};
function icon(kind) {
  const paths = {
    gem:'<g stroke="#632522" stroke-width="1"><path d="M24 3 39 15 43 24 24 45 5 24 9 15Z" fill="#b73732"/><path d="M24 3 17 16 9 15Z" fill="#ed8b76"/><path d="m24 3 7 13 8-1Z" fill="#d65b4e"/><path d="m9 15 8 1-5 8H5Z" fill="#c84a40"/><path d="m39 15-8 1 5 8h7Z" fill="#8c272a"/><path d="M17 16h14l5 8-12 12-12-12Z" fill="#e45b4c"/><path d="m5 24 7 0 12 12v9Z" fill="#9e282e"/><path d="m43 24-7 0-12 12v9Z" fill="#721e29"/><path d="m17 16 7-13 7 13Z" fill="#f69a7d"/></g><path d="m18 18-4 6 10 10" stroke="#ffb29a" stroke-width="1.2"/><path d="m24 3 15 12 4 9-19 21L5 24l4-9Z" stroke="#d89d76" stroke-width="1.1"/>',
    bell:'<path d="M10 34h28l-4-6V18a10 10 0 0 0-20 0v10l-4 6Z"/><path d="M20 39a4 4 0 0 0 8 0M24 5v3"/>',
    city:'<path d="M7 40V18h10v22m-10-22v-7h3v4h4v-4h3v7M31 40V18h10v22m-10-22v-7h3v4h4v-4h3v7M17 40V25h14v15M20 40v-8a4 4 0 0 1 8 0v8M4 40h40"/>',
    mountain:'<path d="m4 36 15-23 7 11 5-7 13 19H4Zm10-15 5 3 4-3M16 36l6-9 7 9m-6 0v-4m10-8 4 2"/>',
    skull:'<path d="M13 28c-4-4-5-8-3-13 2-6 7-9 14-9s12 3 14 9c2 5 1 9-3 13l-3 2v10H16V30l-3-2Z"/><circle cx="17" cy="21" r="4"/><circle cx="31" cy="21" r="4"/><path d="m24 26-3 5h6l-3-5Zm-4 9v5m8-5v5"/>',
    shield:'<circle cx="24" cy="24" r="21"/><circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="14.5"/><path d="M11 24c6-9 20-9 26 0-6 9-20 9-26 0Z"/><circle cx="24" cy="24" r="5"/><circle cx="24" cy="24" r="2" fill="currentColor"/><path d="m22 3 2 3 2-3m7 2-1 4 4-1m5 6-4 1 2 3m3 9-4-2v4m-3 10-1-4-3 2m-7 8 2-3 2 3m-13-4 4-1-2-3m-9-7 4 1-1-4m-1-10 3 2 1-4m5-6 1 4 3-2"/>',
    guard:'<path d="M8 7h32v16c0 10-7 17-16 22C15 40 8 33 8 23V7Z" fill="currentColor" fill-opacity=".15"/><path d="M12 11h24v12c0 8-5 14-12 18-7-4-12-10-12-18V11Z"/><path d="M29 17a9 9 0 1 0 0 16 9 9 0 0 1 0-16Z" fill="currentColor" stroke="none"/>',
    star:'<path d="M7 13h34v22H7Z" fill="currentColor" fill-opacity=".25"/><path d="M7 13c-6 0-6 7 0 7h3V13H7Zm34 0c6 0 6 7 0 7h-3V13h3ZM7 35c-6 0-6-7 0-7h3v7H7Zm34 0c6 0 6-7 0-7h-3v7h3Z" fill="currentColor" fill-opacity=".35"/><path d="M10 13v22m28-22v22M4 16h3m34 0h3M4 32h3m34 0h3"/><circle cx="24" cy="24" r="10" fill="var(--faction-shade,#223c54)"/><circle cx="24" cy="24" r="6.8"/><g fill="currentColor" stroke="none"><circle cx="24" cy="16" r=".8"/><circle cx="29.7" cy="18.3" r=".8"/><circle cx="32" cy="24" r=".8"/><circle cx="29.7" cy="29.7" r=".8"/><circle cx="24" cy="32" r=".8"/><circle cx="18.3" cy="29.7" r=".8"/><circle cx="16" cy="24" r=".8"/><circle cx="18.3" cy="18.3" r=".8"/></g>',
    harp:'<path d="M29 5C12 1 2 15 5 29c3 15 23 20 35 8-9 6-24 3-28-8C8 18 16 7 29 5Z" fill="currentColor" fill-opacity=".55"/><path d="M22 13c2 4 8 5 13 1l-9 23c-5-2-7-6-7-11V14l3-1Z" fill="currentColor" fill-opacity=".2"/><path d="M22 17v13m4-11v15m4-16-4 16M19 14l2-4 3 5m1 22 2 2 10-25-2-1"/><path d="m34 5 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm8 6 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm-2 10 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="currentColor"/>',
    sash:'<path d="M27 9c13 1 16 11 11 19-1-6-6-11-13-11m-8 7C4 36 17 48 32 38c-11 2-17-5-15-14Z" fill="currentColor" fill-opacity=".65"/><circle cx="24" cy="5" r="3"/><path d="M22 8h4v10l9 2v4l-9-2v19l-2 5-2-5V22l-9 2v-4l9-2V8Z" fill="currentColor" fill-opacity=".25"/><path d="M24 25v16M13 20l-5 7 5-3m22-4 4 5-4-1"/>',
    hand:'<path d="M12 26V14a3 3 0 0 1 6 0v10-16a3 3 0 0 1 6 0v16-14a3 3 0 0 1 6 0v15-11a3 3 0 0 1 6 0v18c0 6-4 10-9 11H17c-5-3-7-7-10-12l-3-6c-1-4 3-6 6-2l5 7" fill="currentColor" fill-opacity=".15"/><path d="M12 18h6m0-5h6m0 3h6m0 5h6M18 26l-1 7 5 4m8-11-1 7-5 4M15 42h16v4H15Z"/><path d="M20 29h6m-6 3h6M8 26l4 5"/>'
  };
  return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.shield}</svg>`;
}
function gameLabel() {return ['Base',setupSelection.undermountain?'Undermountain':'',setupSelection.skullport?'Skullport':''].filter(Boolean).join(' + ');}
let game = null, view = 'setup', selected = 0, finishIndex = 0;
let lastRenderedView=null;
let historyOpen = false, roundsOpen = false, setupGuideOpen = false;
let finishOrder=[], finishPosition=0, finishStep='resources', lordNamesOpen=false;
let penaltyModal=false, pendingPenalty=null;
let quickScores={}, quickPenalty=null;
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed = n => n>0 ? '+'+n : String(n);
const say = text => {document.querySelector('#notice').textContent=text;};
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved?.version===1 && Array.isArray(saved.players) && saved.players.length>=2 && saved.players.length<=6 && Array.isArray(saved.events)) {
    game=saved;
    game.trackRounds ||= false;
    if(game.dashboardMode){game.dashboard||={buildings:{},history:[]};game.trackRounds=true;}
    game.players.forEach((p,i)=>{const faction=FACTIONS.find(f=>f.id===p.faction)||FACTIONS[i];p.faction=faction.id;p.name=faction.name;p.color=faction.color;});
    for(const player of game.players){
      delete player.final.extra;
      delete player.final.choice;
      if(player.final.lord&&!isLordAvailable(player.final.lord,game)){
        Object.assign(player.final,{lord:'',questTypes:[],counts:{},selectionMode:'pill',confirmed:false});game.finished=false;
        say('A saved Lord required an expansion that is not in this game. Choose an available bonus or Lord during final scoring.');
      }
    }
    if(game.skullport&&game.penalty===0)game.players.forEach(p=>p.final.corruption=0);
    view=game.finished ? 'results' : 'live';
    const flow=game.finalFlow;
    if(!game.finished&&flow&&Array.isArray(flow.order)&&flow.order.length===game.players.length&&new Set(flow.order).size===game.players.length&&flow.order.every(i=>Number.isInteger(i)&&i>=0&&i<game.players.length)&&flow.position>=0&&flow.position<flow.order.length){
      finishOrder=flow.order;finishPosition=flow.position;finishStep=flow.step==='lord'?'lord':'resources';finishIndex=finishOrder[finishPosition];view='final';
    }
  }
} catch {say('The saved game could not be loaded. Start a new game below.');}
function save() {
  if(game){if(view==='final')game.finalFlow={order:finishOrder,position:finishPosition,step:finishStep};else delete game.finalFlow;}
  try {localStorage.setItem(KEY,JSON.stringify(game));}
  catch {say('Browser saving is unavailable. Keep this tab open to preserve this game.');}
}
const emptyFinal = () => ({lord:'',selectionMode:'pill',counts:{},adventurers:0,gold:0,corruption:0,confirmed:false});
const button = (action,text,cls='') => `<button type="button" data-action="${action}" class="${cls}">${text}</button>`;
const number = (name,label,value=0,negative=false) => `<label>${label}<input name="${name}" type="number" inputmode="${negative?'text':'numeric'}" step="1" ${negative?'min="-10000"':'min="0"'} max="10000" value="${escape(value)}" required></label>`;
const sourceInfo = {
  quest:['Quest completed','Enter the VP reward on the card. Record ongoing Plot Quest bonuses separately. Mandatory Quest rewards can be recorded here too.'],
  gems:['Victory point gems','Enter the number of VP tokens collected from a building or action space.'],
  intrigue:['Intrigue card','Points gained from intrigue cards. Record losses under Other / correction.'],
  building:['Building / owner benefit','Score points from a building action or owner benefit. Use Victory point gems for tokens already collected.'],
  plot:['Plot Quest bonus','Record the points from a triggered ongoing Plot Quest effect.'],
  other:['Other / correction','Record another point gain, loss, or a correction to the running score.']
};
function resourceInput(name,label,value,hint) {
  return `<div class="entry-row"><div><label for="resource-${name}">${label}</label><p class="hint resource-rate" id="resource-help-${name}">${hint}</p></div><div class="entry-value"><input aria-describedby="resource-help-${name}" id="resource-${name}" name="${name}" type="number" inputmode="numeric" min="0" max="10000" step="1" value="${escape(value||'')}" aria-label="${label}"></div></div>`;
}
function setupGuide() {
  const players=setupSelection.factions.length;
  const {undermountain,skullport}=setupSelection;
  const both=undermountain&&skullport, long=both||players===6;
  const agents=players>=2?(long?{2:5,3:4,4:3,5:3,6:2}:{2:4,3:3,4:2,5:2})[players]:null;
  return `<details class="panel setup-guide" id="setup-guide" ${setupGuideOpen?'open':''}><summary>Setup Guide</summary><div class="optional-content"><p class="eyebrow">${gameLabel()} · ${players} PLAYERS</p>
  <section><h3>Starting Agents in Pool</h3>${agents?`<p><strong>${agents} Agents per player</strong>${long?' · Long Game':''}.</p>`:'<p>Choose at least two factions to see the starting Agent count.</p>'}<p class="hint">Set aside one additional Agent per player beside Round 5. Add it to each player’s pool at the start of that round.</p>${long?`<p class="rule-note">Long Game is required ${both?'when both expansions are used':'for six players'}. The count above already includes the Long Game adjustment.</p>`:((undermountain||skullport)?'<p class="hint">With one expansion and five or fewer players, <strong>Long game is optional: start with 1 extra Agent</strong> per player if your group chooses it.</p>':'')}</section>
  ${undermountain?'<section><h3>Undermountain game board</h3><p>Place the Undermountain board beside the base game board, within everyone’s reach.</p></section>':''}
  ${skullport?'<section><h3>Skullport game board and Corruption track</h3><p>Place the Skullport board and Corruption track beside the base game board.</p><p class="hint">Place 1 skull token on −1 and 3 skull tokens on each space from −2 through −9 (25 tokens total).</p></section>':''}
  ${both?'<section><h3>Prepare the base game components</h3><p>Before setup, randomly remove these base game components and return them to the box:</p><ul><li><strong>25 Intrigue cards</strong></li><li><strong>30 Quest cards</strong></li><li><strong>12 Buildings</strong></li></ul><p class="hint">Shuffle the remaining base game Intrigue cards, Quest cards, and Buildings with their matching components from both expansions.</p></section>':''}
  <p class="hint">See the rulebook links at the bottom of the page for the full setup rules.</p></div></details>`;
}
function setup() {
  return `<div class="compact-setup"><section class="home-shortcut">${button('jump-end','Already completed round 8?<br>Jump to end game scoring','primary jump-end')}</section>
  <form id="setup"><div class="setup-panels"><section class="panel setup-game-panel"><p class="eyebrow">01 · YOUR GAME</p><h2>Choose your adventure</h2>
  <p class="hint">Base is always included. Add either expansion, or play with both.</p>
  <div class="game-cards" role="group" aria-label="Game modules">${[
    ['base','Base','city','Base'],['undermountain','UM','mountain','Undermountain'],['skullport','SP','skull','Skullport']
  ].map(([id,name,symbol,fullName])=>{const active=id==='base'||setupSelection[id];return `<button type="button" class="selection-card game-card ${active?'is-selected':''}" data-module="${id}" aria-label="${fullName}" aria-pressed="${active}" ${id==='base'?'aria-disabled="true"':''}>${icon(symbol)}<strong>${name}</strong><span class="card-state">${active?'Included':'Tap to add'}</span></button>`;}).join('')}</div>
  <p class="game-summary">${gameLabel()}</p></section><section class="panel setup-council-panel"><div class="section-title faction-heading"><div><p class="eyebrow">02 · YOUR COUNCIL</p><h2>Pick your factions</h2></div><span class="badge">${setupSelection.factions.length} PLAYERS</span></div>
  <p class="hint">Tap each faction at the table. Select at least two; ${setupSelection.undermountain||setupSelection.skullport?'up to six with an expansion':'up to five for Base'}. Selection order sets the scoreboard order.</p>
  <div class="faction-cards" role="group" aria-label="Player factions">${FACTIONS.map(f=>{const position=setupSelection.factions.indexOf(f.id);return `<button type="button" class="selection-card faction-card ${position>=0?'is-selected':''} faction-${f.id}" data-faction="${f.id}" aria-label="${escape(f.name)}${position>=0?', Player '+(position+1):''}" title="${escape(f.name)}" aria-pressed="${position>=0}" style="--faction:${f.color}">${icon(f.icon)}<span class="card-state">${position>=0?'Player '+(position+1):'Tap to add'}</span></button>`;}).join('')}</div>
  </section></div><div class="setup-start"><p class="hint">${setupSelection.factions.length<2?'Choose at least two factions to begin.':'Your council is ready. Lords stay secret until final scoring.'}</p><div class="setup-start-actions"><button type="button" data-action="toggle-expert" class="mode-toggle ${setupSelection.expert?'expert-selected':''}" aria-pressed="${setupSelection.expert}"><strong>${setupSelection.expert?'Expert Mode':'Normal'}</strong><br><small>${setupSelection.expert?'All points hidden until end':'Points displayed normally'}</small></button><button class="primary" type="submit" ${setupSelection.factions.length<2?'disabled':''}>Start game <span aria-hidden="true">→</span></button></div></div></form>${setupGuide()}</div>`;
}
function directSetup() {
  return `<div class="toolbar">${button('back-setup','Back to home','quiet')}<p class="eyebrow">JUMP TO END GAME SCORING</p></div><section class="welcome"><h2>Set the current scores</h2><p>Use the scores before counting leftover cubes, Gold, skulls, or Lord bonuses.</p></section>
  <form id="direct-setup">
  <section class="direct-undermountain"><button type="button" data-action="quick-undermountain" class="track-picker-button ${setupSelection.undermountain?'chosen':''}" aria-pressed="${setupSelection.undermountain}">${icon('mountain')}<span>${setupSelection.undermountain?'Undermountain selected':'Playing with Undermountain module?'}</span></button></section>
  <section class="direct-skullport"><button type="button" data-action="quick-skullport" class="track-picker-button ${setupSelection.skullport?'chosen':''}" aria-expanded="${setupSelection.skullport}" aria-controls="quick-track-values">${icon('skull')}<span>${setupSelection.skullport?'Skullport selected':'Playing with Skullport module?'}</span></button>
  ${setupSelection.skullport?`<div id="quick-track-values"><p class="hint">Choose the current corruption penalty per skull.</p><button type="button" data-quick-penalty="0" class="full-track-option ${quickPenalty===0?'chosen':''}" aria-pressed="${quickPenalty===0}">0 VP, All skulls on corruption track</button><div class="track-values">${Array.from({length:9},(_,i)=>i+1).map(n=>`<button type="button" data-quick-penalty="${n}" class="${quickPenalty===n?'chosen':''}" aria-pressed="${quickPenalty===n}">${icon('skull')}<span>−${n} VP</span></button>`).join('')}</div></div>`:''}</section>
  <section class="panel direct-factions-panel"><h3>Your factions</h3><p class="hint">Click a score box or faction to include it in player order. A score of 0 counts; untouched blank rows are excluded.</p>
  ${FACTIONS.map(f=>{const position=setupSelection.factions.indexOf(f.id);return `<div class="direct-score-row" style="--faction:${f.color}"><button type="button" data-faction="${f.id}" aria-pressed="${position>=0}" class="direct-faction ${position>=0?'chosen':''}">${icon(f.icon)}<span><small>${position>=0?'Player '+(position+1):'Tap to include'}</small>${f.name}</span></button><label for="quick-${f.id}"><span class="sr-only">${f.name} current score</span><input id="quick-${f.id}" name="score:${f.id}" type="text" inputmode="numeric" pattern="-?[0-9]*" maxlength="6" autocomplete="off" enterkeyhint="next" placeholder="0" value="${escape(quickScores[f.id]??'')}"></label></div>`}).join('')}</section>
  <div class="setup-start"><p class="hint">${setupSelection.factions.length} factions selected${setupSelection.skullport&&quickPenalty===null?' · Choose the Corruption track value':''}</p><button class="primary" type="submit" ${setupSelection.factions.length<2||(setupSelection.skullport&&quickPenalty===null)?'disabled':''}>Count final resources →</button></div></form>`;
}
function openDirectSetup() {
  if(game?.directEnd){setupSelection.factions=game.players.map(p=>p.faction);setupSelection.undermountain=game.undermountain;setupSelection.skullport=game.skullport;quickPenalty=game.skullport?game.penalty:null;quickScores=Object.fromEntries(game.players.map((p,i)=>[p.faction,liveScore(i,game.events)]));}
  view='direct';render();window.scrollTo(0,0);
}
function scoreboard() {
  if(game.dashboardMode)return `<div class="scoreboard dashboard-scoreboard">${game.players.map((p,i)=>`<button type="button" data-building-player="${i}" aria-pressed="${i===selected}" class="player dashboard-score ${i===selected?'chosen':''}" style="--player:${p.color}" aria-label="${escape(p.name)}: ${game.expert?'score hidden':liveScore(i,game.events)+' victory points'}" title="${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}<strong>${game.expert?'???':liveScore(i,game.events)}</strong></button>`).join('')}</div>`;
  return `<div class="scoreboard">${game.players.map((p,i)=>`<div class="player" style="--player:${p.color||colors[i]}"><span class="player-name">${escape(p.name)}</span><strong>${game.expert?'???':liveScore(i,game.events)}</strong><span class="unit">VICTORY POINTS</span></div>`).join('')}</div>`;
}
function entryDraft() {
  game.draft ||= game.drafts?.[selected] || {values:{},note:'',loss:false};
  delete game.drafts;
  return game.draft;
}
function factionPicker() {
  return `<div class="entry-factions" role="group" aria-label="Faction receiving these points">${game.players.map((p,i)=>{const f=FACTIONS.find(f=>f.id===p.faction);return `<button type="button" data-player="${i}" aria-label="Record points for ${escape(p.name)}" aria-pressed="${selected===i}" class="entry-faction ${selected===i?'chosen':''}" style="--faction:${p.color}">${icon(f?.icon)}<span>${escape(p.name)}</span></button>`;}).join('')}</div>`;
}
function emptyTrackRow() {
  const amount=count(entryDraft().values.emptyTrack||0);
  return `<div class="entry-row empty-track-row"><div><label for="entry-empty-track">Gain skull when skull track is empty</label><p class="hint" id="help-empty-track">When corruption track is empty, lose 10 VP per skull gained</p></div><div class="skull-stepper"><button type="button" data-skull-step="minus" aria-label="Subtract 10 penalty points" ${amount===0?'disabled':''}>−</button>${icon('skull')}<button type="button" data-skull-step="plus" aria-label="Add 10 penalty points" ${amount>=10000?'disabled':''}>+</button></div><div class="entry-value skull-penalty-total ${amount>0?'has-penalty':''}"><input id="entry-empty-track" type="text" value="${amount>0?'−'+amount:0}" readonly tabindex="-1" aria-describedby="help-empty-track" aria-label="Empty track penalty points"><span class="entry-unit">VP</span></div></div>`;
}
function entryRows(sources=Object.keys(sourceInfo)) {
  const draft=entryDraft();
  return Object.entries(sourceInfo).filter(([key])=>sources.includes(key)).map(([key,[label,help]])=>`${key==='other'&&game.skullport?emptyTrackRow():''}<div class="entry-row"><div><label for="entry-${key}">${label}</label><p class="hint" id="help-${key}">${help}</p>${key==='other'?`<div class="correction-sign" role="group" aria-label="Correction direction"><button type="button" data-sign="gain" class="${!draft.loss?'chosen':''}" aria-pressed="${!draft.loss}">+ Gain</button><button type="button" data-sign="loss" class="${draft.loss?'chosen':''}" aria-pressed="${draft.loss}">− Loss</button></div>`:''}</div><div class="entry-value ${key==='other'&&draft.loss?'correction-loss':''}"><input id="entry-${key}" name="${key}" type="text" inputmode="numeric" pattern="${key==='other'&&draft.loss?'-?[0-9]*':'[0-9]*'}" maxlength="${key==='other'&&draft.loss?6:5}" value="${escape(key==='other'&&draft.loss&&draft.values[key]?'-'+draft.values[key]:draft.values[key]||'')}" placeholder="${key==='other'&&draft.loss?'−0':'0'}" aria-describedby="help-${key}" autocomplete="off" enterkeyhint="next"><span class="entry-unit">VP</span></div></div>`).join('');
}
function recordPointsForm(sources=Object.keys(sourceInfo),showNote=true) {
  const p=game.players[selected];
  return `<form id="event">${entryRows(sources)}
  <div class="record-actions"><details class="record-faction-picker" style="--selected-player:${selected}"><summary class="record-faction-icon" style="--faction:${p.color}" aria-label="Change recording faction, currently ${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</summary><div class="record-faction-menu" role="group" aria-label="Choose recording faction">${game.players.map((f,i)=>`<button type="button" data-record-player="${i}" style="--faction:${f.color}" aria-label="Player ${i+1}: ${escape(f.name)}" title="Player ${i+1}: ${escape(f.name)}" aria-pressed="${i===selected}">${icon(FACTIONS.find(x=>x.id===f.faction)?.icon)}</button>`).join('')}</div></details><button class="primary record-submit" type="submit">Record points</button></div>
  ${showNote?`<label>Note <span class="optional">optional · applies to this submission</span><input name="note" maxlength="100" value="${escape(entryDraft().note)}" placeholder="Quest or card name, or a reminder" autocomplete="off"></label>`:""}
  </form>`;
}
function dashboardAdditionalPoints(){
 const p=game.players[selected],pending=points(game.dashboard.pendingPoints||0);
 return `<form id="dashboard-points"><div class="dashboard-point-buttons" role="group" aria-label="Adjust pending points">${[-5,-1,1,5].map(delta=>`<button type="button" data-points-step="${delta}" class="${delta<0?'point-decrease':'point-increase'}">${delta<0?'−'+Math.abs(delta):'+'+delta} VP</button>`).join('')}</div><div class="record-actions dashboard-manual-actions"><details class="record-faction-picker" style="--selected-player:${selected}"><summary class="record-faction-icon" style="--faction:${p.color}" aria-label="Change recording faction, currently ${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</summary><div class="record-faction-menu" role="group" aria-label="Choose recording faction">${game.players.map((f,i)=>`<button type="button" data-record-player="${i}" style="--faction:${f.color}" aria-label="Player ${i+1}: ${escape(f.name)}" title="Player ${i+1}: ${escape(f.name)}" aria-pressed="${i===selected}">${icon(FACTIONS.find(x=>x.id===f.faction)?.icon)}</button>`).join('')}</div></details><output id="dashboard-pending-points" class="pending-points ${pending<0?'loss':''}" aria-live="polite" aria-label="Pending points">${signed(pending)} <span>VP</span></output><button class="primary record-submit" type="submit" ${pending===0?'disabled':''}>Record points</button></div></form>`;
}
function simplePointsPanel(){
  const p=game.players[selected];
  return `<section class="panel"><div class="section-title"><div><p class="eyebrow">ADD TO THE LEDGER</p><h2>Record points</h2></div><span class="diamond" aria-hidden="true">◆</span></div>
  ${factionPicker()}<p class="entry-recipient">Recording for <strong style="color:${p.color}">${escape(p.name)}</strong></p>${game.dashboardMode?'<p class="hint">Named quest completions already include their rewards and quest-type Plot bonuses. Record only additional points here. Manual points do not add cards to your completed quests.</p>':''}${recordPointsForm()}</section>`;
}
function dashboardInfoHeading(title,id,text){
 return `<div class="dashboard-info-heading"><h3 id="${id}-title">${title}</h3><button type="button" class="info-button" data-info-toggle="${id}-info" aria-label="Information about ${title}" aria-expanded="false" aria-controls="${id}-info">i</button></div><p id="${id}-info" class="hint dashboard-info" hidden>${text}</p>`;
}
function heroesGardenInPlay(){const state=game.dashboard.buildings[BUILDINGS.find(b=>b.name==="Heroes' Garden").id];return state?.owner!==null&&state?.owner!==undefined;}
function dashboardDraft(){const draft=game.dashboard.draft||={questId:'',printed:'',variable:'',payment:false};if(!heroesGardenInPlay())draft.heroes=false;draft.heroesOwner=heroesGardenInPlay()?game.dashboard.buildings[BUILDINGS.find(b=>b.name==="Heroes' Garden").id].owner:null;return draft;}
function dashboardPanel(){
 const p=game.players[selected],draft=dashboardDraft(),q=questCatalog(game).find(q=>q.id===draft.questId);
 let reward=null;try{if(q)reward=questReward(game,selected,q.id,draft);}catch{}
 const quests=completedQuests(game,selected),buildings=ownedBuildings(game,selected),tab=game.dashboard.tab==='buildings'?'buildings':'points';
 return `<section class="dashboard"><div class="panel dashboard-round"><p class="dashboard-current-round">Current round <strong>${game.round}</strong><span> / 8</span></p><div class="round-actions"><button type="button" data-action="show-upkeep" class="quiet round-icon-button" aria-label="Round reminders" title="Round reminders">${icon('bell')}</button><button type="button" data-action="round" class="primary round-icon-button round-next" aria-label="Next round" title="Next round" ${game.round>=8?'disabled':''}>+</button></div></div>
 <div class="panel dashboard-workspace"><div class="dashboard-tabs" role="tablist" aria-label="Dashboard sections">${[['points','Points'],['buildings','Buildings']].map(([id,label])=>`<button type="button" id="dashboard-${id}-tab" role="tab" data-dashboard-tab="${id}" aria-selected="${tab===id}" aria-controls="dashboard-${id}-panel" class="${tab===id?'chosen':''}">${label}</button>`).join('')}</div>
 <section id="dashboard-points-panel" role="tabpanel" aria-labelledby="dashboard-points-tab" class="dashboard-faction dashboard-tab-panel dashboard-workspace-content" ${tab==='points'?'':'hidden'}><p class="entry-recipient dashboard-faction-summary"><strong style="color:${p.color}">${escape(p.name)}:</strong> ${quests.length} ${quests.length===1?'Quest':'Quests'}, ${buildings.length} ${buildings.length===1?'Building':'Buildings'}</p>
 <section class="dashboard-quest-section"><div class="quest-selection-row"><label for="dashboard-quest-select"><span class="sr-only">Quest name</span><select form="dashboard-quest" id="dashboard-quest-select" name="questId"><option value="">Choose a quest</option>${questCatalog(game).map(card=>`<option value="${card.id}" ${card.id===q?.id?'selected':''} ${game.events.some(e=>e.questId===card.id)?'disabled':''}>${escape(card.name)}</option>`).join('')}</select></label></div><form id="dashboard-quest">
 ${q?`${q.plot?'<p class="eyebrow">PLOT QUEST</p>':''}<div class="quest-reward-row"><label for="dashboard-printed">Printed VP reward<input id="dashboard-printed" name="printed" type="number" inputmode="numeric" min="0" max="10000" step="1" value="${escape(draft.printed)}"></label>${heroesGardenInPlay()?`<button type="button" data-action="quest-heroes" class="heroes-garden-toggle ${draft.heroes?'chosen':''}" aria-pressed="${!!draft.heroes}">Heroes’ Garden<br><small>+4 VP</small></button>`:''}</div>
 ${q.variable==='clerics'?`<label for="dashboard-variable">White cubes used toward the flexible requirement<input id="dashboard-variable" name="variable" type="number" inputmode="numeric" min="0" max="${q.max}" step="1" value="${escape(draft.variable)}"></label><p class="hint">Only this scoring detail is needed. Up to ${q.max} white cubes · +${q.rate} VP each.</p>`:q.variable==='buildings'?`<label for="dashboard-variable">Buildings controlled when completing this quest<input id="dashboard-variable" name="variable" type="number" inputmode="numeric" min="0" max="9" step="1" value="${escape(draft.variable)}"></label>`:q.variable==='payment'?`<button type="button" data-action="quest-payment" class="${draft.payment?'chosen':''}" aria-pressed="${draft.payment}">${draft.payment?'Optional payment included':'Include optional '+q.payment+' payment'} · +10 VP</button>`:''}
 
 <div id="quest-explanation" class="quest-explanation">${reward?questExplanation(reward):'<p class="hint">Enter valid whole numbers to preview this completion.</p>'}</div>${q.reminder?`<p class="rule-note">After completion: ${escape(q.reminder)}</p>`:''}
 <div class="record-actions quest-complete-actions"><details id="quest-faction-picker" class="record-faction-picker" style="--selected-player:${selected}"><summary class="record-faction-icon" style="--faction:${p.color}" aria-label="Change quest faction, currently ${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</summary><div class="record-faction-menu" role="group" aria-label="Choose quest faction">${game.players.map((f,i)=>`<button type="button" data-quest-player="${i}" style="--faction:${f.color}" aria-label="Player ${i+1}: ${escape(f.name)}" title="Player ${i+1}: ${escape(f.name)}" aria-pressed="${i===selected}">${icon(FACTIONS.find(x=>x.id===f.faction)?.icon)}</button>`).join('')}</div></details><button class="primary record-submit" type="submit">Complete quest</button></div>`:''}</form></section>
 
 <section class="dashboard-additional-points" aria-labelledby="additional-points-title">${dashboardInfoHeading('Additional points','additional-points','Named quest rewards and quest-type Plot bonuses are already included above. Enter other scoring benefits here, including Mandatory Quest rewards. Record points for the faction shown beside the pending total.')}${dashboardAdditionalPoints()}</section>
 </section>
 <div id="dashboard-buildings-panel" role="tabpanel" aria-labelledby="dashboard-buildings-tab" class="dashboard-tab-panel" ${tab==='buildings'?'':'hidden'}>${dashboardBuildingsPanel()}</div></div></section>`;
}
function recordDashboardQuest(player,id,inputs,refresh=true){
 if(game.events.some(e=>e.questId===id))throw Error('That quest has already been recorded.');
 const reward=questReward(game,player,id,inputs),eventId=crypto.randomUUID();
 game.events.push({id:eventId,player,source:'quest',questId:id,questInputs:inputs,questParts:reward.parts,points:reward.total,note:reward.quest.name+' · '+reward.parts.map(p=>p.label+' '+signed(p.points)+' VP').join(' · '),round:game.round});
 const owner=inputs.heroes?inputs.heroesOwner:null;
 if(owner!==null&&owner!==undefined&&owner!==player)game.events.push({id:crypto.randomUUID(),parentEventId:eventId,player:owner,source:'building',points:2,note:'Heroes’ Garden owner benefit · '+reward.quest.name,round:game.round});
 game.dashboard.draft={questId:'',printed:'',variable:'',payment:false,heroes:false};game.finished=false;game.players.forEach(p=>p.final.confirmed=false);
 if(refresh){save();render();say(reward.quest.name+' completed for '+game.players[player].name+' · '+reward.total+' VP.');}return eventId;
}
function questBuildingReward(id){return {q31:{count:1,source:'hall'},q32:{count:1,source:'stack'},q42:{count:3,source:'hall'},q96:{count:2,source:'hall'}}[id];}
function threatenBuildingsModal(){
 const pending=game.dashboard.pendingQuest,q=QUESTS.find(q=>q.id===pending.id),effect=questBuildingReward(pending.id),p=game.players[pending.player],controlled=ownedBuildings(game,pending.player).length,capacity=Math.max(0,9-controlled),slots=Math.min(effect.count,capacity),available=buildingCatalog(game).filter(b=>!game.dashboard.buildings[b.id]);
 return `<dialog id="threaten-buildings-modal" aria-labelledby="threaten-buildings-title"><h2 id="threaten-buildings-title">${escape(q.name)}</h2><p class="hint">${effect.source==='stack'?'Select the building you physically drew from the building stack':'Select the '+effect.count+' building'+(effect.count===1?'':'s')+' taken from Builder’s Hall'} for <strong style="color:${p.color}">${escape(p.name)}</strong>. These are gained, not purchased. Leave a slot blank if the building supply prevented taking the full reward.${pending.id==='q96'?' Refill Builder’s Hall after taking the first building, before choosing the second.':''}</p>${capacity<effect.count?`<p class="rule-note" role="status">${escape(p.name)} already controls ${controlled} buildings. A faction can control at most 9 buildings. ${capacity===0?`You cannot place ${effect.source==='stack'?'a building from the deck':'any additional buildings'} under your control. You can still complete the quest and receive its other rewards.`:`You can gain only ${slots} of the ${effect.count} buildings from this quest.`}</p>`:''}<form id="threaten-buildings">${Array.from({length:slots},(_,i)=>i+1).map(i=>`<label for="threaten-building-${i}">Building ${i}<select id="threaten-building-${i}" name="building${i}" ${i>capacity?'disabled':''}><option value="">Choose a building</option>${available.map(b=>`<option value="${b.id}">${escape(b.name)}</option>`).join('')}</select></label>`).join('')}${effect.source==='hall'?'<p class="hint">Record any collected VP gems separately in Additional points.</p>':''}<p id="threaten-error" class="loss" role="alert"></p><div class="nav-actions">${button('cancel-threaten','Back to quest','quiet')}<button type="submit" class="primary">${slots?'Complete quest and put buildings in play':'Complete quest'}</button></div></form></dialog>`;
}
function buildingDraft(){const draft=game.dashboard.buildingDraft||={id:'',action:'purchase',gems:0};draft.gems??=0;return draft;}
function buildingOwnerPicker(b){
 const ownerIndex=game.dashboard.buildings[b.id].owner,p=game.players[ownerIndex];
 return `<details id="owner-picker-${b.id}" class="record-faction-picker building-owner-picker" style="--selected-player:${ownerIndex}"><summary class="record-faction-icon" style="--faction:${p.color}" aria-label="Change owner of ${escape(b.name)}, currently ${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</summary><div class="record-faction-menu" role="group" aria-label="Choose owner of ${escape(b.name)}">${game.players.map((f,i)=>`<button type="button" data-building-owner="${b.id}" data-owner-player="${i}" style="--faction:${f.color}" aria-label="Player ${i+1}: ${escape(f.name)}" title="Player ${i+1}: ${escape(f.name)}" aria-pressed="${i===ownerIndex}">${icon(FACTIONS.find(x=>x.id===f.faction)?.icon)}</button>`).join('')}</div></details>`;
}
function dashboardBuildingsPanel(){
 const draft=buildingDraft(),p=game.players[selected],gems=count(draft.gems),bonus=draft.action==='purchase'&&completedQuests(game,selected).some(e=>e.questId==='q29'),atLimit=ownedBuildings(game,selected).length>=9,defame=draft.action==='purchase'&&completedQuests(game,selected).some(e=>e.questId==='q43'),catalog=buildingCatalog(game),available=catalog.filter(b=>!game.dashboard.buildings[b.id]),inPlay=catalog.filter(b=>game.dashboard.buildings[b.id]?.owner!==null&&game.dashboard.buildings[b.id]?.owner!==undefined);
 return `<section class="dashboard-buildings dashboard-workspace-content">
 ${atLimit?'<p class="rule-note">This faction already controls 9 buildings and cannot purchase or gain another building.</p>':''}<form id="dashboard-building"><label for="dashboard-building-select"><span class="sr-only">Building name</span><select id="dashboard-building-select" name="buildingId" ${atLimit?'disabled':''}><option value="">Choose a building</option>${available.map(b=>`<option value="${b.id}" ${draft.id===b.id?'selected':''}>${escape(b.name)} · ${moduleLabel(b.module)}</option>`).join('')}</select></label><div class="building-acquisition-row"><div class="building-acquisition-toggle" role="group" aria-label="How this building entered play">${[['purchase','Purchased'],['gain','Gained']].map(([action,label])=>`<button type="button" data-building-acquisition="${action}" class="${draft.action===action?'chosen':''}" aria-pressed="${draft.action===action}">${label}</button>`).join('')}</div><div class="building-gem-stepper" role="group" aria-label="VP gems collected"><button type="button" data-building-gem-step="-1" aria-label="Subtract one VP gem" ${gems===0?'disabled':''}>−1</button>${icon('gem')}<button type="button" data-building-gem-step="1" aria-label="Add one VP gem">+1</button></div></div>${bonus?`<div class="quest-explanation building-purchase-bonus" role="status"><h4>Scoring explanation</h4><ul><li><span>VP gems</span><strong>${signed(gems)} VP</strong></li>${bonus?'<li><span>Infiltrate Builder’s Hall</span><strong>+4 VP</strong></li>':''}</ul><p class="quest-faction-total"><strong style="color:${p.color}">${escape(p.name)}: ${signed(gems+(bonus?4:0))} VP</strong></p></div>`: ''}<div class="record-actions dashboard-manual-actions building-entry-actions"><details id="building-entry-faction-picker" class="record-faction-picker" style="--selected-player:${selected}"><summary class="record-faction-icon" style="--faction:${p.color}" aria-label="Change building faction, currently ${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</summary><div class="record-faction-menu" role="group" aria-label="Choose building faction">${game.players.map((f,i)=>`<button type="button" data-building-entry-player="${i}" style="--faction:${f.color}" aria-label="Player ${i+1}: ${escape(f.name)}" title="Player ${i+1}: ${escape(f.name)}" aria-pressed="${i===selected}">${icon(FACTIONS.find(x=>x.id===f.faction)?.icon)}</button>`).join('')}</div></details><output id="building-pending-points" class="pending-points" aria-live="polite" aria-label="Points awarded with this building">${signed(gems+(bonus?4:0))} <span>VP</span></output><button class="primary record-submit" type="submit" ${available.length&&!atLimit?'':'disabled'}>Put building in play</button></div>${defame?`<div class="quest-explanation building-defame-reminder" role="status"><h4>Defame Rival Business</h4><p><strong style="color:${p.color}">${escape(p.name)}</strong>: When purchasing a building, you may move 1 skull from your Tavern to any action space.</p></div>`:''}</form>
 <details class="buildings-in-play"><summary>Buildings in play</summary>${inPlay.map(b=>`<div class="owned-building">${buildingOwnerPicker(b)}<div class="owned-building-info"><strong>${escape(b.name)}</strong><span>${moduleLabel(b.module)}</span>${b.upkeep?`<small>Round upkeep: ${escape(b.upkeep)}</small>`:''}</div><button type="button" class="destroy-building" data-destroy-building="${b.id}" aria-label="Destroy ${escape(b.name)}" title="Destroy building">×</button></div>`).join('')||'<p class="hint">No buildings recorded yet.</p>'}</details>
 </section>`;
}
function updateBuildingOwnership(id,action,owner,gemPoints=0){
 const gems=count(gemPoints);if(gems&&!(['purchase','gain'].includes(action)))throw Error('VP gems only apply when putting a building in play.');
 const activityAfterId=game.events.at(-1)?.id||null;
 const before=game.dashboard.buildings[id]?.owner,bonus=action==='purchase'&&completedQuests(game,owner).some(e=>e.questId==='q29'),b=changeBuilding(game,id,action,owner);
 game.dashboard.history.at(-1).activityAfterId=activityAfterId;
 if(bonus){const eventId=crypto.randomUUID();game.dashboard.history.at(-1).logEventId=eventId;game.events.push({id:eventId,player:owner,source:'building',buildingId:id,purchaseBonusId:'q29',points:4,note:'Infiltrate Builder’s Hall · '+b.name,round:game.round});}
 if(gems){const h=game.dashboard.history.at(-1),root=h.logEventId,eventId=crypto.randomUUID();game.events.push({id:eventId,...(root?{parentEventId:root}:{}),player:owner,source:'gems',buildingId:id,points:gems,note:'VP gems · '+b.name,round:game.round});if(!root)h.logEventId=eventId;}
 if(action==='destroy'){const eventId=crypto.randomUUID();game.dashboard.history.at(-1).logEventId=eventId;game.events.push({id:eventId,player:before,source:'buildingDestroyed',points:0,note:b.name+' destroyed',round:game.round});}
 if(action==='purchase'&&b.upkeep)game.dashboard.pendingBuildingSetup=id;
 game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say(b.name+(action==='destroy'?' removed from play.':' ownership updated.'+(bonus||gems?' '+signed(gems+(bonus?4:0))+' VP for '+game.players[owner].name+'.':'')));
}

function questExplanation(reward){const p=game.players[selected],owner=heroesGardenInPlay()&&reward.parts.some(p=>p.label==='Immediate completion at Heroes’ Garden')?game.dashboard.buildings[BUILDINGS.find(b=>b.name==="Heroes' Garden").id].owner:null;return `<h4>Scoring explanation</h4><ul>${reward.parts.map(p=>`<li><span>${escape(p.label)}</span><strong>${signed(p.points)} VP</strong></li>`).join('')}</ul><p class="quest-faction-total"><strong style="color:${p.color}">${escape(p.name)}: ${reward.total} VP</strong></p>${owner!==null&&owner!==selected?`<ul class="quest-secondary-bonuses"><li class="quest-owner-benefit"><span style="color:${game.players[owner].color}">${escape(game.players[owner].name)} · Heroes’ Garden owner</span><strong>+2 VP</strong></li></ul>`:''}`;}
function buildingSetupModal(){
 const b=BUILDINGS.find(b=>b.id===game.dashboard.pendingBuildingSetup);
 return `<dialog id="building-setup-modal" aria-labelledby="building-setup-title"><p class="eyebrow">BUILDING SETUP</p><h2 id="building-setup-title">${escape(b.name)}</h2><p class="rule-note">${escape(b.upkeep)} Place these on the building’s action space now.</p><p class="hint">Perform this on the board. This reminder does not change scores or track resources.</p>${button('close-building-setup','Done','primary')}<div class="game-reset-footer">${button('new','Game Reset','quiet')}</div></dialog>`;
}
function upkeepModal(){
 const round=game.upkeepRound,items=upkeepItems(game,round);
 return `<dialog id="upkeep-modal" aria-labelledby="upkeep-title"><p class="eyebrow">ROUND ${round} OF 8</p><h2 id="upkeep-title">Game Upkeep</h2><ul>${items.general.map(t=>`<li>${escape(t)}</li>`).join('')}</ul><h3>Player reminders</h3>${items.players.filter(p=>p.reminders.length).map(row=>{const p=game.players[row.player];return `<section class="upkeep-player"><h3 style="color:${p.color}">${escape(p.name)}</h3><ul>${row.reminders.map(r=>`<li><strong>${escape(r.name)}</strong><br>${escape(r.text)}</li>`).join('')}</ul></section>`}).join('')||'<p class="hint">No active Plot Quest or building reminders yet.</p>'}<p class="hint">Perform these actions on the board. This reminder does not change resources or scores.</p>${button('close-upkeep','Ready for the round','primary')}<div class="game-reset-footer">${button('new','Game Reset','quiet')}</div></dialog>`;
}
function seedDashboardLord(f,index=finishIndex){if(game.dashboardMode&&!f.manualLordCount)f.counts=trackedLordCounts(game,index,f.lord,f.dashboardChoice);}
function removeScoringEvents(ids){
 ids=[...new Set([...ids,...game.events.filter(e=>e.parentEventId&&ids.includes(e.parentEventId)).map(e=>e.id)])];
 const removed=game.events.filter(e=>ids.includes(e.id));
 const next={...game,events:game.events.filter(e=>!ids.includes(e.id)).map(e=>({...e}))};
 if(game.dashboardMode){
 next.dashboard={...game.dashboard,buildings:{...game.dashboard.buildings},history:[...game.dashboard.history]};
 try{for(const h of [...next.dashboard.history].reverse().filter(h=>ids.includes(h.logEventId)||ids.includes(h.parentEventId))){
 const index=next.dashboard.history.indexOf(h);
 if(next.dashboard.history.slice(index+1).some(later=>later.id===h.id))throw Error('Undo later ownership changes for '+BUILDINGS.find(b=>b.id===h.id).name+' first.');
 if(h.before?.owner!==null&&h.before?.owner!==undefined&&ownedBuildings(next,h.before.owner).length>=9&&next.dashboard.buildings[h.id]?.owner!==h.before.owner)throw Error('Cannot restore ownership: that faction already controls 9 buildings.');
 if(h.before)next.dashboard.buildings[h.id]={...h.before};else delete next.dashboard.buildings[h.id];next.dashboard.history.splice(index,1);
 }}catch(error){say(error.message);return false;}
 }
 const changes=game.dashboardMode?recalculateQuestEvents(next):[];
 if(changes.length&&!confirm('Undoing this completion also changes later quest bonuses:\n'+changes.map(c=>{const e=game.events.find(e=>e.id===c.id);return (QUESTS.find(q=>q.id===e.questId)?.name||BUILDINGS.find(b=>b.id===e.buildingId)?.name||'Entry')+': '+c.before+' → '+c.after+' VP';}).join('\n')+'\nApply these corrections?'))return false;
 game.events=next.events;if(game.dashboardMode)game.dashboard=next.dashboard;game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say(removed.some(e=>e.questId)?'Quest completion undone; later bonuses recalculated.':'Entry removed.');return true;
}

function activityEntries(){
 const entries=[...game.events];if(!game.dashboardMode)return entries;
 for(let i=game.dashboard.history.length-1;i>=0;i--){const h=game.dashboard.history[i];if(!['purchase','gain'].includes(h.action))continue;
 const row={historyIndex:i,player:h.owner,source:'buildingAdded',points:null,round:h.round,note:BUILDINGS.find(b=>b.id===h.id).name+' · '+(h.action==='purchase'?'Purchased':'Gained')};
 const bonusIndex=h.logEventId?entries.findIndex(e=>e.id===h.logEventId):-1;
 const anchor=h.parentEventId||h.activityAfterId,index=anchor?entries.findIndex(e=>e.id===anchor):-1;
 entries.splice(bonusIndex>=0?bonusIndex:index+1,0,row);
 }return entries;
}
function undoBuildingAddition(index){
 const h=game.dashboard.history[index];if(!h||!['purchase','gain'].includes(h.action))return;
 if(game.dashboard.history.slice(index+1).some(later=>later.id===h.id)){say('Undo later ownership changes for '+BUILDINGS.find(b=>b.id===h.id).name+' first.');return;}
 if(h.logEventId){removeScoringEvents([h.logEventId]);return;}
 if(h.before)game.dashboard.buildings[h.id]={...h.before};else delete game.dashboard.buildings[h.id];game.dashboard.history.splice(index,1);game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say('Building addition undone.');
}
function live() {
  const p=game.players[selected],entries=activityEntries();
  return `${game.dashboardMode?'':`<div class="toolbar"><div>${button('end','End-game scoring','primary small')}</div><p class="eyebrow">THE COUNCIL</p></div>`}
  ${scoreboard()}${game.dashboardMode?dashboardPanel():''}<div class="live-sections">${game.dashboardMode?'':simplePointsPanel()}
  ${game.dashboardMode?'':`<details class="panel optional-panel" id="round-tracking" ${roundsOpen?'open':''}><summary>Round tracking <span class="optional">optional</span></summary><div class="optional-content">
  ${game.trackRounds?`<p class="eyebrow">ROUND ${game.round} OF 8</p><div class="round-actions">${button('previous-round','Previous round','quiet')}${button('round','Next round','quiet')}${button('disable-rounds','Turn off tracking','quiet')}</div><p class="hint">New scoring entries include the current round. Advance it when your table is ready.</p>`:`<p class="hint">Score without tracking rounds, or turn this on to include the current round in new activity entries.</p>${button('enable-rounds','Enable round tracking','quiet')}`}
  </div></details>`}
  <details class="panel history optional-panel" id="activity-log" ${historyOpen?'open':''}><summary>Activity log <span class="optional">${entries.length} ${entries.length===1?'entry':'entries'}</span></summary><div class="optional-content"><div class="section-title"><p class="hint">All factions · latest first</p>${button('undo','Undo latest','quiet')}</div>
  ${entries.length?`<ol class="ledger">${[...entries].reverse().map(e=>`<li><div><b>${escape(game.players[e.player].name)}</b><span>${escape(sourceInfo[e.source]?.[0] || (e.source==='buildingAdded'?'Building added':e.source==='buildingDestroyed'?'Building destroyed':e.source==='emptyTrack'?'Gain skull when skull track is empty':'Other'))}${e.round?' · Round '+e.round:''}</span>${e.note?`<small>${escape(e.note)}</small>`:''}</div><strong class="${e.points<0?'loss':''}">${e.points===null||e.source==='buildingDestroyed'?'—':signed(e.points)}</strong><button type="button" class="remove" ${e.historyIndex!==undefined?`data-undo-building-history="${e.historyIndex}"`:`data-delete="${e.id}"`} aria-label="${e.historyIndex!==undefined||e.source==='buildingDestroyed'?'Undo '+escape(e.note):'Remove '+escape(game.players[e.player].name)+' '+e.points+' point entry'}">${e.historyIndex!==undefined||e.source==='buildingDestroyed'?'Undo':'×'}</button></li>`).join('')}</ol>`:'<div class="empty"><span aria-hidden="true">◇</span><h3>A fresh ledger</h3><p>Choose a faction, then record their first points.</p></div>'}</div></details></div>
  <div class="bottom-actions live-bottom-actions"><span class="hint">Saved in this browser</span>${button('end','End-game scoring','primary')}</div>`;
}
function lordFields(f) {
  seedDashboardLord(f);
  const l=LORDS.find(l=>l.id===f.lord); if(!l)return `<p class="hint">${f.selectionMode==='types'?'Pick two Lord Quest Types to see their bonus inputs.':'Choose two Quest types, another bonus, or a Lord by name to see the bonus inputs.'}</p>`;
  const n=(key,label)=>bonusInput('count:'+key,label,f.counts[key]??0,l.rate);
  if(l.kind==='pair'){
    const types=selectedQuestTypes(f).length===2?selectedQuestTypes(f):l.types;
    return `<p class="hint">Count your completed ${types.join(' and ')} Quests together. Include Plot Quests; exclude Mandatory Quests.</p>${bonusInput('count:pairTotal',`Total ${types.join(' and ')} Quests completed`,f.counts.pairTotal??l.types.reduce((sum,type)=>sum+count(f.counts[type]??0),0),4)}`;
  }
  if(l.kind==='builder')return `<p class="hint">6 VP per building you control at the end of the game.</p>${bonusInput('count:qualifying','Buildings controlled (maximum 9)',f.counts.qualifying??0,l.rate,9)}`;
  if(l.kind==='module'){
    const moduleName=l.module==='skullport'?'Skullport':'Undermountain';
    return `<p class="hint">Count completed quests and controlled buildings bearing the ${moduleName} set symbol together. Exclude Mandatory Quests.</p>${bonusInput('count:moduleTotal',`${moduleName} quests completed and buildings controlled`,f.counts.moduleTotal??(count(f.counts.quests??0)+count(f.counts.buildings??0)),4)}`;
  }
  if(l.kind==='corruption')return `<p class="rule-note">Each skull in your Tavern earns 4 bonus VP. ${game.penalty===0?'All skulls are on the track, so your skull count and bonus are zero.':'The normal −'+game.penalty+' VP penalty per skull still applies.'}</p><div class="bonus-input"><div><p>Skulls in your Tavern</p><span class="multiplier">× 4 VP each</span><p class="hint">Carried over from the previous screen.</p></div><output class="carried-count" aria-label="Skulls carried over from your Tavern">${count(f.corruption)}</output></div>`;
  if(l.kind==='choice')return `${game.dashboardMode?`<p class="hint">Choose the type to use your tracked quest count.</p><div class="bonus-pills">${QUEST_TYPES.map(type=>`<button type="button" data-dashboard-choice="${type}" class="bonus-pill quest-type-pill" aria-pressed="${f.dashboardChoice===type}" style="--quest-bg:${QUEST_COLORS[type].background};--quest-ink:${QUEST_COLORS[type].ink};--quest-border:${QUEST_COLORS[type].border}">${type}</button>`).join('')}</div>`:''}<p class="hint">Choose one Quest type. Each completed Quest of that type earns 6 VP. Include Plot Quests; exclude Mandatory Quests.</p>${n('qualifying','Completed Quests of your chosen type')}`;
  if(l.kind==='large')return `<p class="hint">5 VP for each completed Quest with a printed reward of 10 VP or more. Additional Plot Quest effects do not raise the printed reward.</p>${n('qualifying','Quests with a reward of 10+ VP')}`;
  return `<p class="hint">3 VP per completed non-Mandatory Quest, including Plot Quests.</p>${n('qualifying','Non-Mandatory Quests completed')}`;
}
function bonusInput(name,label,value,rate,max=10000) {
  const manual=game.players[finishIndex].final.manualLordCount;
  if(game.dashboardMode&&!manual)return `<div class="bonus-input"><div><p>${escape(label)}</p><span class="multiplier">× ${rate} VP each</span></div><output class="carried-count" aria-label="${escape(label)}">${count(value)}</output></div><button type="button" class="lord-override-button" data-action="toggle-lord-override">Manual override</button>`;
  return `<div class="bonus-input"><div><label for="bonus-${name}">${label}</label><span class="multiplier">× ${rate} VP each</span></div><input id="bonus-${name}" name="${name}" type="number" inputmode="numeric" min="0" max="${max}" step="1" value="${escape(value?Math.min(value,max):'')}" ></div>${game.dashboardMode?'<button type="button" class="quiet lord-auto-button" data-action="toggle-lord-override">Use tracked total</button>':''}`;
}
function bonusLabel(l) {
  if(l.kind==='pair')return l.types.join(' + ');
  return {builder:'Buildings · ×6',all:'All Quests · ×3',large:'10+ VP Quests · ×5',choice:'One Quest type · ×6',corruption:'Skulls · ×4',module:l.module==='skullport'?'Skullport Quests + buildings · ×4':'Undermountain Quests + buildings · ×4'}[l.kind];
}
function selectedQuestTypes(f) {
  const lord=LORDS.find(l=>l.id===f.lord);
  if(f.selectionMode==='types')return f.questTypes||[];
  // Keep previously saved pair-pill selections selected in the new picker.
  if(f.selectionMode==='pill'&&lord?.kind==='pair')return lord.types;
  return [];
}
function lordClaimed(id) {return game.players.some((p,i)=>i!==finishIndex&&p.final.confirmed&&p.final.lord===id);}
function questTypeBlocked(type,f) {
  const selected=selectedQuestTypes(f);
  if(selected.includes(type))return false;
  const candidates=availableLords(game).filter(l=>l.kind==='pair'&&l.types.includes(type)&&selected.every(t=>l.types.includes(t)));
  return candidates.length===0||candidates.every(l=>lordClaimed(l.id));
}
function finalPreview(i) {try{if(!isLordAvailable(game.players[i].final.lord,game))return null;return finalScore(liveScore(i,game.events),game.players[i].final,game.skullport?game.penalty:0);}catch{return null;}}
function lordPreviewMarkup() {
  if(game.expert&&!game.players[finishIndex].final.confirmed)return '<p class="hint">Expert Mode · Score revealed when you continue.</p>';
  const score=finalPreview(finishIndex);
  return score?`<dl class="breakdown lord-score-preview"><div><dt>Lord bonus</dt><dd>${signed(score.lord)}</dd></div><div class="total"><dt>Total</dt><dd>${score.total}</dd></div></dl>`:'<p class="hint">Choose a bonus or Lord to preview the final score.</p>';
}
function breakdown(s) {return `<dl class="breakdown">${[['During play',s.live],['Leftover adventurers',s.adventurers],['Leftover gold',s.gold],['Lord bonus',s.lord],['Corruption penalty',s.corruption]].map(([k,v])=>`<div><dt>${k}</dt><dd>${signed(v)}</dd></div>`).join('')}<div class="total"><dt>Final score</dt><dd>${s.total}</dd></div></dl>`;}
function beforeLordScore(i) {
  const f=game.players[i].final;
  return liveScore(i,game.events)+count(f.adventurers)+Math.floor(count(f.gold)/2)-(game.skullport?count(f.corruption)*game.penalty:0);
}
function allResources() {
  return `<section class="final-resources-heading"><h2>Final Resources</h2></section>
  <form id="resources"><div class="resource-grid">${game.players.map((p,i)=>`<section class="panel resource-player-card" aria-label="${escape(p.name)} final resources"><div class="resource-player-title" style="--faction:${p.color}" role="img" aria-label="Player ${i+1}: ${escape(p.name)}" title="${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</div>
  ${resourceInput('player:'+i+':adventurers','Adventurers',p.final.adventurers,'1 VP / Cube')}
  ${resourceInput('player:'+i+':gold','Coins',p.final.gold,'1 VP / 2 Coins')}
  ${game.skullport?(game.penalty===0?'':resourceInput('player:'+i+':corruption','Skulls',p.final.corruption,`−${game.penalty} VP / Skull`)):''}
  <div class="resource-subtotal" aria-label="Score before Lord bonus"><strong id="resource-total-${i}">${game.expert?'???':beforeLordScore(i)}</strong></div></section>`).join('')}</div>
  <div class="nav-actions"><button class="primary" type="submit">Reveal Lords →</button></div></form>`;
}
function readResources(form) {
  const data=new FormData(form);
  const finals=game.players.map((p,i)=>{
    const f={...p.final};
    for(const key of ['adventurers','gold',...(game.skullport&&game.penalty>0?['corruption']:[])])f[key]=count(data.get('player:'+i+':'+key)??'');
    if(!game.skullport||game.penalty===0)f.corruption=0;
    return f;
  });
  finals.forEach((f,i)=>game.players[i].final=f);game.finished=false;save();
}
function finish() {
  if(finishStep==='resources')return allResources();
  const p=game.players[finishIndex], f=p.final,nextPlayer=game.players[finishOrder[finishPosition+1]];
  const available=availableLords(game);
  const mode=f.selectionMode||'name';
  const questTypes=selectedQuestTypes(f);
  const pill=l=>`<button type="button" data-bonus="${l.id}" ${lordClaimed(l.id)?'disabled':''} class="bonus-pill ${mode==='pill'&&f.lord===l.id?'chosen':''}" aria-pressed="${mode==='pill'&&f.lord===l.id}">${escape(bonusLabel(l))}</button>`;
  const specialRows=[
    ['larissa',...(game.skullport?['irusyl']:[])],
    ...(game.skullport?[['sangalor','xanathar']]:[]),
    ...(game.undermountain?[['trobriand','danilo'],['halaster']]:[])
  ];
  const body=`
    <div class="lord-reveal-heading"><span class="lord-reveal-faction" style="color:${p.color}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}<strong>${escape(p.name)}</strong></span><h2>Reveal Lord</h2></div>
    <form id="final"><input type="hidden" name="lord" value="${escape(f.lord)}"><div class="lord-selection-columns"><section class="lord-quest-column"><div class="lord-choice-heading"><h3>Quest types <span class="optional">· Pick 2</span></h3></div><p class="sr-only" id="quest-type-help">Pick two quest types. Each completed Quest of either type earns 4 VP.</p><div class="bonus-pills" role="group" aria-label="Lord Quest Types, pick two" aria-describedby="quest-type-help">${QUEST_TYPES.map(type=>{const color=QUEST_COLORS[type];return `<button type="button" data-quest-type="${type}" ${questTypeBlocked(type,f)?'disabled':''} class="bonus-pill quest-type-pill" aria-pressed="${questTypes.includes(type)}" style="--quest-bg:${color.background};--quest-ink:${color.ink};--quest-border:${color.border}">${type}</button>`;}).join('')}</div>
    </section><section class="lord-other-column"><h3>Other bonuses</h3><div class="other-bonus-rows" role="group" aria-label="Other Lord bonuses">${specialRows.map(row=>`<div class="special-bonus-row">${row.map(id=>available.find(l=>l.id===id)).filter(Boolean).map(pill).join('')}</div>`).join('')}</div></section></div>
    <details id="lord-names" ${lordNamesOpen?'open':''}><summary>Lords by name</summary><div class="lord-cards" role="group" aria-label="Choose your Lord by name">${available.map(l=>`<button type="button" data-lord="${l.id}" ${lordClaimed(l.id)?'disabled':''} class="lord-card ${mode==='name'&&f.lord===l.id?'chosen':''}" aria-pressed="${mode==='name'&&f.lord===l.id}"><strong>${escape(l.name)}</strong><span>${escape(bonusLabel(l))}</span></button>`).join('')}</div></details>
    <div id="lord-fields">${lordFields(f)}</div>
    <div id="preview" aria-live="polite">${lordPreviewMarkup()}</div>
    <div class="nav-actions lord-reveal-actions ${nextPlayer?'has-next-faction':''}">${button('resources','Edit resources','edit-resources-button')}${nextPlayer?`<span class="next-faction-icon" style="--faction:${nextPlayer.color}" role="img" aria-label="Next faction: ${escape(nextPlayer.name)}" title="${escape(nextPlayer.name)}">${icon(FACTIONS.find(f=>f.id===nextPlayer.faction)?.icon)}</span>`:''}<button class="primary" type="submit">${nextPlayer?'Reveal Lord →':'Show final results'}</button></div></form>`;
  return `<section class="final-resources-heading"><h2>Final Scoring</h2></section>${standings()}<section class="panel final-panel">${body}</section>`;
}
function standings() {
  if(game.expert){
    const revealed=game.players.map((p,index)=>({p,index})).filter(r=>r.p.final.confirmed).map(r=>({...r,score:finalPreview(r.index).total})).sort((a,b)=>b.score-a.score||a.index-b.index);
    const pending=finishOrder.filter(i=>!game.players[i].final.confirmed);
    return `<section class="standings"><div class="section-title"><h3>Revealed standings</h3><span class="hint">Only revealed scores are ranked</span></div>
    ${revealed.length?`<ol aria-label="Revealed standings">${revealed.map(r=>`<li style="--faction:${r.p.color}"><span class="standing-rank">${revealed.findIndex(x=>x.score===r.score)+1}</span><span class="standing-name">${escape(r.p.name)}<small>Final score</small></span><strong>${r.score}</strong></li>`).join('')}</ol>`:'<p class="hint">Standings appear as each Lord is revealed.</p>'}
    ${pending.length?`<p class="eyebrow pending-reveal-heading">Awaiting Lord reveal</p><ul class="pending-reveals" aria-label="Factions awaiting reveal">${pending.map(i=>{const p=game.players[i];return `<li class="${i===finishIndex?'scoring-now':''}" style="--faction:${p.color}"><span class="standing-name">${escape(p.name)}<small>${i===finishIndex?'Revealing now':'Awaiting reveal'}</small></span><strong aria-label="Score hidden">???</strong></li>`;}).join('')}</ul>`:''}
    <p class="hint">Unrevealed factions stay in reveal order and are not compared with revealed scores.</p></section>`;
  }
  const rows=game.players.map((p,i)=>({p,index:i,score:p.final.confirmed?finalPreview(i).total:beforeLordScore(i)})).sort((a,b)=>b.score-a.score);
  return `<section class="standings"><div class="section-title"><h3>Current standings</h3><span class="hint">Scoring from last to first</span></div><ol>${rows.map((r,i)=>`<li class="${r.index===finishIndex?'scoring-now':''}" style="--faction:${r.p.color}"><span class="standing-rank">${rows.findIndex(x=>x.score===r.score)+1}</span><span class="standing-name">${escape(r.p.name)}<small>${r.p.final.confirmed?'Final score':r.index===finishIndex?'Revealing now · before Lord bonus':'Before Lord bonus'}</small></span><strong>${game.expert&&!r.p.final.confirmed?'???':r.score}</strong></li>`).join('')}</ol><p class="hint">Totals update after each Lord is revealed and confirmed. Ties reveal in player-number order.</p></section>`;
}
function beginFinalScoring() {
  if(game.skullport&&game.penalty===0)game.players.forEach(p=>p.final.corruption=0);
  finishOrder=finalScoringOrder(game.players.map((p,i)=>liveScore(i,game.events)));
  finishPosition=0;finishIndex=finishOrder[0];finishStep='resources';lordNamesOpen=false;
  game.players.forEach(p=>p.final.confirmed=false);game.finished=false;view='final';save();render();window.scrollTo(0,0);
}
function trackModal() {
  return `<dialog id="skull-track-modal" aria-labelledby="track-title"><p class="eyebrow">BEFORE THE FINAL REVEAL</p><h2 id="track-title">Where is the skull track?</h2><p class="hint">Choose the current penalty per skull from the physical track. This applies to every faction.</p><button type="button" data-track-penalty="0" class="full-track-option ${pendingPenalty===0?'chosen':''}" aria-pressed="${pendingPenalty===0}">0 VP, All skulls on corruption track</button><div class="track-values" role="group" aria-label="Skull track penalty">${Array.from({length:9},(_,i)=>i+1).map(n=>`<button type="button" data-track-penalty="${n}" class="${pendingPenalty===n?'chosen':''}" aria-pressed="${pendingPenalty===n}">−${n} VP</button>`).join('')}</div><p class="hint">Use the farthest empty space from −1 on the track.</p><div class="nav-actions">${button('cancel-track',view==='direct'?'Back to scores':'Back to play','quiet')}<button type="button" data-action="confirm-track" class="primary" ${pendingPenalty===null?'disabled':''}>Continue →</button></div><div class="game-reset-footer">${button('new','Game Reset','quiet')}</div></dialog>`;
}
function results() {
  const rows=rankPlayers(game.players.map((p,i)=>({name:p.name,index:i,gold:count(p.final.gold),score:finalPreview(i)})));
  const winners=rows.filter(r=>r.rank===1);
  const goldBreaksTie=r=>rows.some(other=>other.index!==r.index&&other.score.total===r.score.total&&other.gold!==r.gold);
  const factionHeading=r=>{const p=game.players[r.index];return `<span class="result-faction-name" style="color:${p.color}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}<span>${escape(r.name)}</span></span>`;};
  return `<section class="welcome results-intro"><h2 class="winner-heading" ${winners.length===1?`style="color:${game.players[winners[0].index].color}"`:''}>${winners.map(factionHeading).join(' &amp; ')} ${winners.length>1?'share the victory':'wins'}</h2></section>
  <div class="result-grid">${rows.map(r=>`<section class="panel result"><div class="section-title"><div><p class="eyebrow">${r.rank+({1:'st',2:'nd',3:'rd'}[r.rank]||'th')+' Place'}</p><h2>${factionHeading(r)}</h2></div><strong class="final-total">${r.score.total}</strong></div><p class="lord-name">${escape(LORDS.find(l=>l.id===game.players[r.index].final.lord).name)}</p>${breakdown(r.score)}${goldBreaksTie(r)?`<p class="hint">${r.gold} Gold remaining · Gold breaks the points tie</p>`:''}</section>`).join('')}</div>
  <div class="victory-bottom-actions">${button('edit-final','Edit Final Scoring','quiet')}${button('new','Reset Game','quiet')}</div>`;
}
function render() {
  if(game?.dashboard?.pendingBuildingSetup&&game.dashboard.buildings[game.dashboard.pendingBuildingSetup]?.owner==null)delete game.dashboard.pendingBuildingSetup;
  document.querySelector('header').hidden=(view==='live'&&!!game?.dashboardMode)||view==='final'||view==='results';
  const enteringLive=view==='live'&&lastRenderedView!=='live';
  lastRenderedView=view;
  app.innerHTML=(view==='setup'?setup():view==='direct'?directSetup():view==='live'?live():view==='final'?finish():results())+(view==='results'?'':`<div class="game-reset-footer">${button('new','Game Reset','quiet')}</div>`)+(penaltyModal?trackModal():'')+(view==='live'&&game?.dashboardMode&&game.upkeepRound?upkeepModal():'')+(view==='live'&&game?.dashboardMode&&game.dashboard.pendingQuest?threatenBuildingsModal():'')+(view==='live'&&game?.dashboardMode&&game.dashboard.pendingBuildingSetup?buildingSetupModal():'');
  if(enteringLive)window.scrollTo(0,0);
  if(view==='live'&&game?.dashboardMode&&game.upkeepRound){const dialog=app.querySelector('#upkeep-modal');dialog.showModal();dialog.addEventListener('cancel',()=>{delete game.upkeepRound;save();});}
  if(view==='live'&&game?.dashboardMode&&game.dashboard.pendingQuest){const dialog=app.querySelector('#threaten-buildings-modal');dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();delete game.dashboard.pendingQuest;save();render();});}
  if(view==='live'&&game?.dashboardMode&&game.dashboard.pendingBuildingSetup){const dialog=app.querySelector('#building-setup-modal');dialog.showModal();dialog.addEventListener('cancel',()=>{delete game.dashboard.pendingBuildingSetup;save();});}
  if(penaltyModal){const dialog=app.querySelector('#skull-track-modal');dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();penaltyModal=false;pendingPenalty=null;render();app.querySelector(view==='direct'?'[data-action="quick-track"]':'[data-action="end"]').focus();});}
}
app.addEventListener('toggle',e=>{
  if(e.target.id==='setup-guide')setupGuideOpen=e.target.open;
  if(e.target.id==='activity-log')historyOpen=e.target.open;
  if(e.target.id==='round-tracking')roundsOpen=e.target.open;
  if(e.target.id==='lord-names')lordNamesOpen=e.target.open;
},true);
function readFinal(form) {
  const current=game.players[finishIndex].final, f={...current,counts:{...current.counts}}, data=new FormData(form);
  if(data.has('lord')){f.lord=data.get('lord');if(f.lord!==current.lord)f.manualLordCount=false;}
  if(f.lord&&!isLordAvailable(f.lord,game))throw new Error('This Lord requires an expansion that was not selected for this game.');
  for(const key of ['adventurers','gold','corruption'])if(data.has(key))f[key]=count(data.get(key));
  for(const [key,value] of data)if((!game.dashboardMode||f.manualLordCount)&&key.startsWith('count:'))f.counts[key.slice(6)]=count(value);
  seedDashboardLord(f);
  if(f.lord==='larissa'&&f.counts.qualifying!==undefined)f.counts.qualifying=Math.min(f.counts.qualifying,9);
  f.confirmed=false;game.players[finishIndex].final=f;game.finished=false;save();
}
app.addEventListener('change',e=>{
  try {
    const buildingForm=e.target.closest('#dashboard-building');if(buildingForm){buildingDraft().id=e.target.value;save();return;}
    const questForm=e.target.closest('#dashboard-quest')||(e.target.id==='dashboard-quest-select'?app.querySelector('#dashboard-quest'):null);
    if(questForm){
      const draft=dashboardDraft();
      if(e.target.name==='questId'){const q=questCatalog(game).find(q=>q.id===e.target.value);Object.assign(draft,{questId:q?.id||'',printed:q?String(q.vp):'',variable:q?.variable==='buildings'?String(ownedBuildings(game,selected).length):'',payment:false,heroes:false});save();render();app.querySelector('#dashboard-quest-select').focus({preventScroll:true});}
      else {const data=new FormData(questForm);draft.printed=data.get('printed')??draft.printed;draft.variable=data.get('variable')??draft.variable;save();updateQuestExplanation();}
      return;
    }
    const resources=e.target.closest('#resources');
    if(resources){readResources(resources);game.players.forEach((p,i)=>app.querySelector('#resource-total-'+i).textContent=game.expert?'???':beforeLordScore(i));return;}
    const form=e.target.closest('#final');
    if(form) {readFinal(form);app.querySelector('#preview').innerHTML=lordPreviewMarkup();}
  } catch(error){say(error.message);}
});
// Defocus number fields before the browser can spin their value on wheel scroll.
app.addEventListener('wheel',e=>{
  if(e.target instanceof HTMLInputElement && e.target.type==='number')e.target.blur();
},{capture:true,passive:true});
app.addEventListener('beforeinput',e=>{
  if(e.target.matches('#event .entry-value input') && e.data && /\D/.test(e.data))e.preventDefault();
});
function includeQuickFaction(id) {
  if(setupSelection.factions.includes(id))return true;
  if(setupSelection.factions.length>=(setupSelection.undermountain||setupSelection.skullport?6:5)){say('Select an expansion module to include a sixth faction.');return false;}
  setupSelection.factions.push(id);return true;
}
app.addEventListener('focusin',e=>{
  if(view!=='direct'||!e.target.name?.startsWith('score:'))return;
  const id=e.target.name.slice(6);
  if(setupSelection.factions.includes(id))return;
  if(!includeQuickFaction(id)){e.target.blur();return;}
  render();app.querySelector('#quick-'+id).focus({preventScroll:true});
});
function updateQuestExplanation(){try{const draft=dashboardDraft();app.querySelector('#quest-explanation').innerHTML=questExplanation(questReward(game,selected,draft.questId,draft));}catch(error){app.querySelector('#quest-explanation').textContent=error.message;}}
app.addEventListener('input',e=>{
  if(game?.dashboardMode&&e.target.closest('#dashboard-quest')&&['printed','variable'].includes(e.target.name)){dashboardDraft()[e.target.name]=e.target.value;save();updateQuestExplanation();return;}
  if(e.target.closest('#final')&&e.target.name==='count:qualifying'&&game.players[finishIndex].final.lord==='larissa'&&Number(e.target.value)>9)e.target.value='9';
  if(e.target.closest('#direct-setup')&&e.target.name.startsWith('score:')){const id=e.target.name.slice(6);if(e.target.value!==''&&!includeQuickFaction(id)){e.target.value='';return;}quickScores[id]=e.target.value;return;}
  if(e.target.closest('#event')) {
    const draft=entryDraft();
    if(e.target.name==='note')draft.note=e.target.value;
    else if(Object.hasOwn(sourceInfo,e.target.name)){
      const loss=e.target.name==='other'&&draft.loss;
      const digits=loss?e.target.value.replace(/^-/, ''):e.target.value;
      if(!/^\d*$/.test(digits)){e.target.value=(loss&&draft.values[e.target.name]?'-':'')+(draft.values[e.target.name]||'');say('Enter whole numbers only. Use the Gain / Loss buttons for corrections.');return;}
      draft.values[e.target.name]=digits;
      if(loss&&digits&&e.target.value!==('-'+digits))e.target.value='-'+digits;
    }
    save();
  }
});
app.addEventListener('submit',e=>{
  e.preventDefault();try {
    const data=new FormData(e.target);
    if(e.target.id==='dashboard-points'){
      const amount=points(game.dashboard.pendingPoints||0);if(!amount)throw Error('Add or subtract points before recording.');
      game.events.push({id:crypto.randomUUID(),player:selected,source:'other',points:amount,note:'Additional points',round:game.round});
      game.dashboard.pendingPoints=0;game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say(signed(amount)+' VP recorded for '+game.players[selected].name+'.');
    } else if(e.target.id==='dashboard-quest'){
      const draft=dashboardDraft(),id=data.get('questId');if(game.events.some(e=>e.questId===id))throw Error('That quest has already been recorded. Undo its completion to correct it.');
      const inputs={printed:count(data.get('printed')),variable:count(data.get('variable')),payment:draft.payment,heroes:heroesGardenInPlay()&&!!draft.heroes,heroesOwner:draft.heroesOwner};
      const reward=questReward(game,selected,id,inputs);
      if(questBuildingReward(id)){game.dashboard.pendingQuest={player:selected,id,inputs};save();render();}
      else recordDashboardQuest(selected,id,inputs);
    } else if(e.target.id==='threaten-buildings'){
      const pending=game.dashboard.pendingQuest;if(!pending)throw Error('No pending quest.');const effect=questBuildingReward(pending.id);if(!effect)throw Error('This quest has no building reward.');
      const ids=[1,2,3].map(i=>String(data.get('building'+i)||'')).filter(Boolean);
      if(ids.length>effect.count||[1,2,3].some(i=>i>effect.count&&data.get('building'+i)))throw Error('Select only '+effect.count+' building'+(effect.count===1?'':'s')+' for this quest.');
      if(new Set(ids).size!==ids.length)throw Error('Choose each building only once.');
      const capacity=9-ownedBuildings(game,pending.player).length;
      if(ids.length>capacity)throw Error('That faction can control at most 9 buildings.');
      if(!ids.length&&capacity>0)throw Error('Select the buildings put into play.');
      const next={...game,dashboard:{...game.dashboard,buildings:{...game.dashboard.buildings},history:[...game.dashboard.history]}};
      for(const id of ids){if(next.dashboard.buildings[id])throw Error('That building is not available.');changeBuilding(next,id,'gain',pending.player);}
      const eventId=recordDashboardQuest(pending.player,pending.id,pending.inputs,false);
      next.dashboard.history.slice(game.dashboard.history.length).forEach(h=>h.parentEventId=eventId);
      game.dashboard.buildings=next.dashboard.buildings;game.dashboard.history=next.dashboard.history;delete game.dashboard.pendingQuest;save();render();say('Quest completed and '+ids.length+' buildings gained.');
    } else if(e.target.id==='dashboard-building'){
      const id=data.get('buildingId');if(game.dashboard.buildings[id])throw Error('That building is not available.');updateBuildingOwnership(id,buildingDraft().action,selected,buildingDraft().gems);buildingDraft().id='';buildingDraft().gems=0;save();render();
    } else if(e.target.id==='direct-setup') {
      for(const f of FACTIONS){const value=data.get('score:'+f.id);if(value!==null&&String(value).trim()!==''&&!includeQuickFaction(f.id))throw new Error('Too many factions for the selected game.');}
      const {factions,undermountain,skullport}=setupSelection;
      if(factions.length<2||new Set(factions).size!==factions.length)throw new Error('Choose at least two factions.');
      if(factions.length>6||factions.length>5&&!undermountain&&!skullport)throw new Error('Select an expansion module for six factions.');
      const penalty=skullport?skullTrackPenalty(quickPenalty):1;
      const scores=factions.map(id=>points(data.get('score:'+id)||0));
      const old=game?.directEnd?game.players:[];
      const players=factions.map(id=>{const f=FACTIONS.find(f=>f.id===id);return {faction:id,name:f.name,color:f.color,final:{...(old.find(p=>p.faction===id)?.final||emptyFinal()),confirmed:false}};});
      game={version:1,directEnd:true,players,events:scores.map((score,i)=>({id:crypto.randomUUID(),player:i,source:'other',points:score,note:'Score before final scoring',round:null})),round:1,trackRounds:false,penalty,undermountain,skullport,finished:false};
      selected=0;beginFinalScoring();
    } else if(e.target.id==='setup') {
      const {undermountain,skullport,factions,expert,dashboardMode}=setupSelection;
      if(factions.length<2)throw new Error('Choose at least two factions.');
      if(factions.length>5&&!undermountain&&!skullport)throw new Error('Base supports up to five factions. Add an expansion for six.');
      game={version:1,expert,dashboardMode,...(dashboardMode?{dashboard:{buildings:{},history:[]}}:{}),players:factions.map(id=>{const f=FACTIONS.find(f=>f.id===id);return {faction:id,name:f.name,color:f.color,final:emptyFinal()};}),events:[],round:1,trackRounds:false,penalty:1,undermountain,skullport,finished:false};game.trackRounds=dashboardMode;historyOpen=false;roundsOpen=false;selected=0;view='live';save();render();say('The game has started.');
    } else if(e.target.id==='event') {
      const values=Object.fromEntries(Object.keys(sourceInfo).map(key=>[key,data.get(key)]));
      if(entryDraft().loss&&values.other)values.other='-'+String(values.other).replace(/^-/, '');
      if(game.skullport)values.emptyTrack=entryDraft().values.emptyTrack||0;
      const entries=scoringEntries(values), batch=crypto.randomUUID();
      game.events.push(...entries.map(entry=>({...entry,id:crypto.randomUUID(),batch,player:selected,note:String(data.get('note')||'').trim(),round:game.trackRounds?game.round:null})));
      const amount=entries.reduce((sum,entry)=>sum+entry.points,0);
      game.draft={values:{},note:'',loss:false};game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say(`${entries.length} scoring ${entries.length===1?'entry':'entries'} recorded for ${game.players[selected].name} · ${signed(amount)} VP total.`);
    } else if(e.target.id==='resources') {
      readResources(e.target);game.players.forEach(p=>p.final.confirmed=false);finishOrder=finalScoringOrder(game.players.map((p,i)=>beforeLordScore(i)));finishPosition=0;finishIndex=finishOrder[0];finishStep='lord';lordNamesOpen=false;if(game.dashboardMode)game.players.forEach((p,i)=>seedDashboardLord(p.final,i));save();render();window.scrollTo(0,0);
    } else if(e.target.id==='final') {
      readFinal(e.target);if(game.dashboardMode&&LORDS.find(l=>l.id===game.players[finishIndex].final.lord)?.kind==='choice'&&!QUEST_TYPES.includes(game.players[finishIndex].final.dashboardChoice))throw new Error('Choose one Quest type before revealing this Lord.');if(lordClaimed(game.players[finishIndex].final.lord))throw new Error('That Lord has already been revealed by another faction.');if(!isLordAvailable(game.players[finishIndex].final.lord,game))throw new Error('Choose an available Lord or bonus before continuing.');finalScore(liveScore(finishIndex,game.events),game.players[finishIndex].final,game.skullport?game.penalty:0);game.players[finishIndex].final.confirmed=true;
      if(finishPosition<finishOrder.length-1){finishPosition++;finishIndex=finishOrder[finishPosition];finishStep='lord';lordNamesOpen=false;}
      else {const incomplete=finishOrder.findIndex(i=>!game.players[i].final.confirmed);if(incomplete>=0){finishPosition=incomplete;finishIndex=finishOrder[incomplete];finishStep='lord';}else {game.finished=true;view='results';}}
      save();render();window.scrollTo(0,0);
    }
  } catch(error){if(e.target.id==='threaten-buildings')app.querySelector('#threaten-error').textContent=error.message;say(error.message);}
});
app.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.dashboardTab){if(!['points','buildings'].includes(b.dataset.dashboardTab))return;game.dashboard.tab=b.dataset.dashboardTab;save();render();app.querySelector('#dashboard-'+game.dashboard.tab+'-tab').focus({preventScroll:true});return;}
  if(b.dataset.infoToggle){const info=app.querySelector('#'+b.dataset.infoToggle);info.hidden=!info.hidden;b.setAttribute('aria-expanded',String(!info.hidden));return;}
  if(b.dataset.pointsStep!==undefined){try{const delta=Number(b.dataset.pointsStep);if(![-5,-1,1,5].includes(delta))return;game.dashboard.pendingPoints=points((game.dashboard.pendingPoints||0)+delta);save();render();app.querySelector('[data-points-step="'+delta+'"]').focus({preventScroll:true});}catch(error){say(error.message);}return;}
  if(b.dataset.buildingPlayer!==undefined){selected=Number(b.dataset.buildingPlayer);render();app.querySelector('.dashboard-scoreboard [data-building-player="'+selected+'"]').focus({preventScroll:true});return;}
  if(b.dataset.buildingGemStep!==undefined){const delta=Number(b.dataset.buildingGemStep);if(![-1,1].includes(delta))return;buildingDraft().gems=Math.max(0,Math.min(10000,count(buildingDraft().gems)+delta));save();render();app.querySelector('[data-building-gem-step="1"]').focus({preventScroll:true});return;}
  if(b.dataset.buildingAcquisition){buildingDraft().action=b.dataset.buildingAcquisition;save();render();app.querySelector('[data-building-acquisition="'+b.dataset.buildingAcquisition+'"]').focus({preventScroll:true});return;}
  if(b.dataset.buildingOwner){try{const owner=Number(b.dataset.ownerPlayer);if(game.dashboard.buildings[b.dataset.buildingOwner]?.owner!==owner)updateBuildingOwnership(b.dataset.buildingOwner,'transfer',owner);else render();app.querySelector('#owner-picker-'+b.dataset.buildingOwner+'>summary').focus({preventScroll:true});}catch(error){say(error.message);}return;}
  if(b.dataset.destroyBuilding){try{updateBuildingOwnership(b.dataset.destroyBuilding,'destroy',null);}catch(error){say(error.message);}return;}
  if(b.dataset.quickPenalty!==undefined){quickPenalty=skullTrackPenalty(b.dataset.quickPenalty);render();app.querySelector(`[data-quick-penalty="${quickPenalty}"]`).focus({preventScroll:true});return;}
  if(b.dataset.trackPenalty!==undefined){pendingPenalty=skullTrackPenalty(b.dataset.trackPenalty);render();app.querySelector(`[data-track-penalty="${pendingPenalty}"]`).focus();return;}
  if(b.dataset.dashboardChoice){try{if(!QUEST_TYPES.includes(b.dataset.dashboardChoice))throw Error('Choose a valid Quest type.');readFinal(app.querySelector('#final'));const f=game.players[finishIndex].final;if(f.dashboardChoice!==b.dataset.dashboardChoice){f.manualLordCount=false;f.counts={};}f.dashboardChoice=b.dataset.dashboardChoice;seedDashboardLord(f);save();render();}catch(error){say(error.message);}return;}
  if(b.dataset.questType){
    try{
      readFinal(app.querySelector('#final'));const f=game.players[finishIndex].final;
      const types=[...selectedQuestTypes(f)], type=b.dataset.questType, index=types.indexOf(type);
      if(questTypeBlocked(type,f)){say('That quest pairing belongs to an already revealed Lord.');return;}
      if(index>=0)types.splice(index,1);
      else {if(types.length===2){say('Two Quest types are selected. Tap one to remove it before choosing another.');return;}types.push(type);}
      f.counts={};f.manualLordCount=false;
      f.selectionMode='types';f.questTypes=types;
      f.lord=types.length===2?LORDS.find(l=>l.kind==='pair'&&types.every(t=>l.types.includes(t))).id:'';seedDashboardLord(f);
      save();render();app.querySelector(`[data-quest-type="${type}"]`).focus();say(`${types.length} of 2 Lord Quest Types selected.`);
    }catch(error){say(error.message);}return;
  }
  if(b.dataset.lord||b.dataset.bonus){
    try {
      readFinal(app.querySelector('#final'));const f=game.players[finishIndex].final;
      const lordId=b.dataset.lord||b.dataset.bonus;
      if(lordId){if(lordClaimed(lordId))throw new Error('That Lord has already been revealed by another faction.');if(!isLordAvailable(lordId,game))throw new Error('This Lord requires an expansion that was not selected for this game.');if(f.lord!==lordId){f.counts={};f.manualLordCount=false;}f.lord=lordId;f.selectionMode=b.dataset.bonus?'pill':'name';f.questTypes=[];delete f.dashboardChoice;seedDashboardLord(f);}
      save();render();
      const attribute=b.dataset.lord?'lord':'bonus';app.querySelector(`[data-${attribute}="${b.dataset[attribute]}"]`).focus();
    }catch(error){say(error.message);}return;
  }
  if(b.dataset.module){
    const module=b.dataset.module;if(module==='base')return;
    if(setupSelection[module]&&setupSelection.factions.length===6&&!setupSelection[module==='skullport'?'undermountain':'skullport']){say('Remove a faction before turning off the last expansion. Base supports up to five players.');return;}
    setupSelection[module]=!setupSelection[module];render();app.querySelector(`[data-module="${module}"]`).focus();say(gameLabel()+' selected.');
  }
  if(b.dataset.faction){
    const id=b.dataset.faction,index=setupSelection.factions.indexOf(id);
    if(index>=0){setupSelection.factions.splice(index,1);if(view==='direct')quickScores[id]='';}
    else {if(setupSelection.factions.length===5&&!setupSelection.undermountain&&!setupSelection.skullport){say('Base supports up to five factions. Select an expansion to add a sixth.');return;}setupSelection.factions.push(id);}
    render();app.querySelector(`[data-faction="${id}"]`).focus();say(setupSelection.factions.length+' factions selected.');
  }
  if(b.dataset.skullStep){const draft=entryDraft();draft.values.emptyTrack=Math.max(0,Math.min(10000,count(draft.values.emptyTrack||0)+(b.dataset.skullStep==='plus'?10:-10)));save();const row=app.querySelector('.empty-track-row');row.outerHTML=emptyTrackRow();return;}
  if(b.dataset.buildingEntryPlayer!==undefined){selected=Number(b.dataset.buildingEntryPlayer);render();app.querySelector('#building-entry-faction-picker>summary').focus({preventScroll:true});return;}
  if(b.dataset.questPlayer!==undefined){selected=Number(b.dataset.questPlayer);render();app.querySelector('#quest-faction-picker>summary').focus({preventScroll:true});return;}
  if(b.dataset.recordPlayer!==undefined){selected=Number(b.dataset.recordPlayer);render();app.querySelector('.record-faction-picker>summary').focus({preventScroll:true});return;}
  if(b.dataset.player!==undefined){selected=Number(b.dataset.player);render();app.querySelector(`[data-player="${selected}"]`).focus();}
  if(b.dataset.sign){entryDraft().loss=b.dataset.sign==='loss';save();render();app.querySelector(`[data-sign="${b.dataset.sign}"]`).focus();}
  if(b.dataset.undoBuildingHistory!==undefined){undoBuildingAddition(Number(b.dataset.undoBuildingHistory));return;}
  if(b.dataset.delete){removeScoringEvents([b.dataset.delete]);return;}
  if(b.dataset.edit!==undefined){finishOrder=finalScoringOrder(game.players.map((p,i)=>liveScore(i,game.events)));finishIndex=Number(b.dataset.edit);finishPosition=finishOrder.indexOf(finishIndex);finishStep='resources';lordNamesOpen=false;game.finished=false;view='final';save();render();window.scrollTo(0,0);}
  switch(b.dataset.action) {
    case 'toggle-expert':setupSelection.expert=!setupSelection.expert;render();app.querySelector('[data-action="toggle-expert"]').focus({preventScroll:true});break;
    case 'cancel-threaten':delete game.dashboard.pendingQuest;save();render();break;
    case 'show-upkeep':game.upkeepRound=game.round;save();render();break;
    case 'close-building-setup':delete game.dashboard.pendingBuildingSetup;save();render();break;
    case 'close-upkeep':delete game.upkeepRound;save();render();break;
    case 'quest-heroes':if(heroesGardenInPlay()){dashboardDraft().heroes=!dashboardDraft().heroes;save();render();}break;
    case 'quest-payment':dashboardDraft().payment=!dashboardDraft().payment;save();render();break;
    case 'undo-ownership':{const last=game.dashboard.history.at(-1);if(last?.logEventId){removeScoringEvents([last.logEventId]);break;}if(last){if(last.before?.owner!==null&&last.before?.owner!==undefined&&ownedBuildings(game,last.before.owner).length>=9&&game.dashboard.buildings[last.id]?.owner!==last.before.owner){say('Cannot restore ownership: that faction already controls 9 buildings.');break;}game.dashboard.history.pop();if(last.before)game.dashboard.buildings[last.id]=last.before;else delete game.dashboard.buildings[last.id];game.players.forEach(p=>p.final.confirmed=false);save();render();say('Last ownership change undone.');}break;}
    case 'jump-end':openDirectSetup();break;
    case 'direct-state':try{readResources(app.querySelector('#resources'));openDirectSetup();}catch(error){say(error.message);}break;
    case 'back-setup':view='setup';render();window.scrollTo(0,0);break;
    case 'quick-undermountain':
    case 'quick-skullport':{const module=b.dataset.action==='quick-undermountain'?'undermountain':'skullport';if(setupSelection[module]&&setupSelection.factions.length===6&&!setupSelection[module==='skullport'?'undermountain':'skullport']){say('Remove a faction before turning off the last expansion. Base supports up to five players.');break;}setupSelection[module]=!setupSelection[module];render();app.querySelector('[data-action="'+b.dataset.action+'"]').focus({preventScroll:true});break;}
    case 'undo':if(game.dashboardMode&&activityEntries().at(-1)?.historyIndex!==undefined){const index=activityEntries().at(-1).historyIndex,parent=game.dashboard.history[index].parentEventId;if(parent)removeScoringEvents([parent]);else undoBuildingAddition(index);break;}if(game.events.length){const latest=game.events.at(-1);removeScoringEvents(latest.parentEventId?[latest.parentEventId]:latest.batch?game.events.filter(e=>e.batch===latest.batch).map(e=>e.id):[latest.id]);}break;
    case 'enable-rounds':game.trackRounds=true;save();render();say('Round tracking enabled. Set the current round for your table.');break;
    case 'disable-rounds':game.trackRounds=false;save();render();say('Round tracking turned off.');break;
    case 'previous-round':if(game.trackRounds&&game.round>1){game.round--;save();render();}break;
    case 'round':if(game.trackRounds&&game.round<8){game.round++;if(game.dashboardMode)game.upkeepRound=game.round;save();render();}else if(game.trackRounds)say('Round 8 is the final round. Begin end-game scoring when ready.');break;
    case 'end':if(game.skullport){penaltyModal=true;pendingPenalty=null;render();}else beginFinalScoring();break;
    case 'cancel-track':penaltyModal=false;pendingPenalty=null;render();app.querySelector(view==='direct'?'[data-action="quick-track"]':'[data-action="end"]').focus();break;
    case 'confirm-track':try{const penalty=skullTrackPenalty(pendingPenalty);penaltyModal=false;if(view==='direct'){quickPenalty=penalty;render();}else{game.penalty=penalty;beginFinalScoring();}}catch(error){say(error.message);}break;
    case 'toggle-lord-override':try{readFinal(app.querySelector('#final'));const f=game.players[finishIndex].final;if(!game.dashboardMode||!f.lord)break;f.manualLordCount=!f.manualLordCount;if(f.manualLordCount)f.counts={};else seedDashboardLord(f);save();render();if(f.manualLordCount)app.querySelector('#lord-fields input').focus({preventScroll:true});}catch(error){say(error.message);}break;
    case 'edit-final':game.finished=false;game.players.forEach(p=>p.final.confirmed=false);view='final';finishStep='resources';save();render();window.scrollTo(0,0);break;
    case 'resources':try{readFinal(app.querySelector('#final'));finishStep='resources';save();render();window.scrollTo(0,0);}catch(error){say(error.message);}break;
    case 'previous':try{readResources(app.querySelector('#resources'));view='live';save();render();window.scrollTo(0,0);}catch(error){say(error.message);}break;
    case 'live':view='live';save();render();break;
    case 'new':if(confirm('Reset the game? This clears all scores and selections and returns to the home page.')){game=null;localStorage.removeItem(KEY);setupSelection.factions=[];setupSelection.undermountain=false;setupSelection.skullport=false;setupSelection.expert=false;setupSelection.dashboardMode=true;quickScores={};quickPenalty=null;penaltyModal=false;pendingPenalty=null;historyOpen=false;roundsOpen=false;setupGuideOpen=false;lordNamesOpen=false;selected=0;finishIndex=0;finishPosition=0;finishOrder=[];finishStep='resources';view='setup';render();window.scrollTo(0,0);say('Game reset. Ready for a new game.');}break;
  }
});
render();
