var fs=require('fs');
var p='C:/temp/er-n566/index.html';
fs.copyFileSync('C:/temp/er-n565/index.html',p);
var c=fs.readFileSync(p,'utf8');

/* abiOwners 加 species 就绪守卫 */
var re=/function abiOwners\(\)\{\s*if\(_abiOwners\)return _abiOwners;\s*var o=\{\};\s*ERDATA\.species\.forEach/;
var neu="function abiOwners(){\n  if(_abiOwners)return _abiOwners;\n  if(!ERDATA.species||!ERDATA.species.length)return {};\n  var o={};\n  ERDATA.species.forEach";
if(!re.test(c)){console.log('ABIOWNERS NOT FOUND');process.exit(1)}
c=c.replace(re,neu);

fs.writeFileSync(p,c);
console.log('patched size='+fs.statSync(p).size);
