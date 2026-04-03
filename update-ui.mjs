import fs from 'fs';

let content = fs.readFileSync('src/app/planta/[brand]/page.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 md:grid-cols-3 gap-4">([\s\S]*?){\/\* Mensaje Largo \*\/}/;

const newGrid = `<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ioTags.length > 0 ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Estado Conexión</span>
                    <span className={\`text-lg font-black mt-2 shadow-sm drop-shadow-lg \${plcData?.estatusGeneral?.includes('OPERATIVO') ? 'text-green-400' : 'text-red-400'}\`}>
                      {plcData?.estatusGeneral ?? 'No Conectado'}
                    </span>
                  </div>
                  {ioTags.map((tag) => (
                    <div key={tag.id || tag.name} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                      <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{tag.group ? \`\${tag.group} - \` : ''}{tag.name}</span>
                      <span className="text-3xl font-black text-white">
                        {plcData?.[tag.name] !== undefined ? plcData[tag.name] : '--'}
                        {tag.type.toLowerCase().includes('real') && <span className="text-lg text-white/40"> ±</span>}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Cuadro de Sensor 1 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Temperatura CPU</span>
                    <span className="text-3xl font-black text-white">{plcData?.temperaturaCpu ?? '--'}<span className="text-lg text-white/40">°C</span></span>     
                  </div>
                  {/* Cuadro de Sensor 2 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Presión Sistema</span>
                    <span className="text-3xl font-black text-white">{plcData?.presionSistema ?? '--'}<span className="text-lg text-white/40">bar</span></span>     
                  </div>
                  {/* Cuadro de Sensor 3 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Estatus General</span>
                    <span className={\`text-lg font-black mt-2 shadow-sm drop-shadow-lg \${plcData?.estatusGeneral === 'OPERATIVO' ? 'text-green-400' : 'text-red-400'}\`}>
                      {plcData?.estatusGeneral ?? '--'}
                    </span>
                  </div>
                  {/* Cuadro de Sensor 4 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Ciclos / Hora</span>
                    <span className="text-3xl font-black text-white">{plcData?.ciclosPorHora?.toLocaleString() ?? '--'}</span>
                  </div>
                </>
              )}
              {/* Mensaje Largo */}`;

content = content.replace(regex, newGrid);

fs.writeFileSync('src/app/planta/[brand]/page.tsx', content);
console.log('UI grid updated properly.');
