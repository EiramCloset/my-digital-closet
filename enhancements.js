(() => {
  function ensureState(){if(!state.savedOutfits)state.savedOutfits=[];if(!state.feedback)state.feedback={liked:[],disliked:[]};if(!state.preferences)state.preferences={occasion:'Everyday'};if(!state.preferences.recentLooks)state.preferences.recentLooks=[];if(!state.preferences.recentItems)state.preferences.recentItems=[];if(!state.preferences.itemHistory)state.preferences.itemHistory=[];}
  function keyForLook(look){return look.map(x=>x.id).sort().join('|')}
  function scoreLook(look){ensureState();const key=keyForLook(look);let s=0;if(state.feedback.liked.includes(key))s+=20;if(state.feedback.disliked.includes(key))s-=30;const likedItems=new Set(state.feedback.liked.flatMap(k=>k.split('|')));const dislikedItems=new Set(state.feedback.disliked.flatMap(k=>k.split('|')));look.forEach(x=>{if(likedItems.has(x.id))s+=2;if(dislikedItems.has(x.id))s-=1});return s;}
  function occasionBonus(item,occasion){const text=((item.notes||'')+' '+(item.category||'')+' '+(item.brand||'')).toLowerCase();if(occasion==='Work'&&/(blazer|shirt|trouser|smart|work|loafer)/.test(text))return 2;if(occasion==='Evening'&&/(dress|heel|silk|satin|evening|party)/.test(text))return 2;if(occasion==='Holiday'&&/(linen|sandal|summer|holiday|beach)/.test(text))return 2;if(occasion==='Weekend'&&/(jean|denim|sneaker|casual|knit)/.test(text))return 2;return 0;}
  function applyTheme(theme){document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#161514':'#f6f1e9');localStorage.setItem('eiram-theme',theme);const b=document.getElementById('themeToggle');if(b){b.textContent=theme==='dark'?'Switch to light mode':'Switch to dark mode';b.setAttribute('aria-pressed',theme==='dark'?'true':'false')}}
  function injectThemeUI(){const settings=document.getElementById('settingsView');if(!settings)return;let button=document.getElementById('themeToggle');if(!button){const card=document.createElement('div');card.className='section-card theme-card';card.innerHTML='<span class="pill">Appearance</span><h2>Dark mode</h2><p>Switch between the light and dark appearance. Your choice is remembered on this phone.</p><button class="secondary" id="themeToggle" type="button">Switch to dark mode</button>';settings.prepend(card);button=card.querySelector('#themeToggle')}button.onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');applyTheme(localStorage.getItem('eiram-theme')||'light');}
  function injectUI(){const outfits=document.getElementById('outfitsView');if(!outfits||document.getElementById('outfitOccasion'))return;const select=document.createElement('label');select.innerHTML='Occasion<select id="outfitOccasion"><option>Everyday</option><option>Work</option><option>Weekend</option><option>Smart</option><option>Evening</option><option>Holiday</option></select>';const card=outfits.querySelector('.section-card');card.insertBefore(select,card.querySelector('#buildOutfit'));const h=document.createElement('div');h.className='section-heading saved-heading';h.innerHTML='<div><span class="pill">Your style</span><h2>Saved outfits</h2></div>';const saved=document.createElement('div');saved.id='savedOutfits';saved.className='recommendations';const empty=document.createElement('div');empty.id='savedEmpty';empty.className='empty-state compact';empty.innerHTML='<h3>No saved outfits yet</h3><p>Tap Save on a suggestion you want to wear again.</p>';outfits.append(h,saved,empty);document.getElementById('outfitOccasion').addEventListener('change',async e=>{ensureState();state.preferences.occasion=e.target.value;await save();});}
  function renderSaved(){ensureState();const box=document.getElementById('savedOutfits'),empty=document.getElementById('savedEmpty');if(!box)return;box.innerHTML=state.savedOutfits.map(o=>`<div class="outfit-card"><div class="outfit-card-head"><strong>${esc(o.occasion||'Saved look')}</strong><button class="mini-action remove-saved" data-id="${o.id}">Remove</button></div><div class="outfit-strip">${o.itemIds.map(id=>state.closet.find(x=>x.id===id)).filter(Boolean).map(photoTile).join('')}</div></div>`).join('');empty.style.display=state.savedOutfits.length?'none':'block';box.querySelectorAll('.remove-saved').forEach(b=>b.addEventListener('click',async()=>{state.savedOutfits=state.savedOutfits.filter(o=>o.id!==b.dataset.id);await save();renderSaved()}));}
  function renderWadaSafely(seed){const c=(seed.colour||'').toLowerCase();let palettes=wadaPalettes.filter(p=>p.keys.some(k=>c.includes(k)));if(!palettes.length)palettes=wadaPalettes.slice(0,3);wadaResults.innerHTML=palettes.map(p=>{const desiredGroups=p.labels.map(colourGroup);let matches=state.closet.filter(x=>x.id!==seed.id&&desiredGroups.includes(colourGroup(x.colour)));if(seed.category==='Shoes')matches=matches.filter(x=>x.category!=='Shoes');matches=matches.slice(0,6);return `<div class="recommendation"><strong>${esc(p.name)}</strong><div class="palette">${p.colors.map((color,i)=>`<div class="swatch-wrap"><div class="swatch" style="background:${color}"></div><small>${esc(p.labels[i])}</small></div>`).join('')}</div>${matches.length?`<p class="meta">Pieces you already own that may work with this direction:</p><div class="mini-strip">${matches.map(photoTile).join('')}</div>`:`<p class="meta">You do not have an obvious matching piece recorded yet. This can be useful as a wishlist colour direction.</p>`}</div>`}).join('');}
  showWada.addEventListener('click',e=>{const seed=state.closet.find(x=>x.id===wadaSeed.value);if(!seed)return;e.stopImmediatePropagation();renderWadaSafely(seed);},true);
  const originalWadaMatches=window.wardrobeMatchesForPalette;window.wardrobeMatchesForPalette=function(seed,palette){const matches=originalWadaMatches(seed,palette);return seed&&seed.category==='Shoes'?matches.filter(item=>item.category!=='Shoes'):matches;};
  function cleanLook(seed,look){const seen=new Set(),roles=new Set(),out=[];for(const item of look){if(!item||seen.has(item.id))continue;const role=categoryRole(item.category);if(role==='shoes'&&roles.has('shoes'))continue;if(role==='dress'&&(roles.has('top')||roles.has('bottom')))continue;if((role==='top'||role==='bottom')&&roles.has('dress'))continue;if(role==='layer'&&roles.has('layer'))continue;seen.add(item.id);roles.add(role);out.push(item)}if(seed&&!out.some(x=>x.id===seed.id)){const sr=categoryRole(seed.category);if(sr==='shoes'){for(let i=out.length-1;i>=0;i--)if(categoryRole(out[i].category)==='shoes')out.splice(i,1)}if(sr==='dress'){for(let i=out.length-1;i>=0;i--)if(['top','bottom'].includes(categoryRole(out[i].category)))out.splice(i,1)}out.unshift(seed)}return out;}
  function pairwiseScore(look){let s=0;for(let i=0;i<look.length;i++)for(let j=i+1;j<look.length;j++)s+=compatible(look[i].colour,look[j].colour)?1:-1;return s;}
  function candidatePool(seed){
    const role=categoryRole(seed.category);
    const tops=state.closet.filter(x=>x.id!==seed.id&&categoryRole(x.category)==='top').sort((a,b)=>scoreItem(seed,b)-scoreItem(seed,a)).slice(0,8);
    const bottoms=state.closet.filter(x=>x.id!==seed.id&&categoryRole(x.category)==='bottom').sort((a,b)=>scoreItem(seed,b)-scoreItem(seed,a)).slice(0,8);
    const dresses=state.closet.filter(x=>x.id!==seed.id&&categoryRole(x.category)==='dress').sort((a,b)=>scoreItem(seed,b)-scoreItem(seed,a)).slice(0,6);
    const layers=state.closet.filter(x=>x.id!==seed.id&&categoryRole(x.category)==='layer').sort((a,b)=>scoreItem(seed,b)-scoreItem(seed,a)).slice(0,6);
    const shoes=state.closet.filter(x=>x.id!==seed.id&&categoryRole(x.category)==='shoes').sort((a,b)=>scoreItem(seed,b)-scoreItem(seed,a)).slice(0,6);
    const accessories=state.closet.filter(x=>x.id!==seed.id&&categoryRole(x.category)==='accessory').sort((a,b)=>scoreItem(seed,b)-scoreItem(seed,a)).slice(0,4);
    const ideas=[];
    const layerOpts=[null,...layers.slice(0,4)],shoeOpts=[null,...shoes.slice(0,4)],accOpts=[null,...accessories.slice(0,2)];
    const add=look=>{const cleaned=cleanLook(seed,look.filter(Boolean));if(cleaned.length>1)ideas.push(cleaned)};
    if(role==='dress'){
      for(const l of layerOpts)for(const s of shoeOpts)for(const a of accOpts)add([seed,l,s,a]);
    }else{
      const topOpts=role==='top'?[seed]:tops.slice(0,6);
      const bottomOpts=role==='bottom'?[seed]:bottoms.slice(0,6);
      const useLayers=role==='layer'?[seed]:layerOpts;
      const useShoes=role==='shoes'?[seed]:shoeOpts;
      const useAcc=role==='accessory'?[seed]:accOpts;
      for(const t of topOpts)for(const b of bottomOpts)for(const l of useLayers)for(const s of useShoes)for(const a of useAcc)add([t,b,l,s,a]);
      if(['layer','shoes','accessory'].includes(role)){
        for(const d of dresses.slice(0,5))for(const l of useLayers)for(const s of useShoes)for(const a of useAcc)add([d,l,s,a]);
      }
    }
    return [...new Map(ideas.map(look=>[keyForLook(look),look])).values()];
  }
  window.makeOutfits=function(seed){
    ensureState();
    const occasion=document.getElementById('outfitOccasion')?.value||state.preferences.occasion||'Everyday';
    let ideas=candidatePool(seed).filter(look=>!state.feedback.disliked.includes(keyForLook(look)));
    if(!ideas.length)return[];
    const history=state.preferences.itemHistory||[];
    const recentSet=new Set(state.preferences.recentLooks.slice(0,6));
    const scored=ideas.map(look=>{
      const key=keyForLook(look);
      const repeatCount=look.reduce((n,item)=>n+history.filter(id=>id===item.id).length,0);
      const recentLookPenalty=recentSet.has(key)?50:0;
      const itemPenalty=repeatCount*2.5;
      const likedBonus=state.feedback.liked.includes(key)?18:0;
      const score=likedBonus+scoreLook(look)+pairwiseScore(look)+look.reduce((n,i)=>n+occasionBonus(i,occasion),0)-recentLookPenalty-itemPenalty;
      return{look,score};
    }).sort((a,b)=>b.score-a.score);
    const selected=[];
    for(const entry of scored){
      if(selected.length>=3)break;
      const overlaps=selected.some(chosen=>{
        const a=new Set(chosen.map(x=>x.id)),shared=entry.look.filter(x=>a.has(x.id)).length;
        return shared>=Math.max(2,Math.min(chosen.length,entry.look.length)-1);
      });
      if(!overlaps)selected.push(entry.look);
    }
    if(selected.length<3)for(const entry of scored){if(selected.length>=3)break;if(!selected.some(x=>keyForLook(x)===keyForLook(entry.look)))selected.push(entry.look)}
    return selected.slice(0,3);
  };
  const originalRender=window.renderOutfits;window.renderOutfits=function(seed){originalRender(seed);ensureState();const occasion=document.getElementById('outfitOccasion')?.value||state.preferences.occasion||'Everyday';const cards=[...document.querySelectorAll('#outfitResults .outfit-card')];const ideas=makeOutfits(seed);const shown=ideas.map(keyForLook);if(shown.length){state.preferences.recentLooks=[...shown,...state.preferences.recentLooks.filter(k=>!shown.includes(k))].slice(0,12);const itemIds=ideas.flatMap(look=>look.map(item=>item.id));const uniqueItems=[...new Set(itemIds)];state.preferences.recentItems=[...uniqueItems,...state.preferences.recentItems.filter(id=>!uniqueItems.includes(id))].slice(0,24);state.preferences.itemHistory=[...itemIds,...state.preferences.itemHistory].slice(0,60);dbSet('state',state).catch(()=>{})}cards.forEach((card,i)=>{const look=ideas[i];if(!look)return;const key=keyForLook(look),liked=state.feedback.liked.includes(key),disliked=state.feedback.disliked.includes(key);const actions=document.createElement('div');actions.className='outfit-actions';actions.innerHTML=`<button class="secondary save-look">Save</button><button class="secondary like-look" aria-pressed="${liked}">${liked?'✓ Liked':'👍 Like'}</button><button class="secondary dislike-look" aria-pressed="${disliked}">${disliked?'✓ Disliked':'👎 Dislike'}</button>`;card.appendChild(actions);const like=actions.querySelector('.like-look'),dislike=actions.querySelector('.dislike-look');if(liked)like.style.outline='3px solid currentColor';if(disliked)dislike.style.outline='3px solid currentColor';actions.querySelector('.save-look').onclick=async()=>{if(!state.savedOutfits.some(o=>keyForLook(o.itemIds.map(id=>state.closet.find(x=>x.id===id)).filter(Boolean))===key)){state.savedOutfits.unshift({id:uid(),itemIds:look.map(x=>x.id),occasion,createdAt:new Date().toISOString()});await save();renderSaved();}};like.onclick=async()=>{if(liked){state.feedback.liked=state.feedback.liked.filter(x=>x!==key)}else{state.feedback.liked=[...new Set([...state.feedback.liked,key])];state.feedback.disliked=state.feedback.disliked.filter(x=>x!==key)}await save();renderOutfits(seed)};dislike.onclick=async()=>{if(disliked){state.feedback.disliked=state.feedback.disliked.filter(x=>x!==key)}else{state.feedback.disliked=[...new Set([...state.feedback.disliked,key])];state.feedback.liked=state.feedback.liked.filter(x=>x!==key)}await save();renderOutfits(seed)};});};

  function renderPulse(){const box=document.getElementById('closetPulse');if(!box)return;ensureState();const total=state.closet.length,liked=state.feedback.liked.length,saved=state.savedOutfits.length;box.innerHTML='<div class="pulse-card"><strong>'+total+'</strong><span>items in closet</span></div><div class="pulse-card"><strong class="pulse-accent">'+liked+'</strong><span>liked looks</span></div><div class="pulse-card"><strong>'+saved+'</strong><span>saved outfits</span></div>'}
  function surpriseMe(){if(!state.closet.length)return;const candidates=state.closet.filter(x=>['Tops','Bottoms','Dresses','Knitwear','Jackets','Shoes'].includes(x.category));const pool=candidates.length?candidates:state.closet;const seed=pool[Math.floor(Math.random()*pool.length)];switchView('outfits');outfitSeed.value=seed.id;renderOutfits(seed);const results=document.getElementById('outfitResults');if(results)results.insertAdjacentHTML('afterbegin','<div class="shuffle-note">✨ Surprise look starting with <strong>'+esc(seed.name)+'</strong>. Tap Surprise me again for a different starting piece.</div>')}
  function bindDynamicUI(){const b=document.getElementById('surpriseStyle');if(b&&!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',surpriseMe)}renderPulse()}
  const originalRenderAll=window.renderAll;window.renderAll=function(){originalRenderAll();renderSaved();renderPulse()};injectUI();injectThemeUI();ensureState();if(document.getElementById('outfitOccasion'))document.getElementById('outfitOccasion').value=state.preferences.occasion||'Everyday';renderSaved();bindDynamicUI();applyTheme(localStorage.getItem('eiram-theme')||'light');
})();
