(() => {
  function ensureState(){
    if(!state.savedOutfits) state.savedOutfits=[];
    if(!state.feedback) state.feedback={liked:[],disliked:[]};
    if(!state.preferences) state.preferences={occasion:'Everyday'};
  }
  function keyForLook(look){return look.map(x=>x.id).sort().join('|')}
  function scoreLook(look){
    ensureState();
    const key=keyForLook(look);
    let s=0;
    if(state.feedback.liked.includes(key)) s+=20;
    if(state.feedback.disliked.includes(key)) s-=30;
    const likedItems=new Set(state.feedback.liked.flatMap(k=>k.split('|')));
    const dislikedItems=new Set(state.feedback.disliked.flatMap(k=>k.split('|')));
    look.forEach(x=>{if(likedItems.has(x.id))s+=2;if(dislikedItems.has(x.id))s-=1});
    return s;
  }
  function occasionBonus(item,occasion){
    const text=((item.notes||'')+' '+(item.category||'')+' '+(item.brand||'')).toLowerCase();
    if(occasion==='Work' && /(blazer|shirt|trouser|smart|work|loafer)/.test(text)) return 2;
    if(occasion==='Evening' && /(dress|heel|silk|satin|evening|party)/.test(text)) return 2;
    if(occasion==='Holiday' && /(linen|sandal|summer|holiday|beach)/.test(text)) return 2;
    if(occasion==='Weekend' && /(jean|denim|sneaker|casual|knit)/.test(text)) return 2;
    return 0;
  }
  function injectUI(){
    const outfits=document.getElementById('outfitsView');
    if(!outfits || document.getElementById('outfitOccasion')) return;
    const select=document.createElement('label');
    select.innerHTML='Occasion<select id="outfitOccasion"><option>Everyday</option><option>Work</option><option>Weekend</option><option>Smart</option><option>Evening</option><option>Holiday</option></select>';
    const card=outfits.querySelector('.section-card');
    card.insertBefore(select,card.querySelector('#buildOutfit'));
    const h=document.createElement('div');
    h.className='section-heading saved-heading';
    h.innerHTML='<div><span class="pill">Your style</span><h2>Saved outfits</h2></div>';
    const saved=document.createElement('div');saved.id='savedOutfits';saved.className='recommendations';
    const empty=document.createElement('div');empty.id='savedEmpty';empty.className='empty-state compact';empty.innerHTML='<h3>No saved outfits yet</h3><p>Tap Save on a suggestion you want to wear again.</p>';
    outfits.append(h,saved,empty);
    document.getElementById('outfitOccasion').addEventListener('change',async e=>{ensureState();state.preferences.occasion=e.target.value;await save();});
  }
  function renderSaved(){
    ensureState();
    const box=document.getElementById('savedOutfits'),empty=document.getElementById('savedEmpty'); if(!box)return;
    box.innerHTML=state.savedOutfits.map(o=>`<div class="outfit-card"><div class="outfit-card-head"><strong>${esc(o.occasion||'Saved look')}</strong><button class="mini-action remove-saved" data-id="${o.id}">Remove</button></div><div class="outfit-strip">${o.itemIds.map(id=>state.closet.find(x=>x.id===id)).filter(Boolean).map(photoTile).join('')}</div></div>`).join('');
    empty.style.display=state.savedOutfits.length?'none':'block';
    box.querySelectorAll('.remove-saved').forEach(b=>b.addEventListener('click',async()=>{state.savedOutfits=state.savedOutfits.filter(o=>o.id!==b.dataset.id);await save();renderSaved()}));
  }
  const originalMake=window.makeOutfits;
  window.makeOutfits=function(seed){
    let ideas=originalMake(seed);
    if(seed && seed.category==='Shoes'){
      ideas=ideas.map(look=>look.filter(item=>item.id===seed.id || item.category!=='Shoes'));
    }
    ensureState();
    const occasion=document.getElementById('outfitOccasion')?.value||state.preferences.occasion||'Everyday';
    return ideas.map(look=>({look,score:scoreLook(look)+look.reduce((n,i)=>n+occasionBonus(i,occasion),0)})).sort((a,b)=>b.score-a.score).map(x=>x.look);
  };
  const originalRender=window.renderOutfits;
  window.renderOutfits=function(seed){
    originalRender(seed);ensureState();
    const occasion=document.getElementById('outfitOccasion')?.value||state.preferences.occasion||'Everyday';
    const cards=[...document.querySelectorAll('#outfitResults .outfit-card')];
    const ideas=makeOutfits(seed);
    cards.forEach((card,i)=>{
      const look=ideas[i]; if(!look)return; const key=keyForLook(look);
      const actions=document.createElement('div');actions.className='outfit-actions';
      actions.innerHTML=`<button class="secondary save-look">Save</button><button class="ghost like-look">Like</button><button class="ghost dislike-look">Dislike</button>`;
      card.appendChild(actions);
      actions.querySelector('.save-look').onclick=async()=>{if(!state.savedOutfits.some(o=>keyForLook(o.itemIds.map(id=>state.closet.find(x=>x.id===id)).filter(Boolean))===key)){state.savedOutfits.unshift({id:uid(),itemIds:look.map(x=>x.id),occasion,createdAt:new Date().toISOString()});await save();renderSaved();}};
      actions.querySelector('.like-look').onclick=async()=>{state.feedback.liked=[...new Set([...state.feedback.liked,key])];state.feedback.disliked=state.feedback.disliked.filter(x=>x!==key);await save();renderOutfits(seed)};
      actions.querySelector('.dislike-look').onclick=async()=>{state.feedback.disliked=[...new Set([...state.feedback.disliked,key])];state.feedback.liked=state.feedback.liked.filter(x=>x!==key);await save();renderOutfits(seed)};
    });
  };
  const originalRenderAll=window.renderAll;
  window.renderAll=function(){originalRenderAll();renderSaved()};
  injectUI();ensureState();
  if(document.getElementById('outfitOccasion'))document.getElementById('outfitOccasion').value=state.preferences.occasion||'Everyday';
  renderSaved();
})();
