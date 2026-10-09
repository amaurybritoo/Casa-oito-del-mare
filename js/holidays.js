// Feriados nacionais e do estado do Rio de Janeiro (usado pela página de links e pelo painel).
function easterSunday(year){
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
  return new Date(year,month-1,day);
}
const cache=new Map();
function holidayMapForYear(year){
  if(cache.has(year))return cache.get(year);
  const holidays=new Map(),add=(month,day,name,scope)=>holidays.set(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,{name,scope});
  add(1,1,'Confraternização Universal','nacional');
  const easter=easterSunday(year),goodFriday=new Date(year,easter.getMonth(),easter.getDate()-2);
  add(goodFriday.getMonth()+1,goodFriday.getDate(),'Paixão de Cristo','nacional');
  add(4,21,'Tiradentes','nacional');
  add(4,23,'Dia de São Jorge','rj');
  add(5,1,'Dia do Trabalho','nacional');
  add(9,7,'Independência do Brasil','nacional');
  add(10,12,'Nossa Senhora Aparecida','nacional');
  add(11,2,'Finados','nacional');
  add(11,15,'Proclamação da República','nacional');
  if(year>=2024)add(11,20,'Dia Nacional de Zumbi e da Consciência Negra','nacional');
  add(12,25,'Natal','nacional');
  cache.set(year,holidays);
  return holidays;
}
export function holidayForKey(key){return holidayMapForYear(Number(String(key).slice(0,4))).get(key)||null}
// Título do mês igual nos três calendários: "Outubro de 2026" (sem o "De" maiúsculo do text-transform).
const monthFmt=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});
export function monthTitle(date){const text=monthFmt.format(date);return text.charAt(0).toUpperCase()+text.slice(1)}
// Dia do OUTRO mês que um arraste alcançaria ao trocar de mês: 1º dia do próximo (dir>0) ou último do anterior (dir<0).
export function monthCrossKey(visibleMonth,dir){const d=dir>0?new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1):new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),0);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
