
const fs = require('fs');
let content = fs.readFileSync('src/app/planta/[brand]/page.tsx', 'utf8');

// Update load logic
content = content.replace(/setNewPlcName\\(config\\.name\\);(?:.*?)(?=} else {)/s, 'setNewPlcName(config.name);\\n        setIoTags(config.io_config || []);\\n      ');

content = content.replace(/setNewPlcName\\(''\\);\\s*}/s, 'setNewPlcName(\\'\\');\\n        setIoTags([]);\\n      }');

// Update save logic
content = content.replace(/alert\\(.?[Â¡]?Configuraci.*?a Supabase .*?\\);\\s*setShowConfigurator\\(false\\);/s,
\if (selectedPlcId) {
                      setIsSaving(true);
                      supabase.from('plcs').update({ io_config: ioTags }).eq('id', selectedPlcId).then(({ error }) => {
                        setIsSaving(false);
                        if (error) { alert('Error al guardar I/O: ' + error.message); return; }
                        alert('¡Mapa I/O guardado en Supabase!');
                        setSavedPLCs(prev => prev.map(p => p.id === selectedPlcId ? { ...p, io_config: ioTags } : p));
                        setShowConfigurator(false);
                      });
                    } else {
                      alert('Guarda el PLC (arriba) antes de mapear variables.');
                      setShowConfigurator(false);
                    }\);

fs.writeFileSync('src/app/planta/[brand]/page.tsx', content);
console.log('Update complete');

