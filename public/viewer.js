// ================================================================
//  ZV Replay Viewer — viewer.js  v4.5
//  Fix: bot faction color | bot weapon display
// ================================================================

// ── NoSQL helpers ─────────────────────────────────────────────
const DB={
  get(k,d){try{const r=localStorage.getItem(k);return r?JSON.parse(r):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},
};

// ── Display options ───────────────────────────────────────────
const DISP_DEF={
  nicknames:true, botNicknames:false, factionPrefix:false,
  weaponLabel:true, shots:true, tracks:true, killMarkers:true,
  nicknameAlways:true,
  nicknameBgOpacity:0,
  botUseFactionColor:true,  // НОВОЕ: боты красятся в цвет фракции
};
let dispOpts=DB.get('zv_display',DISP_DEF);

function loadDisplayOpts(){
  const map={
    'opt-nicknames':'nicknames','opt-bot-nicknames':'botNicknames',
    'opt-faction-prefix':'factionPrefix','opt-weapon-label':'weaponLabel',
    'opt-shots':'shots','opt-tracks':'tracks','opt-kill-markers':'killMarkers',
    'opt-nickname-always':'nicknameAlways',
    'opt-bot-fac-color':'botUseFactionColor',
  };
  Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.checked=dispOpts[key]??DISP_DEF[key];});
  const bc=document.getElementById('opt-bot-color');if(bc)bc.value=DB.get('zv_bot_color','#5a7a6a');
  const bgOp=document.getElementById('opt-nick-bg-opacity');if(bgOp)bgOp.value=dispOpts.nicknameBgOpacity??0;
  updateBgOpacityLabel();
}
function saveDisplayOpts(){
  const map={
    'opt-nicknames':'nicknames','opt-bot-nicknames':'botNicknames',
    'opt-faction-prefix':'factionPrefix','opt-weapon-label':'weaponLabel',
    'opt-shots':'shots','opt-tracks':'tracks','opt-kill-markers':'killMarkers',
    'opt-nickname-always':'nicknameAlways',
    'opt-bot-fac-color':'botUseFactionColor',
  };
  Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)dispOpts[key]=el.checked;});
  const bgOp=document.getElementById('opt-nick-bg-opacity');
  if(bgOp)dispOpts.nicknameBgOpacity=parseFloat(bgOp.value)||0;
  DB.set('zv_display',dispOpts);
  const bc=document.getElementById('opt-bot-color');if(bc)DB.set('zv_bot_color',bc.value);
}
function updateBgOpacityLabel(){
  const lbl=document.getElementById('opt-nick-bg-label');
  const val=document.getElementById('opt-nick-bg-opacity');
  if(lbl&&val)lbl.textContent=Math.round(parseFloat(val.value)*100)+'%';
}
function getBotColor(){return DB.get('zv_bot_color','#5a7a6a');}

// Цвет бота: если включено «по фракции» — берём цвет фракции,
// иначе единый цвет из настроек
function getBotFillColor(fac){
  if(dispOpts.botUseFactionColor!==false){
    const c=facCSS(fac);
    if(c&&c!=='#2a3a30')return c;
  }
  return getBotColor();
}
function getBotStrokeColor(fac){
  if(dispOpts.botUseFactionColor!==false){
    const c=facStrokeColor(fac);
    if(c)return c+'cc';
  }
  return getBotColor()+'aa';
}

// ── Фракции ───────────────────────────────────────────────────
const FAC_DEF={
  'US':  {name:'United States',color:'#1a3a5c',labelColor:'#7ab8e0',strokeColor:'#4a88c0'},
  'USSR':{name:'Soviet Union', color:'#5c1a1a',labelColor:'#e07a7a',strokeColor:'#c04a4a'},
  'FIA': {name:'FIA',          color:'#1a4a2a',labelColor:'#7ac07a',strokeColor:'#4a9a5a'},
};
let factions=DB.get('zv_factions',FAC_DEF);

function facColor(key){if(!key||key===''||key==='-1')return null;const l={'0':'US','1':'USSR','2':'FIA'};const k=l[String(key)]??String(key);return factions[k]?.color||null;}
function facLabelColor(key){if(!key||key===''||key==='-1')return null;const l={'0':'US','1':'USSR','2':'FIA'};const k=l[String(key)]??String(key);const f=factions[k];return f?.labelColor||f?.color||null;}
function facStrokeColor(key){if(!key||key===''||key==='-1')return null;const l={'0':'US','1':'USSR','2':'FIA'};const k=l[String(key)]??String(key);const f=factions[k];return f?.strokeColor||f?.color||null;}
function facName(key){if(!key||key===''||key==='-1')return'?';const l={'0':'US','1':'USSR','2':'FIA'};const k=l[String(key)]??String(key);return factions[k]?.name||k||'?';}
function facKey(key){if(!key||key===''||key==='-1')return'?';const l={'0':'US','1':'USSR','2':'FIA'};return l[String(key)]??String(key);}
function facCSS(key){return facColor(key)||'#2a3a30';}

function renderFacList(){
  const el=document.getElementById('fac-list');el.innerHTML='';
  Object.entries(factions).forEach(([k,f])=>{
    const item=document.createElement('div');item.className='list-item';item.dataset.key=k;
    item.innerHTML=`
      <div style="display:flex;gap:3px;flex-shrink:0;">
        <div title="Заливка" style="width:14px;height:14px;background:${f.color};border:2px solid ${f.strokeColor||f.color};border-radius:2px;"></div>
        <div title="Ник" style="width:14px;height:14px;background:${f.labelColor||f.color};border-radius:2px;"></div>
      </div>
      <span class="list-item-key">${k}</span>
      <span class="list-item-name">${f.name}</span>
      <div class="list-item-actions">
        <button class="list-item-btn" onclick="editFaction('${k}')">✎</button>
        <button class="list-item-del" onclick="deleteFaction('${k}')">✕</button>
      </div>`;
    el.appendChild(item);
  });
}
function editFaction(key){
  const f=factions[key];if(!f)return;
  const item=[...document.querySelectorAll('#fac-list .list-item')].find(el=>el.dataset.key===key);if(!item)return;
  item.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:2px;font-family:var(--mono);font-size:8px;color:var(--muted);flex-shrink:0;">
      <label style="display:flex;align-items:center;gap:3px;"><input type="color" value="${f.color}" style="width:24px;height:18px;border:none;background:transparent;cursor:pointer;padding:0;"><span>fill</span></label>
      <label style="display:flex;align-items:center;gap:3px;"><input type="color" value="${f.strokeColor||f.color}" style="width:24px;height:18px;border:none;background:transparent;cursor:pointer;padding:0;"><span>stroke</span></label>
      <label style="display:flex;align-items:center;gap:3px;"><input type="color" value="${f.labelColor||f.color}" style="width:24px;height:18px;border:none;background:transparent;cursor:pointer;padding:0;"><span>label</span></label>
    </div>
    <input type="text" class="edit-input" value="${key}" style="width:55px;opacity:.5;" readonly>
    <input type="text" class="edit-input" value="${f.name}" placeholder="Название" style="flex:1;">
    <div class="list-item-actions">
      <button class="list-item-btn save" onclick="saveFaction('${key}',this)">✓</button>
      <button class="list-item-del" onclick="renderFacList()">✕</button>
    </div>`;
}
function saveFaction(key,btn){
  const inputs=btn.closest('.list-item').querySelectorAll('input');
  factions[key]={name:inputs[4].value.trim()||key,color:inputs[0].value,strokeColor:inputs[1].value,labelColor:inputs[2].value};
  DB.set('zv_factions',factions);renderFacList();showToast(`Фракция "${key}" обновлена`);
  if(data){buildKills();buildStats();buildRoster();render();}
}
function addFaction(){
  const key=document.getElementById('fac-key-in').value.trim();
  const name=document.getElementById('fac-name-in').value.trim();
  const color=document.getElementById('fac-color-in').value;
  if(!key){showToast('Введите ключ','#550000');return;}
  factions[key]={name:name||key,color,strokeColor:color,labelColor:color};
  DB.set('zv_factions',factions);renderFacList();showToast(`Фракция "${key}" добавлена`);
  document.getElementById('fac-key-in').value='';document.getElementById('fac-name-in').value='';
}
function deleteFaction(key){delete factions[key];DB.set('zv_factions',factions);renderFacList();if(data){buildKills();buildStats();buildRoster();}}

// ── Оружие ────────────────────────────────────────────────────
const WP_DEF={'#AR-Weapon_M16A2_Name':'M16A2','#AR-Weapon_M249_Name':'M249','#AR-Weapon_VZ58P_Name':'VZ-58P','#AR-Weapon_VZ58V_Name':'VZ-58V','#AR-Weapon_VZ58_Name':'VZ-58','#AR-Weapon_SVD_Name':'SVD','#AR-Weapon_AKS74U_Name':'AKS-74U','#AR-Weapon_AK74_Name':'AK-74','#AR-Weapon_RPG7_Name':'RPG-7','#AR-Weapon_M72_Name':'M72 LAW','#AR-Weapon_M2_Name':'M2','#AR-Weapon_PKM_Name':'PKM','#AR-Weapon_Pistol_M9_Name':'M9','#AR-Weapon_Pistol_TT_Name':'TT-33'};
let weapons=DB.get('zv_weapons',WP_DEF);
function wpName(raw){if(!raw||raw==='Unknown')return null;if(weapons[raw])return weapons[raw];const m=raw.match(/#AR-Weapon_(.+?)_Name/);if(m)return m[1].replace(/_/g,' ');return raw;}
function renderWpList(){const el=document.getElementById('wp-list');el.innerHTML='';Object.entries(weapons).forEach(([k,name])=>{const item=document.createElement('div');item.className='list-item';item.dataset.key=k;item.innerHTML=`<span class="list-item-wpkey" title="${k}">${k}</span><span class="list-item-wpname">→ ${name}</span><div class="list-item-actions"><button class="list-item-btn" onclick="editWeapon(this)">✎</button><button class="list-item-del" onclick="deleteWeapon(this)">✕</button></div>`;el.appendChild(item);});}
function editWeapon(btn){const item=btn.closest('.list-item'),key=item.dataset.key,name=weapons[key];item.innerHTML=`<input type="text" class="edit-input" value="${key}" style="flex:1;font-size:8px;"><input type="text" class="edit-input" value="${name}" style="width:85px;"><div class="list-item-actions"><button class="list-item-btn save" onclick="saveWeapon(this,'${key.replace(/'/g,"\\'")}')">✓</button><button class="list-item-del" onclick="renderWpList()">✕</button></div>`;}
function saveWeapon(btn,oldKey){const inputs=btn.closest('.list-item').querySelectorAll('input');const nk=inputs[0].value.trim(),nn=inputs[1].value.trim();if(!nk||!nn){showToast('Заполните оба поля','#550000');return;}if(nk!==oldKey)delete weapons[oldKey];weapons[nk]=nn;DB.set('zv_weapons',weapons);renderWpList();showToast(`Оружие: ${nn}`);}
function addWeapon(){const key=document.getElementById('wp-key-in').value.trim();const name=document.getElementById('wp-name-in').value.trim();if(!key||!name){showToast('Заполните оба поля','#550000');return;}weapons[key]=name;DB.set('zv_weapons',weapons);renderWpList();showToast(`Оружие "${name}" добавлено`);document.getElementById('wp-key-in').value='';document.getElementById('wp-name-in').value='';}
function deleteWeapon(btn){const key=btn.closest('.list-item').dataset.key;delete weapons[key];DB.set('zv_weapons',weapons);renderWpList();}

// ── Техника ───────────────────────────────────────────────────
const VEH_DEF={'#AR-Vehicle_M923A1_Engineer_Name':'M923A1','#AR-Vehicle_M923A1_Name':'M923A1','#AR-Vehicle_UH1H_Gunship_Name_HEDP':'UH-1H Gunship','#AR-Vehicle_UH1H_Name':'UH-1H','#AR-Vehicle_LAV25_Name':'LAV-25','#AR-Vehicle_BTR70_Name':'BTR-70','#AR-Vehicle_Skoda105_Name':'Škoda 105','#AR-Vehicle_M1025_Name':'M1025','#AR-Vehicle_UAZ469_Name':'UAZ-469','#AR-Vehicle_T72_Name':'T-72','#AR-Vehicle_M113_Name':'M113','#AR-Vehicle_BMP1_Name':'BMP-1'};
let vehicles=DB.get('zv_vehicles',VEH_DEF);
function vehName(raw){
  if(!raw)return null;
  if(raw.includes(' | '))return raw;
  if(raw==='Turret')return null;
  if(vehicles[raw])return vehicles[raw];
  const m=raw.match(/#AR-Vehicle_([^_]+)/);
  if(m)return m[1];
  return raw;
}
const VEH_COLORS_DEF={fillColor:'#1a2a3a',strokeColor:'#4a8aaa',labelColor:'#a0c8d8',destroyedColor:'#3a2a1a',hpTextColor:'#e0e0b0'};
let vehColors=DB.get('zv_veh_colors',VEH_COLORS_DEF);
function getVehColors(){return vehColors;}
function renderVehList(){const el=document.getElementById('veh-list');if(!el)return;el.innerHTML='';Object.entries(vehicles).forEach(([k,name])=>{const item=document.createElement('div');item.className='list-item';item.dataset.key=k;item.innerHTML=`<span class="list-item-wpkey" title="${k}">${k}</span><span class="list-item-wpname">→ ${name}</span><div class="list-item-actions"><button class="list-item-btn" onclick="editVehicle(this)">✎</button><button class="list-item-del" onclick="deleteVehicle(this)">✕</button></div>`;el.appendChild(item);});}
function editVehicle(btn){const item=btn.closest('.list-item'),key=item.dataset.key,name=vehicles[key];item.innerHTML=`<input type="text" class="edit-input" value="${key}" style="flex:1;font-size:8px;"><input type="text" class="edit-input" value="${name}" style="width:85px;"><div class="list-item-actions"><button class="list-item-btn save" onclick="saveVehicle(this,'${key.replace(/'/g,"\\'")}')">✓</button><button class="list-item-del" onclick="renderVehList()">✕</button></div>`;}
function saveVehicle(btn,oldKey){const inputs=btn.closest('.list-item').querySelectorAll('input');const nk=inputs[0].value.trim(),nn=inputs[1].value.trim();if(!nk||!nn){showToast('Заполните оба поля','#550000');return;}if(nk!==oldKey)delete vehicles[oldKey];vehicles[nk]=nn;DB.set('zv_vehicles',vehicles);renderVehList();showToast(`Техника: ${nn}`);}
function addVehicle(){const key=document.getElementById('veh-key-in').value.trim();const name=document.getElementById('veh-name-in').value.trim();if(!key||!name){showToast('Заполните оба поля','#550000');return;}vehicles[key]=name;DB.set('zv_vehicles',vehicles);renderVehList();showToast(`Техника "${name}" добавлена`);document.getElementById('veh-key-in').value='';document.getElementById('veh-name-in').value='';}
function deleteVehicle(btn){const key=btn.closest('.list-item').dataset.key;delete vehicles[key];DB.set('zv_vehicles',vehicles);renderVehList();}
function loadVehColors(){const c=getVehColors();[['vc-fill','fillColor'],['vc-stroke','strokeColor'],['vc-label','labelColor'],['vc-destroyed','destroyedColor'],['vc-hp-text','hpTextColor']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.value=c[k]||'#ffffff';});}
function saveVehColors(){[['vc-fill','fillColor'],['vc-stroke','strokeColor'],['vc-label','labelColor'],['vc-destroyed','destroyedColor'],['vc-hp-text','hpTextColor']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)vehColors[k]=el.value;});DB.set('zv_veh_colors',vehColors);render();showToast('Цвета техники сохранены');}

// ── Карты ─────────────────────────────────────────────────────
let mapsDef=DB.get('zv_maps',{everon:{label:'Everon (13 km)',size:13000},arland:{label:'Arland (4 km)',size:4096}});
let mapImages=DB.get('zv_map_images',{});
function handleMapUpload(input){const file=input.files[0];if(!file)return;const key=document.getElementById('map-key-in').value.trim();const label=document.getElementById('map-label-in').value.trim();const size=parseInt(document.getElementById('map-size-in').value)||13000;if(!key){showToast('Введите ключ','#550000');return;}const status=document.getElementById('map-upload-status');status.textContent='Загрузка...';const reader=new FileReader();reader.onload=ev=>{mapImages[key]=ev.target.result;mapsDef[key]={label:label||key,size};DB.set('zv_map_images',mapImages);DB.set('zv_maps',mapsDef);renderMapsList();rebuildMapSelect();status.textContent=`✓ "${key}"`;status.style.color='#5a9a5a';showToast(`Карта "${key}" добавлена`);};reader.readAsDataURL(file);}
function deleteMap(key){if(key==='everon'||key==='arland'){showToast('Базовые нельзя удалить','#550000');return;}delete mapImages[key];delete mapsDef[key];DB.set('zv_map_images',mapImages);DB.set('zv_maps',mapsDef);renderMapsList();rebuildMapSelect();}
function renderMapsList(){const el=document.getElementById('maps-list');el.innerHTML='';Object.entries(mapsDef).forEach(([k,m])=>{el.innerHTML+=`<div class="list-item"><span class="list-item-key">${k}</span><span class="list-item-name">${m.label} · ${m.size}м</span>${mapImages[k]?'<span style="color:#5a9a5a;font-size:8px;font-family:var(--mono);">CUSTOM</span>':''}<button class="list-item-del" onclick="deleteMap('${k}')">✕</button></div>`;});}
function rebuildMapSelect(){const sel=document.getElementById('map-select'),cur=sel.value;sel.innerHTML='';Object.entries(mapsDef).forEach(([k,m])=>{const opt=document.createElement('option');opt.value=k;opt.textContent=m.label;if(k===cur)opt.selected=true;sel.appendChild(opt);});}

// ── Settings ──────────────────────────────────────────────────
function openSettings(){loadDisplayOpts();loadVehColors();renderFacList();renderWpList();renderVehList();renderMapsList();document.getElementById('settings-overlay').classList.add('open');}
function closeSettings(){saveDisplayOpts();document.getElementById('settings-overlay').classList.remove('open');if(data){render();buildKills();buildStats();buildRoster();}}
document.querySelectorAll('.stab').forEach(tab=>{tab.onclick=()=>{document.querySelectorAll('.stab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.stab-content').forEach(c=>c.classList.remove('active'));tab.classList.add('active');document.getElementById('stab-'+tab.dataset.stab).classList.add('active');};});

// ── Leaflet ───────────────────────────────────────────────────
let mapKey='everon',leafletMap,tileLayer,roadsLayer,markersGroup,tracksGroup,shotsGroup,killsGroup;
const roadsCache={};
function initLeaflet(){leafletMap=L.map('leaflet-map',{crs:L.CRS.Simple,minZoom:-4,maxZoom:4,zoomSnap:0.5,attributionControl:false});markersGroup=L.layerGroup().addTo(leafletMap);tracksGroup=L.layerGroup().addTo(leafletMap);shotsGroup=L.layerGroup().addTo(leafletMap);killsGroup=L.layerGroup().addTo(leafletMap);setMapTile(mapKey);loadRoads(mapKey);}
function getMapSrc(k){return mapImages[k]||`maps/${k}.jpg`;}
function setMapTile(k){if(tileLayer)leafletMap.removeLayer(tileLayer);const m=mapsDef[k]||{size:13000},b=[[0,0],[m.size,m.size]];tileLayer=L.imageOverlay(getMapSrc(k),b,{opacity:0.88}).addTo(leafletMap);if(!data)leafletMap.fitBounds(b);}
async function loadRoads(k){if(roadsLayer){leafletMap.removeLayer(roadsLayer);roadsLayer=null;}if(roadsCache[k]!==undefined){if(roadsCache[k])drawRoads(roadsCache[k]);return;}try{const res=await fetch(`maps/${k}_roads.json`);if(!res.ok)throw new Error();const json=await res.json();roadsCache[k]=json.roads;drawRoads(json.roads);}catch(e){roadsCache[k]=null;}}
function drawRoads(roads){if(roadsLayer){leafletMap.removeLayer(roadsLayer);roadsLayer=null;}if(!roads)return;roadsLayer=L.polyline(roads.map(r=>r.map(([x,z])=>L.latLng(z,x))),{color:'rgba(90,75,40,0.35)',weight:1,interactive:false}).addTo(leafletMap);}
function wll(x,z){return L.latLng(z,x);}
document.getElementById('map-select').onchange=function(){mapKey=this.value;setMapTile(mapKey);loadRoads(mapKey);if(data)centerMap();};

// ── Hot Reload ────────────────────────────────────────────────
(function(){function connect(){const ws=new WebSocket(`ws://${location.host}`);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='reload')location.reload();else if(m.type==='new_replay'){showToast(`Новый реплей: ${m.name}`);if(mode==='server')loadReplayList();}};ws.onclose=()=>setTimeout(connect,2000);ws.onerror=()=>ws.close();}if(location.protocol!=='file:')connect();})();

function showToast(text,color){let t=document.getElementById('zv-toast');if(!t){t=document.createElement('div');t.id='zv-toast';t.style.cssText='position:fixed;bottom:28px;right:10px;color:#c8d8c0;padding:5px 11px;font-family:var(--mono);font-size:10px;z-index:9999;opacity:0;transition:opacity .25s;pointer-events:none;border:1px solid #1a3a1a;background:#050e05;';document.body.appendChild(t);}t.style.background=color||'#050e05';t.textContent=text;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';},2800);}

// ── JSON repair ───────────────────────────────────────────────
function parseReplayJSON(text){try{return JSON.parse(text);}catch(e){return repairReplayJSON(text);}}
function repairReplayJSON(text){const lines=text.split('\n'),r={meta:{},frames:[],kills:[],shots:[],stats:[]};for(const line of lines){const l=line.trim();if(!l||l==='{'||l==='}')continue;for(const k of['meta','kills','shots','stats']){if(l.startsWith(`"${k}":`)){try{const s=l.endsWith(',')?l.slice(0,-1):l;r[k]=JSON.parse('{'+s+'}')[k]||(Array.isArray(r[k])?[]:{});}catch(e){}break;}}if(l.startsWith('"frames":'))r.frames=repairFrames(l);}return r;}
function repairFrames(line){let content=line.replace(/^"frames":\[/,'').replace(/\],?$/,'');const frames=[];let pos=0;while(pos<content.length){while(pos<content.length&&content[pos]===',')pos++;if(pos>=content.length||content[pos]!=='{')break;let depth=0,end=pos;for(let i=pos;i<content.length;i++){const c=content[i];if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(depth===0){end=i;break;}}}const chunk=content.slice(pos,end+1);try{const f=JSON.parse(chunk);if(typeof f.t==='number'&&Array.isArray(f.e)){f.e=f.e.filter(e=>typeof e.id==='number'&&typeof e.x==='number'&&typeof e.z==='number');frames.push(f);}pos=end+1;}catch(e){const next=content.indexOf(',{"t":',pos);if(next===-1)break;pos=next+1;}}return frames;}

// ── Предварительный индекс оружия ────────────────────────────
// Строим Map: имя_entity → последнее оружие на каждый момент
// Это O(n) при загрузке, зато O(1) при рендере каждого фрейма
let weaponIndex = null; // Map<name, sorted [{t, wp}]>

function buildWeaponIndex(){
  if(!data?.shots?.length){weaponIndex=new Map();return;}
  const idx=new Map();
  for(const s of data.shots){
    if(!idx.has(s.sh))idx.set(s.sh,[]);
    idx.get(s.sh).push({t:s.t,wp:wpName(s.wp)});
  }
  weaponIndex=idx;
}

// Быстрый поиск оружия бота/игрока на момент t
function getLastWeapon(name){
  if(!weaponIndex)return null;
  const shots=weaponIndex.get(name);
  if(!shots||!shots.length)return null;
  // shots уже отсортированы по t (порядок записи)
  // бинарный поиск последнего shot.t <= playTime
  let lo=0,hi=shots.length-1,res=null;
  while(lo<=hi){
    const mid=(lo+hi)>>1;
    if(shots[mid].t<=playTime){res=shots[mid].wp;lo=mid+1;}
    else hi=mid-1;
  }
  return res;
}

// ── Mode & File ───────────────────────────────────────────────
let mode='file',data=null;
const dropzone=document.getElementById('dropzone'),rlWrap=document.getElementById('replay-list-wrap');
document.querySelectorAll('.mode-tab').forEach(tab=>{tab.onclick=()=>{document.querySelectorAll('.mode-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');mode=tab.dataset.mode;if(mode==='server'){if(!data){dropzone.classList.add('hidden');rlWrap.classList.add('visible');}else rlWrap.classList.add('visible');loadReplayList();}else{rlWrap.classList.remove('visible');if(!data)dropzone.classList.remove('hidden');}};});
function bindFile(el){el.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;readFile(f);e.target.value='';});}
bindFile(document.getElementById('file-input'));bindFile(document.getElementById('file-input-dz'));
function readFile(f){const r=new FileReader();r.onload=ev=>loadReplay(ev.target.result,f.name);r.readAsText(f);}
document.getElementById('map-wrap').addEventListener('dragover',e=>e.preventDefault());
document.getElementById('map-wrap').addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&f.name.endsWith('.json'))readFile(f);});

async function loadReplayList(){
  const listEl=document.getElementById('replay-list'),dirEl=document.getElementById('rl-dir');
  listEl.innerHTML='<div style="padding:12px;color:var(--muted);font-family:var(--mono);font-size:9px;">// загрузка...</div>';
  try{const res=await fetch('/api/replays'),json=await res.json();dirEl.textContent=json.dir||'';if(!json.files?.length){listEl.innerHTML=`<div style="padding:12px;color:var(--muted);font-family:var(--mono);font-size:9px;">// нет реплеев<br><span style="color:var(--accent-dim)">${json.dir||'./replay'}</span></div>`;return;}listEl.innerHTML='';json.files.forEach(f=>{const d=new Date(f.mtime).toLocaleString('ru'),sz=(f.size/1024).toFixed(1)+' KB';const el=document.createElement('div');el.className='rl-item';el.innerHTML=`<div class="ri-name">${f.name}</div><div class="ri-meta">${d} · ${sz}</div>`;el.onclick=async()=>{try{const r=await fetch(`/api/replay/${encodeURIComponent(f.name)}`);loadReplay(await r.text(),f.name);rlWrap.classList.remove('visible');}catch(e){showToast('Ошибка: '+e.message,'#550000');}};listEl.appendChild(el);});}
  catch(e){listEl.innerHTML='<div style="padding:12px;color:var(--accent2);font-family:var(--mono);font-size:9px;">// сервер недоступен</div>';}
}

function loadReplay(text,name){
  data=parseReplayJSON(text);
  if(!data.meta)data.meta={};if(!data.kills)data.kills=[];if(!data.stats)data.stats=[];if(!data.frames)data.frames=[];if(!data.shots)data.shots=[];
  if(!data.meta.duration)data.meta.duration=data.frames.length?data.frames[data.frames.length-1].t:0;

  // Строим индекс оружия один раз при загрузке
  buildWeaponIndex();

  playTime=0;playing=false;document.getElementById('btn-play').textContent='▶';document.getElementById('btn-play').classList.remove('active');
  dropzone.classList.add('hidden');rlWrap.classList.remove('visible');document.getElementById('rl-title').textContent=name||'';
  centerMap();buildTimeline();buildKills();buildStats();buildRoster();buildMeta(name);render();updateTime();
  showToast(`✓ ${name}`);
}
function centerMap(){if(!data?.frames?.length)return;const ents=data.frames[0].e;if(!ents.length)return;const g=L.featureGroup(ents.map(e=>L.circleMarker(wll(e.x,e.z))));leafletMap.fitBounds(g.getBounds().pad(0.15));}

// ── Transport ─────────────────────────────────────────────────
let playing=false,playTime=0,speed=10,lastTs=null,rafId=null;
const SPEEDS=[1,2,4,5,8,10,15,20,30,50,100];let speedIdx=SPEEDS.indexOf(10);
function updateSpeedDisplay(){document.getElementById('speed-val').textContent=SPEEDS[speedIdx]+'×';speed=SPEEDS[speedIdx];}
document.getElementById('speed-dec').onclick=()=>{if(speedIdx>0){speedIdx--;updateSpeedDisplay();}};
document.getElementById('speed-inc').onclick=()=>{if(speedIdx<SPEEDS.length-1){speedIdx++;updateSpeedDisplay();}};
document.getElementById('btn-play').onclick=()=>{if(!data)return;playing=!playing;document.getElementById('btn-play').textContent=playing?'⏸':'▶';document.getElementById('btn-play').classList.toggle('active',playing);if(playing){lastTs=null;if(!rafId)rafId=requestAnimationFrame(loop);}};
document.getElementById('btn-reset').onclick=()=>{playing=false;playTime=0;document.getElementById('btn-play').textContent='▶';document.getElementById('btn-play').classList.remove('active');render();updateTime();};
document.getElementById('timeline').oninput=function(){if(!data)return;playTime=(this.value/1000)*data.meta.duration;render();updateTime();hlKill();};
window.addEventListener('keydown',e=>{if(document.getElementById('settings-overlay').classList.contains('open'))return;if(e.target.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();document.getElementById('btn-play').click();}if(!data)return;if(e.code==='ArrowLeft'){playTime=Math.max(0,playTime-10);render();updateTime();}if(e.code==='ArrowRight'){playTime=Math.min(data.meta.duration,playTime+10);render();updateTime();}if(e.code==='ArrowUp'&&speedIdx<SPEEDS.length-1){speedIdx++;updateSpeedDisplay();}if(e.code==='ArrowDown'&&speedIdx>0){speedIdx--;updateSpeedDisplay();}});
function loop(ts){rafId=null;if(!playing||!data)return;if(lastTs!==null){playTime+=((ts-lastTs)/1000)*speed;if(playTime>=data.meta.duration){playTime=data.meta.duration;playing=false;document.getElementById('btn-play').textContent='▶';document.getElementById('btn-play').classList.remove('active');}}lastTs=ts;render();updateTime();hlKill();if(playing)rafId=requestAnimationFrame(loop);}
function updateTime(){if(!data)return;document.getElementById('timeline').value=data.meta.duration>0?(playTime/data.meta.duration)*1000:0;document.getElementById('time-display').textContent=fmt(playTime)+' / '+fmt(data.meta.duration);}
function fmt(s){s=Math.max(0,s);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');}

// ── Render ────────────────────────────────────────────────────
function render(){
  if(!data)return;
  markersGroup.clearLayers();tracksGroup.clearLayers();shotsGroup.clearLayers();killsGroup.clearLayers();
  if(dispOpts.tracks)drawTracks();
  if(dispOpts.shots)drawShots();
  if(dispOpts.killMarkers)drawKillMarkers();
  const frame=getFrame(playTime);if(!frame)return;
  const vehPos=new Set();
  frame.e.forEach(s=>{if(s.t>0&&!s.n?.includes(' | Turret'))vehPos.add(`${Math.round(s.x)},${Math.round(s.z)}`);});
  frame.e.forEach(s=>{
    if(s.n==='Turret'&&vehPos.has(`${Math.round(s.x)},${Math.round(s.z)}`))return;
    drawEntity(s);
  });
}

function getFrame(t){if(!data?.frames?.length)return null;let lo=0,hi=data.frames.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(data.frames[mid].t<=t)lo=mid;else hi=mid-1;}return data.frames[lo];}

function drawTracks(){
  const TRAIL=20,tMin=playTime-TRAIL,tracks={};
  for(const f of data.frames){if(f.t<tMin)continue;if(f.t>playTime)break;f.e.forEach(s=>{if(!tracks[s.id])tracks[s.id]={fac:s.fac,isVeh:s.t>0,pts:[]};tracks[s.id].pts.push(wll(s.x,s.z));});}
  Object.values(tracks).forEach(tr=>{if(tr.pts.length<2)return;const col=facCSS(tr.fac);L.polyline(tr.pts,{color:col,opacity:tr.isVeh?0.5:0.3,weight:tr.isVeh?2:1,dashArray:tr.isVeh?null:'3,4',interactive:false}).addTo(tracksGroup);});
}

function drawShots(){
  if(!data.shots?.length)return;const FADE=0.5;
  for(const s of data.shots){if(s.t>playTime)break;const age=playTime-s.t;if(age>FADE)continue;const alpha=1-age/FADE,yaw=(s.yaw||0)*Math.PI/180,LINE_M=65;const x2=s.x+Math.sin(yaw)*LINE_M,z2=s.z+Math.cos(yaw)*LINE_M;
    L.polyline([wll(s.x,s.z),wll(x2,z2)],{color:s.bot?`rgba(180,160,70,${alpha})`:`rgba(240,220,100,${alpha})`,weight:s.bot?1:1.8,interactive:false}).addTo(shotsGroup);
    L.circleMarker(wll(s.x,s.z),{radius:2.5,color:'transparent',fillColor:s.bot?`rgba(180,160,70,${alpha})`:`rgba(240,220,100,${alpha})`,fillOpacity:alpha,interactive:false}).addTo(shotsGroup);}
}

function drawKillMarkers(){
  if(!data.kills)return;
  data.kills.forEach(k=>{if(k.t>playTime)return;const age=playTime-k.t;if(age>60)return;const alpha=Math.max(0.12,1-age/60),col=k.tk?'#c8a800':'#c82020',r=7;
    const wp=wpName(k.wp)||'?';
    const icon=L.divIcon({html:`<svg width="${r*2}" height="${r*2}" viewBox="-${r} -${r} ${r*2} ${r*2}"><line x1="-${r*.7}" y1="-${r*.7}" x2="${r*.7}" y2="${r*.7}" stroke="${col}" stroke-width="2.2" stroke-opacity="${alpha}"/><line x1="${r*.7}" y1="-${r*.7}" x2="-${r*.7}" y2="${r*.7}" stroke="${col}" stroke-width="2.2" stroke-opacity="${alpha}"/></svg>`,className:'',iconSize:[r*2,r*2],iconAnchor:[r,r]});
    L.marker(wll(k.x,k.z),{icon,zIndexOffset:100}).bindTooltip(`<b style="color:${col}">${k.kr||'AI'}</b> → <b>${k.vi||'?'}</b><br><span style="color:#8a9a80;font-size:10px">🔫 ${wp} · ${fmt(k.t)}${k.tk?' [TK]':''}</span>`,{permanent:false,direction:'top',className:'zv-tip'}).on('click',()=>{playTime=k.t;render();updateTime();hlKill();}).addTo(killsGroup);
  });
}

function drawEntity(s){
  const isVeh=s.t>0,isBot=s.bot===true,isDead=!s.a;

  if(isDead&&!isVeh){
    const icon=L.divIcon({html:`<svg width="8" height="8" viewBox="-4 -4 8 8"><line x1="-3" y1="-3" x2="3" y2="3" stroke="#3a2a2a" stroke-width="1.5"/><line x1="3" y1="-3" x2="-3" y2="3" stroke="#3a2a2a" stroke-width="1.5"/></svg>`,className:'',iconSize:[8,8],iconAnchor:[4,4]});
    L.marker(wll(s.x,s.z),{icon,interactive:false}).addTo(markersGroup);return;
  }

  // ── Техника ────────────────────────────────────────────────
  if(isVeh){
    const vc=getVehColors();
    const displayName=vehName(s.n)||s.n||'';
    const hp=s.hp??1.0,alive=hp>0;
    const hpPct=Math.round((hp??1)*100);
    const hpBarCol=hp<=0?'#6a1a1a':hp<0.33?'#8a4a0a':hp<0.66?'#7a6a00':'#1a6a2a';
    const fillCol=alive?vc.fillColor:vc.destroyedColor;
    const strokeCol=alive?vc.strokeColor:'#4a3a1a';
    const fillO=alive?0.92:0.45;
    const W=20,H=18,TH=H+4;
    const html=`<div style="position:relative;width:${W}px;height:${TH}px;transform:rotate(${s.yaw||0}deg);transform-origin:${W/2}px ${H/2}px;">
      <svg width="${W}" height="${TH}" viewBox="0 0 ${W} ${TH}">
        <rect x="1" y="4" width="${W-2}" height="${H-4}" rx="2" fill="${fillCol}" fill-opacity="${fillO}" stroke="${strokeCol}" stroke-width="2"/>
        <polygon points="${W/2},0 ${W/2-5},7 ${W/2+5},7" fill="${alive?strokeCol:'#5a3a1a'}" fill-opacity="0.9"/>
      </svg>
      <div style="position:absolute;bottom:0;left:2px;right:2px;height:3px;background:rgba(0,0,0,.6);border-radius:1px;">
        <div style="height:3px;width:${hpPct}%;background:${hpBarCol};border-radius:1px;max-width:100%;"></div>
      </div>
    </div>`;
    const icon=L.divIcon({html,className:'',iconSize:[W,TH],iconAnchor:[W/2,H/2]});
    const m=L.marker(wll(s.x,s.z),{icon,zIndexOffset:50});
    m.bindTooltip(`<b style="color:${vc.labelColor}">${displayName||s.n}</b><br><span style="color:${vc.hpTextColor||'#e0e0b0'};font-size:10px">HP ${hpPct}%${!alive?' · уничтожена':''}</span>`,{permanent:false,direction:'top',className:'zv-tip'});
    if(displayName){
      const nameIcon=L.divIcon({html:`<div style="position:absolute;top:${TH/2+5}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:var(--sans);font-size:10px;font-weight:700;color:${alive?vc.labelColor:'#5a4a3a'};text-shadow:0 1px 4px #000,0 0 8px rgba(0,0,0,.9);pointer-events:none;">${displayName}</div>`,className:'',iconSize:[0,0],iconAnchor:[0,0]});
      L.marker(wll(s.x,s.z),{icon:nameIcon,interactive:false,zIndexOffset:48}).addTo(markersGroup);
    }
    m.addTo(markersGroup);return;
  }

  // ── Пехота ────────────────────────────────────────────────
  const r=isBot?4:6;
  const yaw=(s.yaw||0)*Math.PI/180;

  // FIX 1: Цвет бота — по фракции или единый (из настроек)
  const fillCol=isBot?getBotFillColor(s.fac):facCSS(s.fac);
  const strokeCol=isBot?getBotStrokeColor(s.fac):facStrokeColor(s.fac)||facCSS(s.fac);
  const fillO=isBot?0.65:0.85;
  const strokeW=isBot?1:1.8;
  const dash=isBot?'stroke-dasharray="3,2"':'';
  const ax=Math.sin(yaw)*(r+4),ay=-Math.cos(yaw)*(r+4);
  const sz=(r+8)*2,cx=sz/2,cy=sz/2;

  const html=`<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillCol}" fill-opacity="${fillO}" stroke="${strokeCol}" stroke-width="${strokeW}" ${dash}/>
    <line x1="${cx}" y1="${cy}" x2="${cx+ax}" y2="${cy+ay}" stroke="${strokeCol}" stroke-width="${strokeW}" stroke-linecap="round"/>
  </svg>`;

  const icon=L.divIcon({html,className:'',iconSize:[sz,sz],iconAnchor:[cx,cy]});
  const m=L.marker(wll(s.x,s.z),{icon,zIndexOffset:isBot?0:200});

  // ── Никнейм ───────────────────────────────────────────────
  const showNick=dispOpts.nicknames&&(!isBot||dispOpts.botNicknames);
  if(showNick&&s.n){
    // FIX 2: цвет ника бота тоже берём от фракции если включено
    const labelCol=isBot
      ?(dispOpts.botUseFactionColor!==false?facLabelColor(s.fac)||getBotColor():getBotColor())
      :facLabelColor(s.fac)||'#d0e8d0';

    let namePart=s.n;
    if(dispOpts.factionPrefix){const fk=facKey(s.fac);if(fk&&fk!=='?')namePart=fk+' | '+namePart;}

    // FIX 3: оружие из индекса (O(log n) вместо O(n))
    const lastWp=dispOpts.weaponLabel?getLastWeapon(s.n):null;
    const wpLine=lastWp?`<div style="color:#c8b860;font-size:9px;font-family:var(--mono);margin-top:1px;">⚙ ${lastWp}</div>`:'';

    const bgOp=dispOpts.nicknameBgOpacity??0;
    const bgStyle=bgOp>0?`background:rgba(2,6,2,${bgOp});padding:2px 5px;border-radius:2px;`:'';
    const permanent=!isBot&&(dispOpts.nicknameAlways!==false);

    const tooltipHTML=`<div style="text-align:center;color:${labelCol};font-weight:700;font-size:11px;${bgStyle}text-shadow:0 1px 4px #000,0 0 8px rgba(0,0,0,.9);">${namePart}${wpLine}</div>`;
    m.bindTooltip(tooltipHTML,{permanent,direction:'top',offset:[0,-r-2],className:'zv-lbl'});
    if(permanent){m.on('add',()=>{const el=m.getTooltip()?.getElement?.();if(el)el.style.color=labelCol;});}
  }
  m.addTo(markersGroup);
}

// ── Timeline ──────────────────────────────────────────────────
function buildTimeline(){
  const wrap=document.getElementById('tl-markers-wrap');
  [...wrap.children].forEach(c=>{if(c.id!=='timeline')c.remove();});
  if(!data.kills?.length||!data.meta.duration)return;
  data.kills.forEach(k=>{const el=document.createElement('div');el.className='tl-mark';el.style.left=(k.t/data.meta.duration*100)+'%';el.style.background=k.tk?'#888800':'#880000';el.title=`${fmt(k.t)} ${k.kr||'AI'} → ${k.vi||'?'}`;el.onclick=()=>{playTime=k.t;render();updateTime();hlKill();};wrap.appendChild(el);});
}

function buildKills(){
  const el=document.getElementById('tab-kills');
  if(!data.kills?.length){el.innerHTML='<div style="padding:12px;color:var(--muted);font-family:var(--mono);font-size:9px;">// убийств нет</div>';return;}
  el.innerHTML=`<div style="padding:4px 9px;font-family:var(--mono);font-size:9px;color:var(--muted);border-bottom:1px solid var(--border);">всего: ${data.kills.length}</div>`;
  data.kills.forEach((k,i)=>{
    const row=document.createElement('div');row.className='kill-row';row.dataset.i=i;
    const kCol=facLabelColor(k.kfac)||'#b0c0a8',vCol=facLabelColor(k.vfac)||'#b0c0a8';
    const tkB=k.tk?'<span style="color:#c8a800;font-size:8px;">[TK]</span>':'';
    const vB=k.vbot?'<span style="color:#3a4a38;font-size:8px;">[AI]</span>':'';
    const kB=k.kbot?'<span style="color:#3a4a38;font-size:8px;">[AI]</span>':'';
    const wpD=wpName(k.wp);
    const wpB=wpD?`<span class="kw-badge${!k.kbot?' player':''}" title="${k.wp||''}">⚙ ${wpD}</span>`:'';
    row.innerHTML=`<span class="kill-t">${fmt(k.t)}</span><span style="color:${kCol};font-weight:600;">${k.kr||'AI'}${kB}</span><span class="kill-arr">›</span><span style="color:${vCol};">${k.vi||'?'}${vB}</span>${tkB}${wpB}`;
    row.onclick=()=>{playTime=k.t;leafletMap.setView(wll(k.x,k.z),leafletMap.getZoom());render();updateTime();hlKill();};
    el.appendChild(row);
  });
}
function hlKill(){if(!data?.kills)return;document.querySelectorAll('.kill-row').forEach(r=>{const k=data.kills[+r.dataset.i];const age=playTime-k.t;r.classList.toggle('hl',age>=0&&age<4);});}

function buildRoster(){
  const el=document.getElementById('tab-roster');if(!el)return;
  if(!data){el.innerHTML='<div style="padding:12px;color:var(--muted);font-family:var(--mono);font-size:9px;">// загрузите реплей</div>';return;}
  const players=new Map();
  data.stats?.forEach(s=>{players.set(s.name,{fac:s.fac,kills:s.kills||0,deaths:s.deaths||0,tk:s.tk||0,dist:s.dist||0,isBot:false});});
  data.frames[0]?.e?.forEach(e=>{if(e.t>0)return;if(!players.has(e.n))players.set(e.n,{fac:e.fac,kills:0,deaths:0,tk:0,dist:0,isBot:e.bot===true});});
  const byFac=new Map();
  players.forEach((p,name)=>{const fk=facKey(p.fac)||'?';if(!byFac.has(fk))byFac.set(fk,[]);byFac.get(fk).push({name,...p});});
  let html='';
  byFac.forEach((members)=>{
    const fCol=facLabelColor(members[0].fac)||facCSS(members[0].fac);
    const fLbl=facName(members[0].fac);
    const pl=members.filter(m=>!m.isBot),bots=members.filter(m=>m.isBot);
    html+=`<div class="roster-faction" style="border-left:2px solid ${facStrokeColor(members[0].fac)||fCol};">
      <div class="roster-faction-header" style="color:${fCol};">${fLbl} <span style="color:var(--muted);font-weight:400;">(${members.length})</span></div>`;
    pl.forEach(p=>{const lc=facLabelColor(p.fac)||fCol;const kd=p.deaths>0?(p.kills/p.deaths).toFixed(1):(p.kills>0?'∞':'—');const dist=p.dist?(p.dist/1000).toFixed(1):'—';
      html+=`<div class="roster-row"><span class="roster-name" style="color:${lc}">● ${p.name}</span><span class="roster-stat"><span style="color:#5aaa5a">${p.kills}K</span> <span style="color:#aa5a5a">${p.deaths}D</span> <span style="color:var(--muted)">${kd}·${dist}km</span></span></div>`;
    });
    if(bots.length)html+=`<div class="roster-bots">AI: ${bots.length}</div>`;
    html+=`</div>`;
  });
  el.innerHTML=html||'<div style="padding:12px;color:var(--muted);font-family:var(--mono);font-size:9px;">// нет данных</div>';
}

function buildStats(){
  const el=document.getElementById('tab-stats');
  if(!data.stats?.length){el.innerHTML='<div style="padding:12px;color:var(--muted);font-family:var(--mono);font-size:9px;">// нет данных</div>';return;}
  const sorted=[...data.stats].sort((a,b)=>(b.kills||0)-(a.kills||0));
  el.innerHTML='';const tbl=document.createElement('table');tbl.className='stats-tbl';
  tbl.innerHTML='<thead><tr><th>ИГРОК</th><th>ФРК</th><th>K</th><th>D</th><th>TK</th><th>K/D</th><th>KM</th></tr></thead>';
  const tbody=document.createElement('tbody');
  sorted.forEach(s=>{const kd=s.deaths>0?(s.kills/s.deaths).toFixed(1):(s.kills>0?'∞':'0');const dist=s.dist?(s.dist/1000).toFixed(1):'—';const col=facCSS(s.fac),fn=facName(s.fac);const lc=facLabelColor(s.fac)||'#b0c8a8';const tr=document.createElement('tr');tr.innerHTML=`<td style="color:${lc};font-weight:600;">${s.name}</td><td style="color:${col};">${fn}</td><td style="color:#5aaa5a;">${s.kills||0}</td><td style="color:#aa5a5a;">${s.deaths||0}</td><td style="color:#aaaa40;">${s.tk||0}</td><td style="color:#aaaa40;">${kd}</td><td style="color:var(--muted);">${dist}</td>`;tbody.appendChild(tr);});
  tbl.appendChild(tbody);el.appendChild(tbl);
}

function buildMeta(filename){
  const el=document.getElementById('tab-meta'),m=data.meta||{};
  el.innerHTML=`<div class="meta-block"><div>ФАЙЛ &nbsp;&nbsp;&nbsp; <strong>${filename||'—'}</strong></div><div>ID &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>${m.id||'—'}</strong></div><div>ВРЕМЯ &nbsp;&nbsp; <strong>${fmt(m.duration||0)}</strong></div><div>ФРЕЙМЫ &nbsp;<strong>${data.frames?.length||0}</strong></div><div>УБИЙСТВА <strong>${data.kills?.length||0}</strong></div><div>ВЫСТРЕЛЫ <strong>${data.shots?.length||0}</strong></div></div>
  <div style="padding:8px 11px;font-family:var(--mono);font-size:9px;color:var(--muted);line-height:2.1;"><div style="color:var(--text-dim);margin-bottom:3px;">// управление</div><div>Пробел — play/pause</div><div>← → — ±10 сек</div><div>↑ ↓ — скорость</div><div>Колесо — масштаб</div></div>`;
}

document.querySelectorAll('.tab').forEach(tab=>{tab.onclick=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));tab.classList.add('active');document.getElementById('tab-'+tab.dataset.tab).classList.add('active');};});

// ── CSS ───────────────────────────────────────────────────────
const style=document.createElement('style');
style.textContent=`
.list-item-actions{display:flex;gap:2px;flex-shrink:0;}
.list-item-btn{background:transparent;border:1px solid var(--border);color:var(--muted);font-size:10px;padding:1px 5px;cursor:pointer;font-family:var(--mono);}
.list-item-btn:hover{border-color:var(--accent-dim);color:var(--accent);}
.list-item-btn.save{border-color:#2a5a2a;color:#5aaa5a;}
.list-item-btn.save:hover{background:#2a5a2a;color:#e0f0e0;}
.list-item-wpkey{font-family:var(--mono);font-size:8px;color:var(--muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
.list-item-wpname{color:var(--text-dim);font-family:var(--mono);font-size:9px;min-width:70px;flex-shrink:0;}
.edit-input{background:rgba(0,10,0,.8);border:1px solid var(--border);color:var(--text);padding:3px 6px;font-family:var(--mono);font-size:10px;}
.edit-input:focus{outline:none;border-color:var(--accent-dim);}
.zv-tip{background:rgba(2,6,2,.97);border:1px solid #1e3a1e;color:#c0d8b0;font-family:'Barlow',sans-serif;font-size:11px;padding:5px 9px;border-radius:2px;box-shadow:0 2px 8px rgba(0,0,0,.6);}
.zv-tip::before{display:none;}
.zv-lbl{background:transparent;border:none;box-shadow:none;font-family:'Barlow',sans-serif;white-space:nowrap;pointer-events:none;font-size:10px;font-weight:700;text-align:center;}
.leaflet-tooltip.zv-lbl::before{display:none;}
.roster-faction{margin:6px 8px;padding:8px 8px 6px 10px;background:rgba(0,8,0,.5);border-radius:1px;}
.roster-faction-header{font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:1px;margin-bottom:5px;text-transform:uppercase;}
.roster-row{display:flex;align-items:center;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);}
.roster-row:last-child{border-bottom:none;}
.roster-name{font-size:11px;font-weight:600;}
.roster-stat{font-family:var(--mono);font-size:9px;text-align:right;}
.roster-bots{padding:4px 0;font-size:9px;color:var(--muted);}
`;
document.head.appendChild(style);

// ── Init ──────────────────────────────────────────────────────
rebuildMapSelect();
initLeaflet();
