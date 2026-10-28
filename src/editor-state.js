// Editor state uses the existing storage keys and file format. Never exported.
import { presets, validateSettings } from '../dist/geometry.js';
import { createPresetLibrary, PRESET_KEY } from '../dist/preset-library.js';
export const DESIGN_KEY = 'orbit-design-v1';
export { PRESET_KEY };

export function createEditorStore(storage) {
  const library = createPresetLibrary(storage), listeners = new Set();
  let state = { settings: validateSettings(presets.reference), selected: 'reference', drafts: {}, library: {items:[],trash:[]}, storageError: '' };
  const known = id => Object.hasOwn(presets,id) || state.library.items.some(item=>item.id===id);
  const snapshot = id => state.library.items.find(item=>item.id===id)?.settings || presets[id] || presets.reference;
  try { state.library = library.list(); } catch(error) { state.storageError = error.message; }
  try {
    const saved = JSON.parse(storage.getItem(DESIGN_KEY) || 'null');
    if(saved) {
      state.settings = validateSettings(saved.settings);
      state.selected = known(saved.selected) ? saved.selected : 'reference';
      for(const [id,value] of Object.entries(saved.drafts || {})) if(known(id)) {
        try { state.drafts[id]=validateSettings(value); } catch { /* Ignore an invalid draft, preserving the saved preset. */ }
      }
    }
  } catch { state.storageError ||= 'Your autosaved design could not be read. Import a saved design to recover it.'; }
  const emit = () => listeners.forEach(listener=>listener());
  function commit(next) {
    state={...state,...next};
    state.drafts={...state.drafts,[state.selected]:validateSettings(state.settings)};
    try { storage.setItem(DESIGN_KEY,JSON.stringify({settings:state.settings,selected:state.selected,drafts:state.drafts})); }
    catch { state={...state,storageError:'Autosave is unavailable. Use Save Design to keep your work.'}; }
    emit();
  }
  return {
    getSnapshot:()=>state,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    change(patch){commit({settings:validateSettings({...state.settings,...patch})});},
    select(id){
      if(!known(id))throw new Error('This preset is no longer available.');
      const drafts={...state.drafts,[state.selected]:state.settings};
      commit({selected:id,settings:validateSettings(drafts[id] || snapshot(id)),drafts});
    },
    reset(){commit({settings:validateSettings(snapshot(state.selected))});},
    save(name){
      const item=library.save(name,state.settings);
      commit({selected:item.id,library:library.list()});return item;
    },
    rename(name){library.rename(state.selected,name);commit({library:library.list()});},
    update(){library.update(state.selected,state.settings);commit({library:library.list()});},
    remove(){const item=library.remove(state.selected);commit({selected:'reference',library:library.list()});return item;},
    undo(){const item=library.undo();state={...state,library:library.list()};if(item)this.select(item.id);else emit();return item;},
    reload(){
      const items=library.list();state={...state,library:items};
      if(!known(state.selected))state={...state,selected:'reference'};
      emit();
    },
    importDesign(json){
      if(json?.format!=='orbit-design'||json.version!==1)throw new Error('Choose a design saved with Orbit’s Save Design button.');
      const settings=validateSettings(json.settings);
      commit({settings,selected:known(json.selected)?json.selected:'reference'});
    },
    exportDesign(){return {format:'orbit-design',version:1,settings:state.settings,selected:state.selected};}
  };
}
