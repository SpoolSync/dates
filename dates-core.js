/* Dates core: yearly occasions and one-off renewals, what's coming up, and a calendar file. No DOM. */
(function(root){
"use strict";
function str(v,k){return String(v==null?"":v).slice(0,k);}
function z(n){return String(n).padStart(2,"0");}
function iso(d){return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());}
function parse(s){var p=String(s).split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
function days(a,b){return Math.round((parse(b)-parse(a))/864e5);}
var KINDS=[["birthday","Birthday"],["anniversary","Anniversary"],["memorial","Remembrance"],["other-yearly","Other, every year"],
  ["passport","Passport"],["licence","Driver's licence"],["health","Health card"],["prcard","PR card or visa"],["insurance","Insurance renewal"],["plate","Licence plate sticker"],["membership","Membership"],["other-once","Other, once"]];
var YEARLY={birthday:1,anniversary:1,memorial:1,"other-yearly":1};
/* How early to be reminded, in days, by kind. Renewals take time (a passport can take weeks). */
var LEAD={birthday:7,anniversary:7,memorial:1,"other-yearly":3,passport:120,licence:60,health:60,prcard:180,insurance:30,plate:30,membership:14,"other-once":14};
/* Next date this falls on, from today. Feb 29 falls on Feb 28 in other years. */
function next(item,today){
  if(!YEARLY[item.kind])return item.date;
  var t=parse(today),p=item.date.split("-"),m=+p[1]-1,d=+p[2];
  function on(y){var dd=new Date(y,m,d);if(dd.getMonth()!==m)dd=new Date(y,m+1,0);return dd;}
  var c=on(t.getFullYear());if(c<t)c=on(t.getFullYear()+1);return iso(c);
}
/* Age or years reached on the next date, when the original year is known. */
function turns(item,today){
  if(!YEARLY[item.kind]||!item.year)return null;
  return +next(item,today).slice(0,4)-+item.date.slice(0,4);
}
function upcoming(state,today,within){
  return state.items.map(function(i){var n=next(i,today);return {i:i,on:n,in:days(today,n),turns:turns(i,today)};})
    .filter(function(x){return x.in>=0&&(within==null||x.in<=within);}).sort(function(a,b){return a.in-b.in||a.i.name.localeCompare(b.i.name);});
}
/* Calendar file: each item on its date (yearly ones repeat), with an alert lead days before. */
function esc(t){return String(t).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");}
function compact(s){return s.replace(/-/g,"");}
function plus1(s){var d=parse(s);d.setDate(d.getDate()+1);return compact(iso(d));}
function titleOf(i){var k=kindLabel(i.kind);return YEARLY[i.kind]?(i.kind==="birthday"?i.name+"'s birthday":i.kind==="anniversary"?i.name+" anniversary":i.name):(k+" renewal: "+i.name);}
function kindLabel(k){var x=KINDS.filter(function(y){return y[0]===k;})[0];return x?x[1]:"";}
function ics(state,today,stamp){
  var L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Pixora//Dates//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  state.items.forEach(function(i){
    var yearly=!!YEARLY[i.kind],start=yearly?(i.year?i.date:next(i,today)):i.date;
    if(!yearly&&i.date<today)return;
    var lead=i.lead!=null?i.lead:LEAD[i.kind]||7;
    L.push("BEGIN:VEVENT","UID:pixora-dates-"+i.id+"@spoolsync.github.io","DTSTAMP:"+stamp,"DTSTART;VALUE=DATE:"+compact(start),"DTEND;VALUE=DATE:"+plus1(start),
      "SUMMARY:"+esc(titleOf(i)),"DESCRIPTION:"+esc([i.note,i.gifts&&i.gifts.length?"Gift ideas: "+i.gifts.map(function(g){return g.t;}).join(", "):""].filter(Boolean).join("\n")),"TRANSP:TRANSPARENT");
    if(yearly)L.push("RRULE:FREQ=YEARLY");
    L.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc(titleOf(i)),"TRIGGER;RELATED=START:-P"+lead+"DT0H","END:VALARM");
    if(lead>3)L.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc(titleOf(i)),"TRIGGER;RELATED=START:-PT15H","END:VALARM");
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");return L.join("\r\n")+"\r\n";
}
function clean(s){
  s=s&&typeof s==="object"?s:{};
  var kinds=KINDS.map(function(k){return k[0];}),o={ts:+s.ts||0,items:[],budget:{}};
  (Array.isArray(s.items)?s.items:[]).slice(0,500).forEach(function(i){
    if(!i||!i.id||!/^\d{4}-\d{2}-\d{2}$/.test(i.date))return;
    o.items.push({id:str(i.id,24),name:str(i.name,80),kind:kinds.indexOf(i.kind)>=0?i.kind:"other-yearly",date:i.date,year:!!i.year,note:str(i.note,500),
      lead:i.lead==null||i.lead===""?null:Math.max(0,Math.min(365,Math.round(+i.lead)||0)),
      gifts:(Array.isArray(i.gifts)?i.gifts:[]).slice(0,40).filter(function(g){return g&&g.t;}).map(function(g){return {id:str(g.id,24),t:str(g.t,120),cost:Math.max(0,+g.cost||0),done:!!g.done,y:+g.y||0};}),
      budget:Math.max(0,+i.budget||0)});
  });
  return o;
}
var api={KINDS:KINDS,YEARLY:YEARLY,LEAD:LEAD,next:next,turns:turns,upcoming:upcoming,ics:ics,titleOf:titleOf,kindLabel:kindLabel,days:days,clean:clean};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.DatesCore=api;
})(typeof self!=="undefined"?self:this);
