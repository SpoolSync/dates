"use strict";
/* Dates: birthdays and anniversaries (with ages, gift ideas and a budget) and renewals for passports,
   licences, health cards and insurance. Reminders go through the phone's own calendar. Storage,
   sign-in, passcode and encrypted sync: pixora-kit.js. */
var D=DatesCore,K=PixoraKit,esc=K.esc;
var S=null,tab="soon",PC=window.PixoraCountry;
function C(){return (S&&S.country)||(PC?PC.get():"CA");}
function $(s){return document.querySelector(s);}
function z(n){return String(n).padStart(2,"0");}
function today(){var d=new Date();return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());}
function rid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function nice(s,withYear){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(PC?PC.locale(C()):"en-CA",withYear?{weekday:"short",month:"long",day:"numeric",year:"numeric"}:{month:"long",day:"numeric"});}
function money(v){return PC?PC.money(v,{country:C(),dec:Math.round(v)===v?0:2}):"$"+v;}
function inWords(n){return n===0?"today":n===1?"tomorrow":n<7?"in "+n+" days":n<14?"next week":n<60?"in "+Math.round(n/7)+" weeks":"in "+Math.round(n/30)+" months";}
var tt=null;function toast(m){var t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true;},4000);}
function save(){K.save(S);}
function byId(id){return S.items.filter(function(i){return i.id===id;})[0];}

function render(){
  var app=$("#app");app.hidden=false;$("#tabs").hidden=false;
  document.querySelectorAll("#tabs button").forEach(function(b){b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false");});
  app.innerHTML=tab==="soon"?soonView():tab==="all"?allView():settingsView();
}
function header(eb,title,right){return '<header class="top"><div><p class="eyebrow">'+esc(eb)+'</p><h1>'+esc(title)+'</h1></div><div class="row">'+(right||"")+'<button class="btn q s" data-act="settings">Settings</button></div></header><button class="status" id="st" data-act="settings">'+esc(K.status())+'</button>';}
function row(x){
  var i=x.i,y=D.YEARLY[i.kind],sub=(y?(x.turns!=null?(i.kind==="birthday"?"turns "+x.turns:x.turns+" years"):D.kindLabel(i.kind,C())):D.kindLabel(i.kind,C())+" expires")+" · "+nice(x.on,!y);
  var left=i.gifts.filter(function(g){return !g.done;}).length,warn=!y&&x.in<=(i.lead!=null?i.lead:D.LEAD[i.kind]);
  return '<button class="dcard" data-act="open" data-id="'+i.id+'"><span class="when'+(x.in<=7||warn?" soon":"")+'">'+esc(inWords(x.in))+'</span><b>'+esc(y?D.titleOf(i,C()):i.name)+'</b><span class="note">'+esc(sub)+(left?" · "+left+" gift idea"+(left===1?"":"s"):"")+(warn?" · time to renew":"")+'</span></button>';
}
function soonView(){
  var h=header("Dates","Coming up",'<button class="btn p s" data-act="new">Add</button>');
  if(!S.items.length)return h+'<div class="empty"><p>Birthdays and anniversaries, plus renewals for your '+esc(C()==="US"?"passport, driver's license, green card, vehicle registration":C()==="GB"?"passport, driving licence, MOT, vehicle tax, TV licence":C()==="IN"?"passport, driving licence, PUC, vehicle insurance":"passport, driver's licence, health card")+' and insurance. Then add them to your phone\'s calendar, with a reminder early enough to buy a gift or book a renewal.</p><div class="row"><button class="btn p" data-act="new">Add a date</button></div></div>';
  var u=D.upcoming(S,today(),60);
  if(!u.length)h+='<p class="note">Nothing in the next 60 days.</p>';
  u.forEach(function(x){h+=row(x);});
  var later=D.upcoming(S,today()).filter(function(x){return x.in>60;}).slice(0,5);
  if(later.length){h+='<h2 style="margin-top:8px">Later</h2>';later.forEach(function(x){h+=row(x);});}
  h+='<section class="card"><h2>Reminders</h2><p class="note">Add everything to your phone\'s calendar. Birthdays repeat every year with a reminder a week before; renewals remind you months ahead, since a passport can take weeks. Add again after changes; the same events update instead of doubling.</p><div class="row"><button class="btn" data-act="ics">Add to my calendar</button></div></section>';
  return h;
}
function allView(){
  var h=header("Dates","All",'<button class="btn p s" data-act="new">Add</button>');
  var groups=[["People",function(i){return D.YEARLY[i.kind];}],["Renewals",function(i){return !D.YEARLY[i.kind];}]];
  groups.forEach(function(g){
    var list=S.items.filter(g[1]).sort(function(a,b){return a.name.localeCompare(b.name);});if(!list.length)return;
    h+='<section class="card"><h2>'+g[0]+'</h2>';list.forEach(function(i){var n=D.next(i,today());h+='<div class="hold" data-act="open" data-id="'+i.id+'"><span><b>'+esc(i.name)+'</b><br><span class="note">'+esc(D.kindLabel(i.kind,C()))+'</span></span><span class="v">'+esc(nice(n,!D.YEARLY[i.kind]))+'</span></div>';});h+='</section>';
  });
  var spent=0,yr=new Date().getFullYear();S.items.forEach(function(i){i.gifts.forEach(function(g){if(g.done&&g.y===yr)spent+=g.cost;});});
  var budget=S.items.reduce(function(a,i){return a+(i.budget||0);},0);
  if(budget||spent)h+='<section class="card"><h2>Gifts in '+yr+'</h2><div class="ln"><span>Spent</span><span class="lead"></span><span class="v">'+money(spent)+'</span></div>'+(budget?'<div class="ln"><span>Budgeted</span><span class="lead"></span><span class="v">'+money(budget)+'</span></div>':"")+'</section>';
  return h;
}
function settingsView(){
  var h='<button class="btn q s" data-act="tab" data-t="soon" style="align-self:flex-start">← Back</button><h1>Settings</h1>';
  if(PC)h+=PC.picker("Sets which renewals show (health card, green card, MOT, PUC and so on), the tips, and money format.");
  h+='<section class="card"><h2>Account</h2>'+(K.local?'<p class="small">On this phone only.</p><div class="row"><button class="btn" data-act="join">Sign in or create a Pixora account</button></div>':'<p class="small">Signed in as '+esc(K.email||"")+'. Encrypted on this phone before it syncs; nobody else can read it, not even Pixora.</p><div class="row"><button class="btn q" data-act="signout">Sign out</button></div>')+'</section>';
  h+='<section class="card"><h2>Your copy</h2><p class="small muted">Download everything in Dates as a file, and bring it back here or on a new phone. It\'s a plain file, not encrypted.</p><div class="row"><button class="btn" data-act="export">Download a copy</button><label class="btn q" style="cursor:pointer">Restore from a copy<input type="file" id="restore" accept=".json,application/json" hidden></label></div></section>';
  h+='<section class="card"><h2>Ideas or problems?</h2><p class="small muted">Tell Sachin what would make Dates better or what went wrong. Nothing from your dates is sent.</p><div class="row"><button class="btn" data-act="feedback">Send feedback</button></div></section>';
  h+='<section class="card"><h2>Delete my Dates data</h2><p class="note">Deletes your dates and gift ideas from this phone'+(K.local?"":" and your Pixora account")+'. Your Pixora login and other apps aren\'t affected. To delete the Pixora login itself, email pixora3dstudios@gmail.com. Events already added to your calendar stay there.</p><div class="row"><button class="btn d" data-act="delall">Delete my Dates data</button></div></section>';
  return h;
}

function dlg(html){var d=$("#dlg");d.innerHTML='<div class="form">'+html+'</div>';if(!d.open)d.showModal();return d;}
function closeDlg(){var d=$("#dlg");if(d.open)d.close();d.innerHTML="";}
$("#dlg").addEventListener("cancel",function(e){e.preventDefault();closeDlg();});
function editDialog(i){
  var isNew=!i;i=i||{id:rid(),name:"",kind:"birthday",date:"",year:true,note:"",lead:null,gifts:[],budget:0};
  dlg('<h2>'+(isNew?"Add a date":"Edit")+'</h2><label class="f">What kind<select id="d-kind">'+
    '<optgroup label="Every year">'+D.kindsFor(C()).filter(function(k){return D.YEARLY[k[0]];}).map(function(k){return '<option value="'+k[0]+'"'+(k[0]===i.kind?" selected":"")+'>'+k[1]+'</option>';}).join("")+'</optgroup>'+
    '<optgroup label="Renewals">'+D.kindsFor(C()).filter(function(k){return !D.YEARLY[k[0]];}).concat(D.KINDS.filter(function(k){return k[0]===i.kind&&!D.kindsFor(C()).some(function(x){return x[0]===k[0];});})).map(function(k){return '<option value="'+k[0]+'"'+(k[0]===i.kind?" selected":"")+'>'+k[1]+'</option>';}).join("")+'</optgroup></select></label>'+
    '<label class="f"><span id="d-namel">Name</span><input type="text" id="d-name" maxlength="80" value="'+esc(i.name)+'"></label>'+
    '<label class="f"><span id="d-datel">Date</span><input type="date" id="d-date" value="'+esc(i.date)+'"></label>'+
    '<label class="small" id="d-yearw" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="d-year"'+(i.year?" checked":"")+'> I know the year (shows the age)</label>'+
    '<label class="f">Remind me (days before)<input type="text" inputmode="numeric" id="d-lead" value="'+(i.lead==null?"":i.lead)+'" placeholder=""></label>'+
    '<label class="f">Note<textarea id="d-note" maxlength="500" style="min-height:70px">'+esc(i.note)+'</textarea></label>'+
    '<label class="f" id="d-budw">Gift budget ($)<input type="text" inputmode="decimal" id="d-bud" value="'+(i.budget||"")+'"></label>'+
    '<div class="row"><button class="btn p" data-act="save" data-id="'+i.id+'" data-new="'+(isNew?1:0)+'">Save</button><button class="btn q" data-act="close">Cancel</button>'+(isNew?"":'<button class="btn d" data-act="del" data-id="'+i.id+'">Delete</button>')+'</div>');
  function sync(){var k=$("#d-kind").value,y=!!D.YEARLY[k];$("#d-yearw").hidden=!y;$("#d-budw").hidden=!y;
    $("#d-namel").textContent=y?(k==="birthday"?"Whose birthday":k==="anniversary"?"Whose anniversary":"Name"):"Which one (e.g. mine, Priya's)";
    $("#d-datel").textContent=y?(k==="birthday"?"Birthday":"Date"):"Expires on";$("#d-lead").placeholder=String(D.LEAD[k]||7);}
  $("#d-kind").addEventListener("change",sync);sync();
}
function openDialog(i){
  var x=D.upcoming({items:[i]},today())[0],yr=new Date().getFullYear(),y=D.YEARLY[i.kind];
  var gifts=i.gifts.map(function(g){return '<label class="item'+(g.done?" done":"")+'"><input type="checkbox" data-act="gift" data-id="'+i.id+'" data-g="'+g.id+'"'+(g.done?" checked":"")+'><span>'+esc(g.t)+(g.done&&g.y?' <span class="note">· given '+g.y+'</span>':"")+'</span><span class="v">'+(g.cost?money(g.cost):"")+'</span></label>';}).join("");
  dlg('<p class="eyebrow">'+esc(D.kindLabel(i.kind,C()))+'</p><h2>'+esc(y?D.titleOf(i,C()):i.name)+'</h2>'+
    (x?'<p>'+esc(nice(x.on,true))+' · '+esc(inWords(x.in))+(x.turns!=null?' · '+(i.kind==="birthday"?"turns "+x.turns:x.turns+" years"):"")+'</p>':'<p class="note">'+esc(nice(i.date,true))+' (passed)</p>')+
    (i.note?'<p class="note" style="white-space:pre-wrap">'+esc(i.note)+'</p>':"")+
    (y?'<h3>Gift ideas</h3>'+(gifts||'<p class="note">Jot ideas down whenever they come up.</p>')+'<div class="row"><input type="text" id="g-t" placeholder="Idea" maxlength="120" style="flex:1"><input type="text" inputmode="decimal" id="g-c" placeholder="$" style="width:80px"><button class="btn q s" data-act="addgift" data-id="'+i.id+'">Add</button></div>'+
      (i.budget?'<p class="note">Budget '+money(i.budget)+'; spent '+money(i.gifts.filter(function(g){return g.done&&g.y===yr;}).reduce(function(a,g){return a+g.cost;},0))+' this year.</p>':""):"")+
    (!y?'<p class="note">'+renewTip(i.kind)+'</p>':"")+
    '<div class="row"><button class="btn" data-act="edit" data-id="'+i.id+'">Edit</button><button class="btn q" data-act="close">Close</button></div>');
}
/* General pointers, by country. Not official advice; each office has the details. */
var TIPS={
  CA:{passport:"Canadian passports can take several weeks; apply early, especially before summer travel. Some countries want 6 months left on it.",
    licence:"Ontario usually mails a renewal notice; you can often renew online at ServiceOntario.",health:"Ontario health cards renew at ServiceOntario, sometimes online.",
    prcard:"PR card renewals can take months; apply well before travel.",plate:"Ontario plate stickers are free to renew but still need renewing; ServiceOntario online.",insurance:"A good moment to compare quotes before it auto-renews."},
  US:{passport:"US passport renewals can take weeks; many adults can renew online or by mail. Some countries want 6 months left on it.",
    licence:"Most states let you renew online or by mail every other time; check your state's DMV. Domestic flights need a REAL ID or a passport.",
    prcard:"Green cards renew with Form I-90, about 6 months before they expire.",plate:"Renew the vehicle registration with your state's DMV, often online.",insurance:"A good moment to compare quotes before it auto-renews."},
  GB:{passport:"UK passport renewals usually take a few weeks online; allow longer before summer. Some countries want 3 to 6 months left on it.",
    licence:"The photocard needs renewing every 10 years (DVLA, online for £14). Driving with an expired photocard can be fined.",
    mot:"Cars need an MOT every year once they're 3 years old (4 in Northern Ireland). You can get it up to a month early and keep the same renewal date.",
    vtax:"Tax the vehicle on GOV.UK or the DVLA app; there are no paper discs, so it's easy to forget.",
    tvlicence:"Needed to watch live TV or use BBC iPlayer. Renew online at tvlicensing.co.uk.",
    ghic:"The free GHIC card covers state healthcare in the EU. Apply only on the NHS website; other sites charge.",
    prcard:"Check your eVisa on GOV.UK and update your passport details before travel.",insurance:"Compare quotes about 3 weeks before renewal; prices are often lower then."},
  IN:{passport:"Book a Passport Seva appointment early; renewals can take weeks. Some countries want 6 months left on it.",
    licence:"Renew through Parivahan Sarathi online, then visit the RTO if needed. There's a short grace period after expiry.",
    puc:"Driving without a valid PUC certificate can be fined; any authorised petrol pump centre can renew it.",
    prcard:"Check the visa or OCI rules with the embassy or VFS before travel.",insurance:"Vehicle third-party insurance is required by law; compare quotes before it auto-renews."}
};
function renewTip(k){var t=TIPS[C()]||TIPS.CA;return t[k]||"";}
function downloadIcs(){
  if(!S.items.length){toast("Add a date first.");return;}
  var stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z$/,"Z");
  var blob=new Blob([D.ics(S,today(),stamp)],{type:"text/calendar"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="pixora-dates-people.ics";document.body.append(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},3000);K.track("ics_export");toast("Open the file and choose Add All to put them in your calendar.");
}

document.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b||b.tagName==="SELECT"||(b.tagName==="INPUT"&&b.type!=="checkbox"))return;
  var a=b.dataset.act,id=b.dataset.id;
  if(a==="tab"){tab=b.dataset.t;render();}
  else if(a==="settings"){tab="settings";render();}
  else if(a==="close")closeDlg();
  else if(a==="new")editDialog(null);
  else if(a==="open"){var it=byId(id);if(it)openDialog(it);}
  else if(a==="edit")editDialog(byId(id));
  else if(a==="save"){
    var nm=$("#d-name").value.trim(),dt=$("#d-date").value;if(!nm){toast("Add a name.");return;}if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)){toast("Pick the date.");return;}
    var i=byId(id)||{id:id,gifts:[]},k=$("#d-kind").value;i.name=nm.slice(0,80);i.kind=k;i.date=dt;i.year=D.YEARLY[k]?$("#d-year").checked:false;i.note=$("#d-note").value.slice(0,500);
    var ld=$("#d-lead").value.trim();i.lead=ld===""?null:Math.max(0,Math.min(365,parseInt(ld,10)||0));i.budget=Math.max(0,parseFloat($("#d-bud").value)||0);
    if(b.dataset.new==="1"){S.items.push(i);K.track("add_"+k);}save();closeDlg();render();
  }
  else if(a==="del"){if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Tap again to delete";return;}S.items=S.items.filter(function(x){return x.id!==id;});save();closeDlg();render();}
  else if(a==="addgift"){var it2=byId(id),t=$("#g-t").value.trim();if(!t)return;it2.gifts.push({id:rid(),t:t.slice(0,120),cost:Math.max(0,parseFloat($("#g-c").value)||0),done:false,y:0});save();openDialog(it2);K.track("gift_idea");}
  else if(a==="gift"){var it3=byId(id),g=it3&&it3.gifts.filter(function(x){return x.id===b.dataset.g;})[0];if(g){g.done=b.checked;g.y=b.checked?new Date().getFullYear():0;save();var r=b.closest(".item");if(r)r.classList.toggle("done",b.checked);K.track("gift_given");}}
  else if(a==="ics")downloadIcs();
  else if(a==="export")K.exportCopy();
  else if(a==="feedback"){if(window.PixoraFeedback)PixoraFeedback.open("dates","Dates");}
  else if(a==="delall"){if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Tap again: delete everything in Dates";return;}tab="soon";K.deleteAppData().then(function(){render();toast("Your Dates data is deleted. Your Pixora login still works.");}).catch(function(){toast("Couldn't delete. Check the connection.");});}
  else if(a==="join")K.joinAccount();
  else if(a==="signout")K.signOut();
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t.id==="restore"&&t.files[0]){var fr=new FileReader(),f=t.files[0];t.value="";fr.onload=function(){if(!confirm("Replace what's in Dates now with this copy?"))return;try{K.restoreCopy(String(fr.result));toast("Restored from your copy.");}catch(x){toast(x&&x.code==="wrongapp"?"That copy is from "+(x.app||"another app")+", not Dates.":"That file isn't a Dates copy.");}};fr.readAsText(f);}
});
$("#tabs").addEventListener("click",function(e){var b=e.target.closest("[data-tab]");if(!b)return;tab=b.dataset.tab;render();K.track("tab_"+tab);});

K.boot({
  app:"dates",title:"Dates",version:"dates-v1",blurb:"Birthdays, gift ideas and renewals, with reminders in your calendar.",
  clean:D.clean,
  onOpen:function(s){S=s;render();},
  onRemote:function(s){S=s;if(!$("#dlg").open)render();},
  onStatus:function(t){var st=$("#st");if(st)st.textContent=t;},
  onGate:function(shown){$("#app").hidden=shown;$("#tabs").hidden=shown;},
  /* For Pixora Today: the next few dates. */
  summary:function(s){return {d:today(),next:D.upcoming(s,today(),45).slice(0,4).map(function(x){return {t:D.YEARLY[x.i.kind]?D.titleOf(x.i,C()):D.kindLabel(x.i.kind,C())+": "+x.i.name,on:x.on,in:x.in,renew:!D.YEARLY[x.i.kind],turns:x.turns};})};}
});
