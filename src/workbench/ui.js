import OpenPanelRight from '@carbon/icons/es/open-panel--right/16.js';
import Assembly from '@carbon/icons/es/assembly/16.js';
import Equalizer from '@carbon/icons/es/equalizer/16.js';
import Document from '@carbon/icons/es/document/16.js';
import SkipBack from '@carbon/icons/es/skip--back/16.js';
import SkipForward from '@carbon/icons/es/skip--forward/16.js';
import Copy from '@carbon/icons/es/copy/16.js';
import TrashCan from '@carbon/icons/es/trash-can/16.js';
import Floorplan from '@carbon/icons/es/floorplan/16.js';
import Cube from '@carbon/icons/es/cube/16.js';
import Catalog from '@carbon/icons/es/catalog/16.js';
import Layers from '@carbon/icons/es/layers/16.js';
import Tools from '@carbon/icons/es/tools/16.js';
import Information from '@carbon/icons/es/information/16.js';
import Add from '@carbon/icons/es/add/16.js';
import FolderOpen from '@carbon/icons/es/folder--open/16.js';
import Save from '@carbon/icons/es/save/16.js';
import Undo from '@carbon/icons/es/undo/16.js';
import Redo from '@carbon/icons/es/redo/16.js';
import ArrowRight from '@carbon/icons/es/arrow--right/16.js';
import ArrowLeft from '@carbon/icons/es/arrow--left/16.js';
import Download from '@carbon/icons/es/download/16.js';
import Help from '@carbon/icons/es/help/16.js';
import Close from '@carbon/icons/es/close/16.js';
const icons={OpenPanelRight,Assembly,Equalizer,Document,SkipBack,SkipForward,Copy,TrashCan,Floorplan,Cube,Catalog,Layers,Tools,Information,Add,FolderOpen,Save,Undo,Redo,ArrowRight,ArrowLeft,Download,Help,Close};
export function icon(name){const def=icons[name],ns='http://www.w3.org/2000/svg';function node(d){const e=document.createElementNS(ns,d.elem);for(const [k,v]of Object.entries(d.attrs||{}))e.setAttribute(k,v);for(const child of d.content||[])e.append(node(child));return e;}const e=node(def);e.classList.add('ui-icon');e.setAttribute('aria-hidden','true');e.setAttribute('focusable','false');return e;}
export function decorateUI(root=document){for(const holder of root.querySelectorAll('[data-tab-icon]'))if(!holder.firstChild)holder.append(icon(holder.dataset.tabIcon));const fixed={reset:'Add',open:'FolderOpen',save:'Save',undo:'Undo',redo:'Redo',help:'Help','close-help':'Close'};for(const button of root.querySelectorAll('button')){if(button.dataset.decorated)continue;let name=fixed[button.id],label=button.textContent.trim();if(!name){if(label.includes('→'))name='ArrowRight';else if(label.includes('←'))name='ArrowLeft';else if(label.startsWith('Download'))name='Download';else if(label==='Generate toolpaths')name='ArrowRight';}if(!name)continue;button.dataset.decorated='true';if(button.id==='undo'||button.id==='redo'){button.replaceChildren(icon(name));button.classList.add('icon-button');continue;}button.textContent=label.replace(/[←→]/g,'').trim();button.append(icon(name));button.classList.add('with-icon');}}
