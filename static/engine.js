export function shuffled(cards, random = secureRandom) {
  const deck = cards.map(c => ({id: c.id, reversed: random() < .5}));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function secureRandom() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}
export function cut(deck, index) { return [...deck.slice(index), ...deck.slice(0,index)]; }
export function pick(state, index, count) {
  if (state.picks.length >= count || state.picks.some(p => p.index === index)) return false;
  const card = state.deck[index];
  if (!card) return false;
  state.picks.push({...card, index});
  return true;
}
