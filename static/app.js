import {shuffled, cut, pick} from './engine.js';
const cards = await fetch('cards.json').then(r=>r.json());
const KEY='mirror-arcana-v1';
const fresh=()=>({step:0,question:'',deck:[],picks:[],revealed:0,spread:'three',reverse:false});
let s;
try {s=JSON.parse(localStorage.getItem(KEY)) || fresh(); if(!Number.isInteger(s.step)||!Array.isArray(s.picks)||!Array.isArray(s.deck))s=fresh();}catch{s=fresh();}
const view=document.querySelector('#view');
const positions=()=>s.spread==='one'?['当前值得关注的主题']:['现状','阻碍','建议'];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));}catch{document.querySelector('footer').textContent='浏览器存储不可用，刷新会丢失进度。';}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(id,label)=>`<button id="${id}" class="primary">${label}</button>`;
function next(){s.step++;save();render();}
function render(){
 document.querySelector('#progress').innerHTML=['提问','混洗','切牌','牌阵','抽牌','解读'].map((x,i)=>`<span class="${i===s.step?'active':''}">${i+1} ${x}</span>`).join('');
 if(s.step===0){
 view.innerHTML=`<h2>今天，你想探索什么？</h2><label for="question">你的问题</label><textarea id="question" maxlength="2000" placeholder="例如：面对最近的变化，我可以关注什么？">${esc(s.question)}</textarea><p class="hint">可以使用 iPad 键盘的系统听写，识别后在这里修改。应用内录音将在后续接入。</p>${button('confirm','确认问题，开始洗牌')}`;
 document.querySelector('#question').oninput=e=>{s.question=e.target.value;save();};
 document.querySelector('#confirm').onclick=()=>{if(!s.question.trim()){document.querySelector('#question').focus();return;}s.question=s.question.trim();s.deck=shuffled(cards);next();};
 } else if(s.step===1){
 view.innerHTML=`<h2>想着你的问题，轻轻混洗</h2><p>在牌面区域画圈或来回滑动。准备好后，由你决定结束。</p><div id="mix" aria-label="滑动混洗区域">${s.deck.map((c,i)=>`<div class="mini" style="left:${8+(i*29)%77}%;top:${8+(i*23)%60}%;transform:rotate(${i*19%80-40}deg)">✧</div>`).join('')}</div><p id="mixstatus" class="hint">塔罗没有统一强制的洗牌手法；这里模拟散牌混洗。</p>${button('done','完成洗牌')}`;
 const mix=document.querySelector('#mix');let down=false,last=0;
 mix.onpointerdown=e=>{down=true;mix.setPointerCapture(e.pointerId);};
 mix.onpointerup=()=>down=false;mix.onpointercancel=()=>down=false;
 mix.onpointermove=e=>{if(!down||Date.now()-last<70)return;last=Date.now();const rect=mix.getBoundingClientRect();const deck=shuffled(s.deck);s.deck=deck.map(c=>({...c,reversed:s.deck.find(x=>x.id===c.id).reversed}));[...mix.children].forEach((el,i)=>{el.style.left=`${Math.max(2,Math.min(85,(e.clientX-rect.left)/rect.width*100+(i%5-2)*13))}%`;el.style.top=`${10+(i*17+e.clientY)%65}%`;el.style.transform=`rotate(${(e.clientX+i*31)%100-50}deg)`;});document.querySelector('#mixstatus').textContent='牌组已混合。继续滑动，或完成洗牌。';save();};
 document.querySelector('#done').onclick=next;
 } else if(s.step===2){
 view.innerHTML=`<h2>选择一个切牌位置</h2><p>拖动滑杆，将下半叠放到上半叠上。</p><div class="stack">✧</div><label for="cut">切牌位置：<output id="cutvalue">11</output> / 22</label><input id="cut" type="range" min="1" max="21" value="11">${button('docut','确认切牌')}`;
 document.querySelector('#cut').oninput=e=>document.querySelector('#cutvalue').textContent=e.target.value;
 document.querySelector('#docut').onclick=()=>{s.deck=cut(s.deck,Number(document.querySelector('#cut').value));next();};
 } else if(s.step===3){
 view.innerHTML=`<h2>你想如何展开这个问题？</h2><label class="choice"><input type="radio" name="spread" value="one" ${s.spread==='one'?'checked':''}> 单张牌 · 关注一个主题（1 张）</label><label class="choice"><input type="radio" name="spread" value="three" ${s.spread==='three'?'checked':''}> 三张牌 · 现状 / 阻碍 / 建议（3 张）</label><label class="choice"><input id="reverse" type="checkbox" ${s.reverse?'checked':''}> 使用逆位</label><p class="hint">当前使用 22 张大阿尔卡那模式。</p>${button('spread','确认牌阵，开始抽牌')}`;
 document.querySelector('#spread').onclick=()=>{s.spread=document.querySelector('[name=spread]:checked').value;s.reverse=document.querySelector('#reverse').checked;next();};
 } else if(s.step===4){
 const count=positions().length;
 view.innerHTML=`<h2>${s.picks.length<count?`请选择第 ${s.picks.length+1} 张：${positions()[s.picks.length]}`:'牌已抽齐，准备揭示'}</h2><div class="slots">${positions().map((p,i)=>`<div class="slot">${s.picks[i]?'✧':'○'}<small>${esc(p)}</small></div>`).join('')}</div><div class="deck">${s.deck.map((c,i)=>`<button class="back" data-index="${i}" aria-label="选择第 ${i+1} 张牌" ${s.picks.some(p=>p.index===i)||s.picks.length===count?'disabled':''}>✧</button>`).join('')}</div>${s.picks.length===count?button('reveal','进入翻牌'):''}`;
 document.querySelectorAll('[data-index]').forEach(el=>el.onclick=()=>{pick(s,Number(el.dataset.index),count);save();render();});
 const el=document.querySelector('#reveal');if(el)el.onclick=next;
 } else {
 view.innerHTML=`<h2>先看见牌，再理解它</h2><p class="question">${esc(s.question)}</p><div class="readings">${s.picks.map((p,i)=>{const c=cards.find(c=>c.id===p.id);return `<article><small>${i+1} · ${positions()[i]}</small>${i<s.revealed?`<div class="face ${s.reverse&&p.reversed?'reversed':''}">${c.symbol}</div><h3>${c.name} · ${s.reverse&&p.reversed?'逆位':'正位'}</h3><p>${esc(c.meaning)}</p>${s.reverse&&p.reversed?`<p>${esc(c.reversed)}</p>`:''}<p class="hint">位置含义：${positions()[i]}。以上为基础象征资料，尚未针对你的问题作综合判断。</p>`:`<button class="back large" data-flip="${i}" ${i!==s.revealed?'disabled':''} aria-label="翻开第 ${i+1} 张牌">✧</button>`}</article>`;}).join('')}</div>${s.revealed===s.picks.length?'<div class="notice"><h3>AI 综合解读与追问 · 尚未接入</h3><p>当前只展示项目编写的基础资料，不生成个性化判断。后续 AI 必须基于本次牌阵、资料与确认背景，明确说明依据。</p></div><label for="notes">自己的感受（自动保存在此浏览器）</label><textarea id="notes" placeholder="此刻你想到了什么？"></textarea>':''}`;
 document.querySelectorAll('[data-flip]').forEach(el=>el.onclick=()=>{s.revealed++;save();render();});
 const n=document.querySelector('#notes');if(n){n.value=s.notes||'';n.oninput=e=>{s.notes=e.target.value;save();};}
 }
}
document.querySelector('#reset').onclick=()=>{if(confirm('清除当前问题、抽牌结果和笔记？')){s=fresh();save();render();}};
render();
