import fs from 'fs';

let content = fs.readFileSync('src/app/planta/[brand]/page.tsx', 'utf8');

// Update load logic
content = content.replace(/setNewPlcName\(config\.name\);(?:.*?)(\s*)} else {/s, `setNewPlcName(config.name);
        setIoTags(config.io_config || []);$1} else {`);

content = content.replace(/setNewPlcName\(''\);\s*}/s, `setNewPlcName('');
        setIoTags([]);
      }`);

// Update save logic
content = content.replace(/alert\(.?[Â¡]?[cC]onfiguraci.*?a Supabase .*?\);\s*setShowConfigurator\(false\);/, `if (selectedPlcId) {
                      setIsSaving(true);
                      supabase.from('plcs').update({ io_config: ioTags }).eq('id', selectedPlcId).then(({ error }) => {
                        setIsSaving(false);
                        if (error) { alert('Error al guardar I/O: ' + error.message); return; }
                        alert('¡Mapa I/O guardado en Supabase!');
                        setSavedPLCs(prev => prev.map(p => p.id === selectedPlcId ? { ...p, io_config: ioTags } : p));
                        setShowConfigurator(false);
                      });
                    } else {
                      alert('Primero guarda el PLC (arriba) antes de mapear variables.');
                      setShowConfigurator(false);
                    }`);

fs.writeFileSync('src/app/planta/[brand]/page.tsx', content);
console.log('File updated successfully!');
