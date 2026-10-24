var fs=require('fs');
var p='C:/temp/er-n567/index.html';
fs.copyFileSync('C:/temp/er-n566/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* spAll 守卫 */
var old="function spAll(){if(!_spAllMemo)_spAllMemo=ERDATA.species.filter(function(x){return isValidSp(x)});return _spAllMemo}";
var neu="function spAll(){if(!ERDATA.species||!ERDATA.species.length)return [];if(!_spAllMemo)_spAllMemo=ERDATA.species.filter(function(x){return isValidSp(x)});return _spAllMemo}";
if(c.indexOf(old)<0){console.log('SPALL NOT FOUND');process.exit(1)}
c=c.replace(old,neu);

/* speedPctiles 守卫 */
var re=/function speedPctiles\(\)\{if\(_spdPct\)return _spdPct;/;
var neu2="function speedPctiles(){if(!ERDATA.species||!ERDATA.species.length)return {n:0,P50:0,P75:0,P90:0,P95:0,P99:0};if(_spdPct)return _spdPct;";
if(!re.test(c)){console.log('SPEEDPCTILES NOT FOUND');process.exit(1)}
c=c.replace(re,neu2);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
