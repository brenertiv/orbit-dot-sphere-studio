// Editor-only persistent snapshots. Never included in React downloads.
import { validateSettings } from './geometry.js';
export const PRESET_KEY='orbit-presets-v1';
export function createPresetLibrary(storage) {
  function read() {
    let value;
    try { value=storage.getItem(PRESET_KEY); } catch { throw new Error('Browser storage is unavailable. Your design is still open; use Save design to keep a copy.'); }
    if(value===null)return {version:1,items:[],trash:[]};
    try {
      const data=JSON.parse(value);
      if(data.version!==1||!Array.isArray(data.items)||!Array.isArray(data.trash)||data.items.length>50)throw new Error();
      const ids=new Set();
      for(const item of [...data.items,...data.trash]) {
        if(!item||!/^custom-[a-z0-9-]+$/i.test(item.id)||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>60)throw new Error();
        ids.add(item.id);item.settings=validateSettings(item.settings);
      }
      return data;
    } catch { throw new Error('Your preset library could not be read. The stored library has been left untouched.'); }
  }
  function write(data) {
    try {storage.setItem(PRESET_KEY,JSON.stringify(data));}
    catch {throw new Error('The preset could not be saved. Browser storage may be full or disabled. Your design is still open.');}
  }
  function nameFor(data,value,exceptId) {
    const name=typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
    if(!name||name.length>60)throw new Error('Enter a name between 1 and 60 characters.');
    if(data.items.some(p=>p.id!==exceptId&&p.name.toLowerCase()===name.toLowerCase()))throw new Error('That name is already in use. Choose another name or update the existing preset.');
    return name;
  }
  return {
    list:()=>read(),
    save(name,settings) {
      const data=read();if(data.items.length>=50)throw new Error('You can keep up to 50 presets. Remove one to make room.');
      const item={id:'custom-'+crypto.randomUUID(),name:nameFor(data,name),settings:validateSettings(settings),updatedAt:Date.now()};
      data.items.push(item);write(data);return item;
    },
    update(id,settings) {
      const data=read(),item=data.items.find(p=>p.id===id);if(!item)throw new Error('This preset is no longer in your library. Save it as a new preset.');
      item.settings=validateSettings(settings);item.updatedAt=Date.now();write(data);return item;
    },
    rename(id,name) {
      const data=read(),item=data.items.find(p=>p.id===id);if(!item)throw new Error('This preset is no longer in your library.');
      item.name=nameFor(data,name,id);write(data);return item;
    },
    remove(id) {
      const data=read(),index=data.items.findIndex(p=>p.id===id);if(index<0)throw new Error('This preset is no longer in your library.');
      const [item]=data.items.splice(index,1);data.trash.push(item);write(data);return item;
    },
    undo() {
      const data=read();if(!data.trash.length)return null;
      if(data.items.length>=50)throw new Error('Remove another preset before restoring this one.');
      const item=data.trash.at(-1);item.name=nameFor(data,item.name,item.id);data.trash.pop();data.items.push(item);write(data);return item;
    }
  };
}
