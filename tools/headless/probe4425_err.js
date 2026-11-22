const H = require('./harness.js');
const { ERDATA } = H;
const s = ERDATA.species.find(x => x.id === '245');
try {
  console.log(autoWallAbi(s));
} catch (e) {
  console.log('autoWallAbi error:', e.message);
}
try {
  console.log('wallAbiNameOk 北风:', wallAbiNameOk('北风'));
} catch (e) {
  console.log('wallAbiNameOk error:', e.message);
}
// 北风 ability id 348 desc
console.log('ABI 348:', JSON.stringify(ERDATA.abilities[348]));
