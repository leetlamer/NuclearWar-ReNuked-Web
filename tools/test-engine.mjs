import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const cmake=process.env.CMAKE || (existsSync('.toolchain/python/bin/cmake')?path.resolve('.toolchain/python/bin/cmake'):'cmake');
const ctest=path.isAbsolute(cmake)?path.join(path.dirname(cmake),'ctest'):'ctest';
function run(exe,args){const r=spawnSync(exe,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
run(cmake,['-S','wasm','-B','build/native','-DCMAKE_BUILD_TYPE=Release']);
run(cmake,['--build','build/native','--parallel','6']);
run(ctest,['--test-dir','build/native','--output-on-failure']);
const sdk=process.env.EMSDK || path.resolve('.toolchain/emsdk');
run(cmake,['-S','wasm','-B','build/wasm-tests','-DCMAKE_BUILD_TYPE=Release',`-DCMAKE_TOOLCHAIN_FILE=${sdk}/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake`]);
run(cmake,['--build','build/wasm-tests','--parallel','6']);
run(ctest,['--test-dir','build/wasm-tests','--output-on-failure']);
mkdirSync('build',{recursive:true});
for(const [exe,args,file] of [[path.resolve('build/native/state_trace'),[],'build/native-state-trace.txt'],[process.execPath,['build/wasm-tests/state_trace.cjs'],'build/wasm-state-trace.txt']]){
 const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:32*1024*1024});if(r.status!==0)throw Error(r.stderr);writeFileSync(file,r.stdout);
}
