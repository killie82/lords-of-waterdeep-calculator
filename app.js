import {LORDS, QUEST_TYPES, count, liveScore, scoringEntries, finalScore, rankPlayers, finalScoringOrder, skullTrackPenalty, availableLords, isLordAvailable} from './scoring.js';
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
const setupSelection = {undermountain:false,skullport:false,factions:[]};
const QUEST_COLORS = {
  Arcana:{background:'#805293',ink:'#fff7ed',border:'#bc8dca'},
  Commerce:{background:'#70843c',ink:'#fff8e6',border:'#b0c477'},
  Piety:{background:'#eee0bb',ink:'#393429',border:'#d0b985'},
  Skullduggery:{background:'#393831',ink:'#f3ead7',border:'#938c72'},
  Warfare:{background:'#ca6038',ink:'#fff7e8',border:'#eaa078'}
};
function icon(kind) {
  const paths = {
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
let historyOpen = false, roundsOpen = false, setupGuideOpen = false;
let finishOrder=[], finishPosition=0, finishStep='resources', lordNamesOpen=false;
let penaltyModal=false, pendingPenalty=null;
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed = n => n>0 ? '+'+n : String(n);
const say = text => {document.querySelector('#notice').textContent=text;};
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved?.version===1 && Array.isArray(saved.players) && saved.players.length>=2 && saved.players.length<=6 && Array.isArray(saved.events)) {
    game=saved;
    game.trackRounds ||= false;
    game.players.forEach((p,i)=>{const faction=FACTIONS.find(f=>f.id===p.faction)||FACTIONS[i];p.faction=faction.id;p.name=faction.name;p.color=faction.color;});
    for(const player of game.players){
      delete player.final.extra;
      delete player.final.choice;
      if(player.final.lord&&!isLordAvailable(player.final.lord,game)){
        Object.assign(player.final,{lord:'',questTypes:[],counts:{},selectionMode:'pill',confirmed:false});game.finished=false;
        say('A saved Lord required an expansion that is not in this game. Choose an available bonus or Lord during final scoring.');
      }
    }
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
  return `<div class="entry-row"><div><label for="resource-${name}">${label}</label><p class="hint">${hint}</p></div><div class="entry-value"><input id="resource-${name}" name="${name}" type="number" inputmode="numeric" min="0" max="10000" step="1" value="${escape(value||'')}" aria-label="${label}"></div></div>`;
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
  return `<section class="welcome"><p class="eyebrow">YOUR COUNCIL AWAITS</p><h2>Keep the game moving.</h2><p>Score the moments that matter. Reveal your Lords and settle the final tally when the game ends.</p></section>
  <form id="setup"><div class="setup-panels"><section class="panel setup-game-panel"><p class="eyebrow">01 · YOUR GAME</p><h2>Choose your adventure</h2>
  <p class="hint">Base is always included. Add either expansion, or play with both.</p>
  <div class="game-cards" role="group" aria-label="Game modules">${[
    ['base','Base','city','The City of Splendors'],['undermountain','Undermountain','mountain','Beneath Mount Waterdeep'],['skullport','Skullport','skull','The Port of Shadow']
  ].map(([id,name,symbol,tagline])=>{const active=id==='base'||setupSelection[id];return `<button type="button" class="selection-card game-card ${active?'is-selected':''}" data-module="${id}" aria-pressed="${active}" ${id==='base'?'aria-disabled="true"':''}><span class="card-state">${id==='base'?'Always included':active?'Selected':'Tap to add'}</span>${icon(symbol)}<strong>${name}</strong><span class="card-caption">${tagline}</span></button>`;}).join('')}</div>
  <p class="game-summary">${gameLabel()}</p></section><section class="panel setup-council-panel"><div class="section-title faction-heading"><div><p class="eyebrow">02 · YOUR COUNCIL</p><h2>Pick your factions</h2></div><span class="badge">${setupSelection.factions.length} PLAYERS</span></div>
  <p class="hint">Tap each faction at the table. Select at least two; ${setupSelection.undermountain||setupSelection.skullport?'up to six with an expansion':'up to five for Base'}. Selection order sets the scoreboard order.</p>
  <div class="faction-cards" role="group" aria-label="Player factions">${FACTIONS.map(f=>{const position=setupSelection.factions.indexOf(f.id);return `<button type="button" class="selection-card faction-card ${position>=0?'is-selected':''} faction-${f.id}" data-faction="${f.id}" aria-pressed="${position>=0}" style="--faction:${f.color}"><span class="card-state">${position>=0?'Player '+(position+1):''}</span>${icon(f.icon)}<strong>${f.name}</strong><span class="card-caption">${position>=0?'Selected · tap to remove':'Tap to select'}</span></button>`;}).join('')}</div>
  </section></div><div class="setup-start"><p class="hint">${setupSelection.factions.length<2?'Choose at least two factions to begin.':'Your council is ready. Lords stay secret until final scoring.'}</p><button class="primary" type="submit" ${setupSelection.factions.length<2?'disabled':''}>Start game <span aria-hidden="true">→</span></button></div></form>${setupGuide()}`;
}
function scoreboard() {
  return `<div class="scoreboard">${game.players.map((p,i)=>`<div class="player" style="--player:${p.color||colors[i]}"><span class="player-name">${escape(p.name)}</span><strong>${liveScore(i,game.events)}</strong><span class="unit">VICTORY POINTS</span></div>`).join('')}</div>`;
}
function entryDraft() {
  game.drafts ||= {};
  return game.drafts[selected] ||= {values:{},note:'',loss:false};
}
function factionPicker() {
  return `<div class="entry-factions" role="group" aria-label="Faction receiving these points">${game.players.map((p,i)=>{const f=FACTIONS.find(f=>f.id===p.faction);return `<button type="button" data-player="${i}" aria-label="Record points for ${escape(p.name)}" aria-pressed="${selected===i}" class="entry-faction ${selected===i?'chosen':''}" style="--faction:${p.color}">${icon(f?.icon)}<span>${escape(p.name)}</span></button>`;}).join('')}</div>`;
}
function entryRows() {
  const draft=entryDraft();
  return Object.entries(sourceInfo).map(([key,[label,help]])=>`<div class="entry-row"><div><label for="entry-${key}">${label}</label><p class="hint" id="help-${key}">${help}</p>${key==='other'?`<div class="correction-sign" role="group" aria-label="Correction direction"><button type="button" data-sign="gain" class="${!draft.loss?'chosen':''}" aria-pressed="${!draft.loss}">+ Gain</button><button type="button" data-sign="loss" class="${draft.loss?'chosen':''}" aria-pressed="${draft.loss}">− Loss</button></div>`:''}</div><div class="entry-value">${key==='other'?`<span class="entry-sign" aria-hidden="true">${draft.loss?'−':'+'}</span>`:''}<input id="entry-${key}" name="${key}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" value="${escape(draft.values[key]||'')}" placeholder="0" aria-describedby="help-${key}" autocomplete="off" enterkeyhint="next"><span class="entry-unit">VP</span></div></div>`).join('');
}
function live() {
  const p=game.players[selected];
  return `<div class="toolbar"><div>${button('end','End-game scoring','primary small')}</div><p class="eyebrow">THE COUNCIL</p></div>
  ${scoreboard()}<div class="live-sections"><section class="panel"><div class="section-title"><div><p class="eyebrow">ADD TO THE LEDGER</p><h2>Record points</h2></div><span class="diamond" aria-hidden="true">◆</span></div>
  ${factionPicker()}<p class="entry-recipient">Recording for <strong style="color:${p.color}">${escape(p.name)}</strong></p><form id="event">${entryRows()}
  <div class="record-actions"><div class="record-faction-icon" style="--faction:${p.color}" role="img" aria-label="${escape(p.name)}">${icon(FACTIONS.find(f=>f.id===p.faction)?.icon)}</div><button class="primary record-submit" type="submit">Record points</button></div>
  <label>Note <span class="optional">optional · applies to this submission</span><input name="note" maxlength="100" value="${escape(entryDraft().note)}" placeholder="Quest or card name, or a reminder" autocomplete="off"></label>
  </form></section>
  ${game.skullport?`<section class="empty-track"><div><strong>Skull track empty?</strong><p class="hint">If ${escape(p.name)} must gain a skull and none remain, lose 10 VP per skull that cannot be taken.</p></div>${button('empty-track','−10 VP','penalty-button')}</section>`:''}
  <details class="panel optional-panel" id="round-tracking" ${roundsOpen?'open':''}><summary>Round tracking <span class="optional">optional</span></summary><div class="optional-content">
  ${game.trackRounds?`<p class="eyebrow">ROUND ${game.round} OF 8</p><div class="round-actions">${button('previous-round','Previous round','quiet')}${button('round','Next round','quiet')}${button('disable-rounds','Turn off tracking','quiet')}</div><p class="hint">New scoring entries include the current round. Advance it when your table is ready.</p>`:`<p class="hint">Score without tracking rounds, or turn this on to include the current round in new activity entries.</p>${button('enable-rounds','Enable round tracking','quiet')}`}
  </div></details>
  <details class="panel history optional-panel" id="activity-log" ${historyOpen?'open':''}><summary>Activity log <span class="optional">${game.events.length} ${game.events.length===1?'entry':'entries'}</span></summary><div class="optional-content"><div class="section-title"><p class="hint">All factions · latest first</p>${button('undo','Undo latest','quiet')}</div>
  ${game.events.length?`<ol class="ledger">${[...game.events].reverse().map(e=>`<li><div><b>${escape(game.players[e.player].name)}</b><span>${escape(sourceInfo[e.source]?.[0] || 'Other')}${e.round?' · Round '+e.round:''}</span>${e.note?`<small>${escape(e.note)}</small>`:''}</div><strong class="${e.points<0?'loss':''}">${signed(e.points)}</strong><button type="button" class="remove" data-delete="${e.id}" aria-label="Remove ${escape(game.players[e.player].name)} ${e.points} point entry">×</button></li>`).join('')}</ol>`:'<div class="empty"><span aria-hidden="true">◇</span><h3>A fresh ledger</h3><p>Choose a faction, then record their first points.</p></div>'}</div></details></div>
  <div class="bottom-actions live-bottom-actions">${button('new','New game','quiet')}<span class="hint">Saved in this browser</span>${button('end','End-game scoring','primary')}</div>`;
}
function lordFields(f) {
  const l=LORDS.find(l=>l.id===f.lord); if(!l)return `<p class="hint">${f.selectionMode==='types'?'Pick two Lord Quest Types to see their bonus inputs.':'Choose two Quest types, another bonus, or a Lord by name to see the bonus inputs.'}</p>`;
  const n=(key,label)=>bonusInput('count:'+key,label,f.counts[key]??0,l.rate);
  if(l.kind==='pair'){
    const types=selectedQuestTypes(f).length===2?selectedQuestTypes(f):l.types;
    return `<p class="hint">Count your completed ${types.join(' and ')} Quests together. Include Plot Quests; exclude Mandatory Quests.</p>${bonusInput('count:pairTotal',`Total ${types.join(' and ')} Quests completed`,f.counts.pairTotal??l.types.reduce((sum,type)=>sum+count(f.counts[type]??0),0),4)}`;
  }
  if(l.kind==='builder')return `<p class="hint">6 VP per building you control at the end of the game.</p>${n('qualifying','Buildings controlled')}`;
  if(l.kind==='module'){
    const moduleName=l.module==='skullport'?'Skullport':'Undermountain';
    return `<p class="hint">Count completed quests and controlled buildings bearing the ${moduleName} set symbol together. Exclude Mandatory Quests.</p>${bonusInput('count:moduleTotal',`${moduleName} quests completed and buildings controlled`,f.counts.moduleTotal??(count(f.counts.quests??0)+count(f.counts.buildings??0)),4)}`;
  }
  if(l.kind==='corruption')return `<p class="rule-note">Each skull in your Tavern earns 4 bonus VP. The normal −${game.penalty} VP penalty per skull still applies.</p><div class="bonus-input"><div><p>Skulls in your Tavern</p><span class="multiplier">× 4 VP each</span><p class="hint">Carried over from the previous screen.</p></div><output class="carried-count" aria-label="Skulls carried over from your Tavern">${count(f.corruption)}</output></div>`;
  if(l.kind==='choice')return `<p class="hint">Choose one Quest type. Each completed Quest of that type earns 6 VP. Include Plot Quests; exclude Mandatory Quests.</p>${n('qualifying','Completed Quests of your chosen type')}`;
  if(l.kind==='large')return `<p class="hint">5 VP for each completed Quest with a printed reward of 10 VP or more. Additional Plot Quest effects do not raise the printed reward.</p>${n('qualifying','Quests with a reward of 10+ VP')}`;
  return `<p class="hint">3 VP per completed non-Mandatory Quest, including Plot Quests.</p>${n('qualifying','Non-Mandatory Quests completed')}`;
}
function bonusInput(name,label,value,rate) {
  return `<div class="bonus-input"><div><label for="bonus-${name}">${label}</label><span class="multiplier">× ${rate} VP each</span></div><input id="bonus-${name}" name="${name}" type="number" inputmode="numeric" min="0" max="10000" step="1" value="${escape(value)}" required></div>`;
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
function finalPreview(i) {try{if(!isLordAvailable(game.players[i].final.lord,game))return null;return finalScore(liveScore(i,game.events),game.players[i].final,game.skullport?game.penalty:0);}catch{return null;}}
function breakdown(s) {return `<dl class="breakdown">${[['During play',s.live],['Leftover adventurers',s.adventurers],['Leftover gold',s.gold],['Lord bonus',s.lord],['Corruption penalty',s.corruption]].map(([k,v])=>`<div><dt>${k}</dt><dd>${signed(v)}</dd></div>`).join('')}<div class="total"><dt>Final score</dt><dd>${s.total}</dd></div></dl>`;}
function finish() {
  const p=game.players[finishIndex], f=p.final;
  const available=availableLords(game);
  const mode=f.selectionMode||'name';
  const questTypes=selectedQuestTypes(f);
  const pill=l=>`<button type="button" data-bonus="${l.id}" class="bonus-pill ${mode==='pill'&&f.lord===l.id?'chosen':''}" aria-pressed="${mode==='pill'&&f.lord===l.id}">${escape(bonusLabel(l))}</button>`;
  const specialRows=[
    ['larissa',...(game.skullport?['irusyl']:[])],
    ...(game.skullport?[['sangalor','xanathar']]:[]),
    ...(game.undermountain?[['trobriand','danilo'],['halaster']]:[])
  ];
  const body=finishStep==='resources'?`
    <p class="eyebrow">01 · YOUR TAVERN</p><h2>${escape(p.name)}</h2><p class="hint">Count what remains. Your Lord stays hidden until the next screen.</p>
    <form id="resources">${resourceInput('adventurers','Total adventurers',f.adventurers,'1 VP per adventurer cube')}
    ${resourceInput('gold','Gold coins',f.gold,'1 VP per 2 Gold')}
    ${game.skullport?resourceInput('corruption','Skulls in your Tavern',f.corruption,`−${game.penalty} VP per skull · the track value applies to every faction`):''}
    <div id="preview" aria-live="polite">${resourcePreview()}</div><div class="nav-actions">${button('previous',finishPosition?'Previous player':'Back to play','quiet')}<button class="primary" type="submit">Reveal Lord →</button></div></form>`:`
    <p class="eyebrow">02 · REVEAL YOUR LORD</p><h2>${escape(p.name)}</h2><p class="hint">Choose the bonus printed on your card, or find your Lord by name below.</p>
    <form id="final"><input type="hidden" name="lord" value="${escape(f.lord)}"><h3>Lord Quest Types <span class="optional">pick two</span></h3><p class="hint" id="quest-type-help">${questTypes.length} of 2 selected · 4 VP for each completed Quest of either type.</p><div class="bonus-pills" role="group" aria-label="Lord Quest Types, pick two" aria-describedby="quest-type-help">${QUEST_TYPES.map(type=>{const color=QUEST_COLORS[type];return `<button type="button" data-quest-type="${type}" class="bonus-pill quest-type-pill" aria-pressed="${questTypes.includes(type)}" style="--quest-bg:${color.background};--quest-ink:${color.ink};--quest-border:${color.border}">${type}</button>`;}).join('')}</div>
    <h3>Other Lord bonuses</h3><div class="other-bonus-rows" role="group" aria-label="Other Lord bonuses">${specialRows.map(row=>`<div class="special-bonus-row">${row.map(id=>available.find(l=>l.id===id)).filter(Boolean).map(pill).join('')}</div>`).join('')}</div>
    <details id="lord-names" ${lordNamesOpen?'open':''}><summary>Select your Lord by name</summary><div class="lord-cards" role="group" aria-label="Choose your Lord by name">${available.map(l=>`<button type="button" data-lord="${l.id}" class="lord-card ${mode==='name'&&f.lord===l.id?'chosen':''}" aria-pressed="${mode==='name'&&f.lord===l.id}"><strong>${escape(l.name)}</strong><span>${escape(bonusLabel(l))}</span></button>`).join('')}</div></details>
    <div id="lord-fields">${lordFields(f)}</div>
    <div id="preview" aria-live="polite">${finalPreview(finishIndex)?breakdown(finalPreview(finishIndex)):'<p class="hint">Choose a bonus or Lord to preview the final score.</p>'}</div>
    <div class="nav-actions">${button('resources','Back to Tavern','quiet')}<button class="primary" type="submit">${finishPosition===finishOrder.length-1?'Show final results':'Next player →'}</button></div></form>`;
  return `<div class="toolbar"><p class="eyebrow">FINAL SCORING · FACTION ${finishPosition+1} OF ${game.players.length}</p>${button('live','Back to scoreboard','quiet')}</div>${standings()}<section class="panel final-panel">${body}</section>`;
}
function resourcePreview() {
  const f=game.players[finishIndex].final;
  const cubes=count(f.adventurers),gold=Math.floor(count(f.gold)/2),skulls=game.skullport?-count(f.corruption)*game.penalty:0;
  return `<dl class="breakdown"><div><dt>During play</dt><dd>${liveScore(finishIndex,game.events)}</dd></div><div><dt>Adventurer cubes</dt><dd>${signed(cubes)}</dd></div><div><dt>Gold</dt><dd>${signed(gold)}</dd></div>${game.skullport?`<div><dt>Skull penalty</dt><dd>${skulls}</dd></div>`:''}<div class="total"><dt>Before Lord bonus</dt><dd>${liveScore(finishIndex,game.events)+cubes+gold+skulls}</dd></div></dl>`;
}
function standings() {
  const rows=game.players.map((p,i)=>({p,index:i,score:p.final.confirmed?finalPreview(i).total:liveScore(i,game.events)})).sort((a,b)=>b.score-a.score);
  return `<section class="standings"><div class="section-title"><h3>Current standings</h3><span class="hint">Scoring from last to first</span></div><ol>${rows.map((r,i)=>`<li class="${r.index===finishIndex?'scoring-now':''}" style="--faction:${r.p.color}"><span class="standing-rank">${rows.findIndex(x=>x.score===r.score)+1}</span><span class="standing-name">${escape(r.p.name)}<small>${r.p.final.confirmed?'Final score':r.index===finishIndex?'Scoring now · points during play':'Points during play'}</small></span><strong>${r.score}</strong></li>`).join('')}</ol><p class="hint">Totals update after each Lord is revealed and confirmed. Ties in reveal order are chosen randomly.</p></section>`;
}
function beginFinalScoring() {
  finishOrder=finalScoringOrder(game.players.map((p,i)=>liveScore(i,game.events)));
  finishPosition=0;finishIndex=finishOrder[0];finishStep='resources';lordNamesOpen=false;
  game.players.forEach(p=>p.final.confirmed=false);game.finished=false;view='final';save();render();window.scrollTo(0,0);
}
function trackModal() {
  return `<dialog id="skull-track-modal" aria-labelledby="track-title"><p class="eyebrow">BEFORE THE FINAL REVEAL</p><h2 id="track-title">Where is the skull track?</h2><p class="hint">Choose the current penalty per skull from the physical track. This applies to every faction.</p><div class="track-values" role="group" aria-label="Skull track penalty">${Array.from({length:9},(_,i)=>i+1).map(n=>`<button type="button" data-track-penalty="${n}" class="${pendingPenalty===n?'chosen':''}" aria-pressed="${pendingPenalty===n}">−${n} VP</button>`).join('')}</div><p class="hint">Use the farthest empty space from −1 on the track.</p><div class="nav-actions">${button('cancel-track','Back to play','quiet')}<button type="button" data-action="confirm-track" class="primary" ${pendingPenalty===null?'disabled':''}>Continue →</button></div></dialog>`;
}
function results() {
  const rows=rankPlayers(game.players.map((p,i)=>({name:p.name,index:i,gold:count(p.final.gold),score:finalPreview(i)})));
  const winners=rows.filter(r=>r.rank===1);
  return `<section class="welcome results-intro"><p class="eyebrow">THE COUNCIL HAS SPOKEN</p><h2>${winners.map(r=>escape(r.name)).join(' &amp; ')} ${winners.length>1?'share the victory':'wins'}</h2><p>${rows[0].score.total} victory points${winners.length>1?' · tied on points and Gold':rows.length>1&&rows[0].score.total===rows[1].score.total?' · Gold breaks the tie':''}</p></section>
  <div class="result-grid">${rows.map(r=>`<section class="panel result"><div class="section-title"><div><p class="eyebrow">${r.rank===1?'VICTOR':'PLACE '+r.rank}</p><h2>${escape(r.name)}</h2></div><strong class="final-total">${r.score.total}</strong></div><p class="lord-name">${escape(LORDS.find(l=>l.id===game.players[r.index].final.lord).name)}</p>${breakdown(r.score)}<p class="hint">${r.gold} Gold remaining · used to break ties</p><button type="button" class="quiet" data-edit="${r.index}">Edit final scoring</button></section>`).join('')}</div>
  <div class="bottom-actions">${button('live','Return to scoreboard','quiet')}${button('new','Start a new game','primary')}</div>`;
}
function render() {
  app.innerHTML=(view==='setup'?setup():view==='live'?live():view==='final'?finish():results())+(penaltyModal?trackModal():'');
  if(penaltyModal){const dialog=app.querySelector('#skull-track-modal');dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();penaltyModal=false;pendingPenalty=null;render();app.querySelector('[data-action="end"]').focus();});}
}
app.addEventListener('toggle',e=>{
  if(e.target.id==='setup-guide')setupGuideOpen=e.target.open;
  if(e.target.id==='activity-log')historyOpen=e.target.open;
  if(e.target.id==='round-tracking')roundsOpen=e.target.open;
  if(e.target.id==='lord-names')lordNamesOpen=e.target.open;
},true);
function readFinal(form) {
  const current=game.players[finishIndex].final, f={...current,counts:{...current.counts}}, data=new FormData(form);
  if(data.has('lord'))f.lord=data.get('lord');
  if(f.lord&&!isLordAvailable(f.lord,game))throw new Error('This Lord requires an expansion that was not selected for this game.');
  for(const key of ['adventurers','gold','corruption'])if(data.has(key))f[key]=count(data.get(key));
  for(const [key,value] of data)if(key.startsWith('count:'))f.counts[key.slice(6)]=count(value);
  f.confirmed=false;game.players[finishIndex].final=f;game.finished=false;save();
}
app.addEventListener('change',e=>{
  try {
    const form=e.target.closest('#final, #resources');
    if(form) {readFinal(form);app.querySelector('#preview').innerHTML=finishStep==='resources'?resourcePreview():finalPreview(finishIndex)?breakdown(finalPreview(finishIndex)):'<p class="hint">Choose a bonus or Lord to preview the final score.</p>';}
  } catch(error){say(error.message);}
});
app.addEventListener('beforeinput',e=>{
  if(e.target.matches('#event .entry-value input') && e.data && /\D/.test(e.data))e.preventDefault();
});
app.addEventListener('input',e=>{
  if(e.target.closest('#event')) {
    const draft=entryDraft();
    if(e.target.name==='note')draft.note=e.target.value;
    else if(Object.hasOwn(sourceInfo,e.target.name)){
      if(!/^\d*$/.test(e.target.value)){e.target.value=draft.values[e.target.name]||'';say('Enter whole numbers only. Use the Gain / Loss buttons for corrections.');return;}
      draft.values[e.target.name]=e.target.value;
    }
    save();
  }
});
app.addEventListener('submit',e=>{
  e.preventDefault();try {
    const data=new FormData(e.target);
    if(e.target.id==='setup') {
      const {undermountain,skullport,factions}=setupSelection;
      if(factions.length<2)throw new Error('Choose at least two factions.');
      if(factions.length>5&&!undermountain&&!skullport)throw new Error('Base supports up to five factions. Add an expansion for six.');
      game={version:1,players:factions.map(id=>{const f=FACTIONS.find(f=>f.id===id);return {faction:id,name:f.name,color:f.color,final:emptyFinal()};}),events:[],round:1,trackRounds:false,penalty:1,undermountain,skullport,finished:false};historyOpen=false;roundsOpen=false;selected=0;view='live';save();render();say('The game has started.');
    } else if(e.target.id==='event') {
      const values=Object.fromEntries(Object.keys(sourceInfo).map(key=>[key,data.get(key)]));
      if(entryDraft().loss&&values.other)values.other='-'+values.other;
      const entries=scoringEntries(values), batch=crypto.randomUUID();
      game.events.push(...entries.map(entry=>({...entry,id:crypto.randomUUID(),batch,player:selected,note:String(data.get('note')||'').trim(),round:game.trackRounds?game.round:null})));
      const amount=entries.reduce((sum,entry)=>sum+entry.points,0);
      game.drafts[selected]={values:{},note:'',loss:false};game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say(`${entries.length} scoring ${entries.length===1?'entry':'entries'} recorded for ${game.players[selected].name} · ${signed(amount)} VP total.`);
    } else if(e.target.id==='resources') {
      readFinal(e.target);finishStep='lord';lordNamesOpen=false;save();render();window.scrollTo(0,0);
    } else if(e.target.id==='final') {
      readFinal(e.target);if(!isLordAvailable(game.players[finishIndex].final.lord,game))throw new Error('Choose an available Lord or bonus before continuing.');finalScore(liveScore(finishIndex,game.events),game.players[finishIndex].final,game.skullport?game.penalty:0);game.players[finishIndex].final.confirmed=true;
      if(finishPosition<finishOrder.length-1){finishPosition++;finishIndex=finishOrder[finishPosition];finishStep='resources';lordNamesOpen=false;}
      else {const incomplete=finishOrder.findIndex(i=>!game.players[i].final.confirmed);if(incomplete>=0){finishPosition=incomplete;finishIndex=finishOrder[incomplete];finishStep='resources';}else {game.finished=true;view='results';}}
      save();render();window.scrollTo(0,0);
    }
  } catch(error){say(error.message);}
});
app.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.trackPenalty!==undefined){pendingPenalty=skullTrackPenalty(b.dataset.trackPenalty);render();app.querySelector(`[data-track-penalty="${pendingPenalty}"]`).focus();return;}
  if(b.dataset.questType){
    try{
      readFinal(app.querySelector('#final'));const f=game.players[finishIndex].final;
      const types=[...selectedQuestTypes(f)], type=b.dataset.questType, index=types.indexOf(type);
      if(index>=0)types.splice(index,1);
      else {if(types.length===2){say('Two Quest types are selected. Tap one to remove it before choosing another.');return;}types.push(type);}
      f.counts={};
      f.selectionMode='types';f.questTypes=types;
      f.lord=types.length===2?LORDS.find(l=>l.kind==='pair'&&types.every(t=>l.types.includes(t))).id:'';
      save();render();app.querySelector(`[data-quest-type="${type}"]`).focus();say(`${types.length} of 2 Lord Quest Types selected.`);
    }catch(error){say(error.message);}return;
  }
  if(b.dataset.lord||b.dataset.bonus){
    try {
      readFinal(app.querySelector('#final'));const f=game.players[finishIndex].final;
      const lordId=b.dataset.lord||b.dataset.bonus;
      if(lordId){if(!isLordAvailable(lordId,game))throw new Error('This Lord requires an expansion that was not selected for this game.');if(f.lord!==lordId)f.counts={};f.lord=lordId;f.selectionMode=b.dataset.bonus?'pill':'name';f.questTypes=[];}
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
    if(index>=0)setupSelection.factions.splice(index,1);
    else {if(setupSelection.factions.length===5&&!setupSelection.undermountain&&!setupSelection.skullport){say('Base supports up to five factions. Select an expansion to add a sixth.');return;}setupSelection.factions.push(id);}
    render();app.querySelector(`[data-faction="${id}"]`).focus();say(setupSelection.factions.length+' factions selected.');
  }
  if(b.dataset.player!==undefined){selected=Number(b.dataset.player);render();app.querySelector(`[data-player="${selected}"]`).focus();}
  if(b.dataset.sign){entryDraft().loss=b.dataset.sign==='loss';save();render();app.querySelector(`[data-sign="${b.dataset.sign}"]`).focus();}
  if(b.dataset.delete){game.events=game.events.filter(ev=>ev.id!==b.dataset.delete);game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say('Entry removed.');}
  if(b.dataset.edit!==undefined){finishOrder=finalScoringOrder(game.players.map((p,i)=>liveScore(i,game.events)));finishIndex=Number(b.dataset.edit);finishPosition=finishOrder.indexOf(finishIndex);finishStep='resources';lordNamesOpen=false;game.finished=false;view='final';save();render();window.scrollTo(0,0);}
  switch(b.dataset.action) {
    case 'undo':if(game.events.length){const latest=game.events.at(-1);if(latest.batch)game.events=game.events.filter(e=>e.batch!==latest.batch);else game.events.pop();game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say('Latest submission undone.');}break;
    case 'enable-rounds':game.trackRounds=true;save();render();say('Round tracking enabled. Set the current round for your table.');break;
    case 'disable-rounds':game.trackRounds=false;save();render();say('Round tracking turned off.');break;
    case 'previous-round':if(game.trackRounds&&game.round>1){game.round--;save();render();}break;
    case 'round':if(game.trackRounds&&game.round<8){game.round++;save();render();}else if(game.trackRounds)say('Round 8 is the final round. Begin end-game scoring when ready.');break;
    case 'empty-track':if(game.skullport){game.events.push({id:crypto.randomUUID(),batch:crypto.randomUUID(),player:selected,source:'other',points:-10,note:'Empty skull track · unable to gain 1 skull',round:game.trackRounds?game.round:null});game.finished=false;game.players.forEach(p=>p.final.confirmed=false);save();render();say(`−10 VP recorded for ${game.players[selected].name}.`);}break;
    case 'end':if(game.skullport){penaltyModal=true;pendingPenalty=null;render();}else beginFinalScoring();break;
    case 'cancel-track':penaltyModal=false;pendingPenalty=null;render();app.querySelector('[data-action="end"]').focus();break;
    case 'confirm-track':try{game.penalty=skullTrackPenalty(pendingPenalty);penaltyModal=false;beginFinalScoring();}catch(error){say(error.message);}break;
    case 'resources':try{readFinal(app.querySelector('#final'));finishStep='resources';save();render();window.scrollTo(0,0);}catch(error){say(error.message);}break;
    case 'previous':try{readFinal(app.querySelector('#resources'));if(finishPosition){finishPosition--;finishIndex=finishOrder[finishPosition];finishStep='resources';}else view='live';save();render();window.scrollTo(0,0);}catch(error){say(error.message);}break;
    case 'live':view='live';save();render();break;
    case 'new':if(confirm('Start a new game? This replaces the current game and its score history.')){game=null;localStorage.removeItem(KEY);setupSelection.factions=[];setupSelection.undermountain=false;setupSelection.skullport=false;view='setup';render();say('Ready for a new game.');}break;
  }
});
render();
