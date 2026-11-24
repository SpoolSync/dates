var D=require("../dates-core.js"),assert=require("assert"),n=0;function t(a,f){f();n++;console.log("ok  "+a);}
var st=D.clean({items:[
  {id:"a",name:"Mom",kind:"birthday",date:"1965-03-14",year:true,gifts:[{id:"g",t:"Silk scarf",cost:40}]},
  {id:"b",name:"Leap",kind:"birthday",date:"2000-02-29",year:true},
  {id:"c",name:"Canadian passport",kind:"passport",date:"2027-06-01"},
  {id:"d",name:"Old licence",kind:"licence",date:"2025-01-01"},
  {id:"e",name:"Wedding",kind:"anniversary",date:"2020-11-30",year:true}]});
t("next yearly date and age",function(){
  assert.strictEqual(D.next(st.items[0],"2026-11-24"),"2027-03-14");assert.strictEqual(D.turns(st.items[0],"2026-11-24"),62);
  assert.strictEqual(D.next(st.items[1],"2026-11-24"),"2027-02-28");assert.strictEqual(D.next(st.items[1],"2027-03-01"),"2028-02-29");
  assert.strictEqual(D.next(st.items[4],"2026-11-24"),"2026-11-30");assert.strictEqual(D.turns(st.items[4],"2026-11-24"),6);
});
t("upcoming skips past one-offs, sorted soonest",function(){var u=D.upcoming(st,"2026-11-24",400);assert.deepStrictEqual(u.map(function(x){return x.i.id;}),["e","b","a","c"]);assert.strictEqual(u[0].in,6);});
t("calendar file repeats yearly ones and alerts early for renewals",function(){
  var f=D.ics(st,"2026-11-24","20261124T000000Z");
  assert.strictEqual((f.match(/BEGIN:VEVENT/g)||[]).length,4);assert.ok(/DTSTART;VALUE=DATE:19650314\r\nDTEND;VALUE=DATE:19650315/.test(f));
  assert.ok(/RRULE:FREQ=YEARLY/.test(f));assert.ok(/SUMMARY:Passport renewal: Canadian passport/.test(f));assert.ok(/TRIGGER;RELATED=START:-P120DT0H/.test(f));
  assert.ok(/Gift ideas: Silk scarf/.test(f));assert.ok(/Mom's birthday/.test(f));
});
console.log(n+" tests passed");
