export function correctionActions(error,context={}){
 const message=String(error.message??error),actions=[];const add=(scope,key,label)=>{if(!actions.some(a=>a.scope===scope&&a.key===key))actions.push({scope,key,label,id:scope+'-'+key});};
 if(context.id){const i=context.id.indexOf('-');if(i>0)add(context.id.slice(0,i),context.id.slice(i+1),'Edit '+(context.label||'entered value'));}
 if(error.field)add('machine',error.field,'Edit '+({tool:'contour / hinge cutter',dadoTool:'dado cutter',pilotTool:'small-hole cutter',sheetTool:'sheet cutter',flute:'cutting length',dadoFlute:'dado cutting length',pilotFlute:'pilot cutting length',bedX:'machine travel X',bedY:'machine travel Y',tabWidth:'holding-tab width'}[error.field]||error.field));
 const height=context.style==='Wall'||context.style==='Tall'?'wallTopHeight':'counterHeight';
 for(const [pattern,targets]of [
  [/tab width|tabs do not fit|holding tabs/i,[['machine','tabWidth','Edit holding-tab width'],['machine','tool','Edit contour cutter']]],
  [/tab height/i,[['machine','tabHeight','Edit holding-tab height']]],
  [/sheet border|sheet.*gap|spacing/i,[['stock','margin','Edit sheet border'],['stock','gap','Edit part spacing'],['machine','dadoTool','Edit dado cutter']]],
  [/blank margin/i,[['machine','margin','Edit blank margin']]],
  [/touchplate|probe|tool-change height/i,[['machine','probeX','Edit probe X'],['machine','probeY','Edit probe Y'],['machine','changeZ','Edit change height']]],
  [/runner pilots need cabinet stock/i,[['cabinet','thickness','Edit cabinet stock thickness']]],
  [/Runner length must fit/i,[['cabinet','depth','Edit body depth'],['cabinet','drawerLength','Edit runner length']]],
  [/Drawer box is too narrow/i,[['cabinet','width','Edit body width']]],
  [/TANDEM|drawer|runner/i,[['cabinet','drawerStock','Edit drawer stock'],['cabinet','drawerRunner','Edit runner preset'],['cabinet','drawerLength','Edit runner length'],['cabinet','drawerCount','Edit drawer quantity']]],
  [/handle/i,[['cabinet','handleEdge','Edit handle setback'],['cabinet','handlePitch','Edit handle spacing'],['cabinet','handlePosition','Edit handle placement']]],
  [/hinge|cup|mounting plate/i,[['cabinet','hinge','Edit hinge preset'],['cabinet','plate','Edit mounting plate'],['cabinet','hingeEnd','Edit hinge end setback']]],
  [/shelf|pin positions/i,[['cabinet','shelves','Edit shelf quantity'],['cabinet','pinFront','Edit front shelf-pin setback'],['installation',height,'Edit cabinet height target']]],
  [/wall top|tall top|wallGap|counterHeight|height leaves|five-position|counter height/i,[['installation',height,'Edit height target'],['installation','wallGap','Edit wall gap']]],
  [/foot|feet/i,[['cabinet','feetHeight','Edit foot mounting height'],['cabinet','feetX','Edit foot side setback'],['cabinet','feetFront','Edit foot front setback']]],
  [/glass|frame/i,[['cabinet','glassFrame','Edit frame width'],['cabinet','glassThickness','Edit glass thickness'],['cabinet','doors','Edit door quantity']]],
  [/groove|dado|back inset/i,[['cabinet','grooveDepth','Edit groove depth'],['cabinet','back','Edit back thickness'],['cabinet','backInset','Edit back inset']]],
  [/sheet|stock|travel/i,[['stock','width','Edit sheet width'],['stock','height','Edit sheet height'],['machine','bedX','Edit machine travel X'],['machine','bedY','Edit machine travel Y']]],
  [/body width|empty|usable cabinet|opening/i,[['cabinet','width','Edit cabinet width'],['cabinet','thickness','Edit stock thickness']]],
  [/name|label/i,[['cabinet','name','Edit cabinet name']]]
 ])if(pattern.test(message))for(const t of targets)add(...t);
 if(!actions.length)add('cabinet','width','Edit cabinet settings');return actions.slice(0,4);
}
