const STORAGE_KEY='eiram-closet-v1';
let state={closet:[],wishlist:[]};
let currentPhoto='';

const views=['closet','outfits','colour','wishlist','settings'];
const titleMap={closet:'My Closet',outfits:'Outfits',colour:'Colour Combinations',wishlist:'Wishlist',settings:'Settings'};
const wadaPalettes=[
  {name:'Deep blue + warm ochre',keys:['navy','blue','indigo'],colors:['#24334a','#c49045','#e7d8b1']},
  {name:'Olive + dusty rose',keys:['olive','green','khaki'],colors:['#6f7154','#c8928d','#ead7c7']},
  {name:'Burgundy + soft teal',keys:['burgundy','wine','red'],colors:['#713f46','#6d8f8b','#d8c6a5']},
  {name:'Cream + rust + charcoal',keys:['cream','ivory','beige'],colors:['#eee3cd','#a65f3e','#4f514f']},
  {name:'Black + muted gold + stone',keys:['black','charcoal'],colors:['#272726','#b59b61','#c9c0b1']},
  {name:'Brown + moss + pale blue',keys:['brown','camel','tan'],colors:['#7d6047','#788064','#b8c7ce']},
  {name:'Pink + chocolate + sage',keys:['pink','rose'],colors:['#c98f93','#594039','#9da68d']},
  {name:'White + cobalt + brick',keys:['white'],colors:['#f5f3ec','#365a91','#a6513f']}
];

function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=JSON.parse(raw)}catch(e){console.warn(e)}renderAll()}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function switchView(name){views.forEach(v=>document.getElementById(v+'View').classList.toggle('active',v===name));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));document.getElementById('screenTitle').textContent=titleMap[name];window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));

document.getElementById('addQuick').addEventListener('click',()=>openForm('closet'));
document.querySelectorAll('[data-open-form]').forEach(b=>b.addEventListener('click',()=>openForm(b.dataset.openForm)));
document.getElementById('closeDialog').addEventListener('click',()=>document.getElementById('itemDialog').close());

const form=document.getElementById('itemForm');
const dialog=document.getElementById('itemDialog');
const preview=document.getElementById('photoPreview');
const picker=document.querySelector('.photo-picker');

document.getElementById('itemPhoto').addEventListener('change',e=>{
  const file=e.target.files?.[0]; if(!file)return;
  const reader=new FileReader(); reader.onload=()=>{currentPhoto=reader.result;preview.src=currentPhoto;picker.classList.add('has-photo')}; reader.readAsDataURL(file);
});

function openForm(mode,item=null){
  form.reset();currentPhoto=item?.photo||'';
  document.getElementById('itemMode').value=mode;document.getElementById('editId').value=item?.id||'';
  document.getElementById('formEyebrow').textContent=mode==='wishlist'?'ADD TO WISHLIST':'ADD TO CLOSET';
  document.getElementById('formTitle').textContent=item?'Edit item':mode==='wishlist'?'Wishlist item':'New garment';
  ['priceWrap','targetWrap','linkWrap'].forEach(id=>document.getElementById(id).style.display=mode==='wishlist'?'':'none');
  document.getElementById('deleteItem').hidden=!item;
  if(item){
    itemName.value=item.name||'';itemCategory.value=item.category||'';itemColour.value=item.colour||'';itemSeason.value=item.season||'All-season';itemBrand.value=item.brand||'';itemSize.value=item.size||'';itemPrice.value=item.price||'';targetPrice.value=item.targetPrice||'';itemLink.value=item.link||'';itemNotes.value=item.notes||'';
  }
  if(currentPhoto){preview.src=currentPhoto;picker.classList.add('has-photo')}else{preview.removeAttribute('src');picker.classList.remove('has-photo')}
  dialog.showModal();
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  const mode=itemMode.value;const id=editId.value||uid();
  const data={id,owner:'You',name:itemName.value.trim(),category:itemCategory.value,colour:itemColour.value.trim(),season:itemSeason.value,brand:itemBrand.value.trim(),size:itemSize.value.trim(),photo:currentPhoto,notes:itemNotes.value.trim(),updatedAt:new Date().toISOString()};
  if(mode==='wishlist'){data.price=itemPrice.value;data.targetPrice=targetPrice.value;data.link=itemLink.value.trim();data.status='Watching'}
  const arr=state[mode];const idx=arr.findIndex(x=>x.id===id);if(idx>=0)arr[idx]=data;else arr.unshift(data);save();dialog.close();
});

document.getElementById('deleteItem').addEventListener('click',()=>{
  const mode=itemMode.value,id=editId.value;if(!id)return;
  if(confirm('Delete this item?')){state[mode]=state[mode].filter(x=>x.id!==id);save();dialog.close()}
});

function cardHtml(item,mode){
  const img=item.photo?`<img src="${item.photo}" alt="${esc(item.name)}">`:`<div class="item-photo-placeholder">${mode==='wishlist'?'♡':'◫'}</div>`;
  const price=mode==='wishlist'&&item.price?`<div class="price">€${esc(String(item.price))}${item.targetPrice?` · target €${esc(String(item.targetPrice))}`:''}</div>`:'';
  return `<article class="item-card" data-mode="${mode}" data-id="${item.id}">${img}<div class="item-body"><h3>${esc(item.name)}</h3><p class="meta">${esc(item.category)}${item.colour?' · '+esc(item.colour):''}</p>${price}</div></article>`
}

function renderAll(){
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();const cat=document.getElementById('categoryFilter')?.value||'all';
  const filtered=state.closet.filter(x=>(cat==='all'||x.category===cat)&&(`${x.name} ${x.colour} ${x.brand}`.toLowerCase().includes(q)));
  closetGrid.innerHTML=filtered.map(x=>cardHtml(x,'closet')).join('');closetEmpty.style.display=filtered.length?'none':'block';
  wishlistGrid.innerHTML=state.wishlist.map(x=>cardHtml(x,'wishlist')).join('');wishlistEmpty.style.display=state.wishlist.length?'none':'block';
  document.querySelectorAll('.item-card').forEach(c=>c.addEventListener('click',()=>openForm(c.dataset.mode,state[c.dataset.mode].find(x=>x.id===c.dataset.id))));
  const opts=state.closet.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');outfitSeed.innerHTML='<option value="">Choose an item</option>'+opts;wadaSeed.innerHTML='<option value="">Choose an item</option>'+opts;
}
searchInput.addEventListener('input',renderAll);categoryFilter.addEventListener('change',renderAll);

function colourGroup(c=''){const s=c.toLowerCase();const groups={neutral:['black','white','cream','ivory','beige','grey','gray','charcoal','stone'],blue:['navy','blue','indigo','cobalt','denim'],green:['green','olive','khaki','sage','moss'],red:['red','burgundy','wine','rust','brick'],brown:['brown','camel','tan','chocolate'],pink:['pink','rose','blush'],yellow:['yellow','ochre','mustard','gold'],purple:['purple','violet','plum']};return Object.entries(groups).find(([,a])=>a.some(k=>s.includes(k)))?.[0]||'other'}
function compatible(a,b){const ga=colourGroup(a),gb=colourGroup(b);if(ga==='neutral'||gb==='neutral')return true;const good={blue:['brown','yellow','red','pink','green'],green:['brown','pink','blue','neutral'],red:['blue','brown','neutral','pink'],brown:['blue','green','pink','neutral'],pink:['green','blue','brown','red'],yellow:['blue','brown','green'],purple:['green','yellow','neutral']};return (good[ga]||[]).includes(gb)}

buildOutfit.addEventListener('click',()=>{
  const seed=state.closet.find(x=>x.id===outfitSeed.value);if(!seed){outfitResults.innerHTML='<div class="recommendation">Choose an item first.</div>';return}
  const matches=state.closet.filter(x=>x.id!==seed.id&&compatible(seed.colour,x.colour)).slice(0,8);
  outfitResults.innerHTML=`<div class="recommendation"><strong>Starting with ${esc(seed.name)}</strong><p class="meta">Suggested pieces from your closet:</p>${matches.length?matches.map(x=>`<p>• ${esc(x.name)}${x.colour?' — '+esc(x.colour):''}</p>`).join(''):'<p>Add a few more garments to get useful combinations.</p>'}</div>`;
});

showWada.addEventListener('click',()=>{
  const seed=state.closet.find(x=>x.id===wadaSeed.value);if(!seed){wadaResults.innerHTML='<div class="recommendation">Choose an item first.</div>';return}
  const c=(seed.colour||'').toLowerCase();let palettes=wadaPalettes.filter(p=>p.keys.some(k=>c.includes(k)));if(!palettes.length)palettes=wadaPalettes.slice(0,3);
  wadaResults.innerHTML=palettes.map(p=>`<div class="recommendation"><strong>${esc(p.name)}</strong><div class="palette">${p.colors.map(c=>`<div class="swatch" style="background:${c}" title="${c}"></div>`).join('')}</div><p class="meta">Try this direction with ${esc(seed.name)}.</p></div>`).join('');
});

exportBackup.addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='eiram-closet-backup.json';a.click();URL.revokeObjectURL(a.href)
});
importBackup.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.data)throw new Error();state=x.data;save();alert('Backup restored.')}catch{alert('That backup file could not be read.')}};r.readAsText(f)});

if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
load();
