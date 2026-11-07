import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shuffled,cut,pick} from '../static/engine.js';
const cards=Array.from({length:22},(_,id)=>({id}));
test('shuffle retains every card and direction through cut',()=>{
 const deck=shuffled(cards,()=>.31);
 assert.equal(new Set(deck.map(c=>c.id)).size,22);
 assert.deepEqual(cut(deck,7),[...deck.slice(7),...deck.slice(0,7)]);
 assert.deepEqual(cut(cut(deck,7),15),deck);
});
test('selection cannot duplicate, exceed spread, or change after restoration',()=>{
 const state={deck:shuffled(cards,()=>.71),picks:[]};
 assert.equal(pick(state,4,3),true);
 assert.equal(pick(state,4,3),false);
 assert.equal(pick(state,99,3),false);
 pick(state,5,3);pick(state,6,3);
 assert.equal(pick(state,7,3),false);
 const restored=JSON.parse(JSON.stringify(state));
 assert.deepEqual(restored,state);
 assert.deepEqual(restored.picks.map(p=>p.id),[state.deck[4].id,state.deck[5].id,state.deck[6].id]);
});
