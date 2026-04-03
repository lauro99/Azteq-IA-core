import fs from 'fs';

let content = fs.readFileSync('src/app/planta/[brand]/page.tsx', 'utf8');

const hookString = `  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/plc/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand: brandId,
              ip: ipAddress,
              port,
              rack: Number(rack),
              slot: Number(slot),
              isCloud: connectionMode === 'cloud',
              mockMode,
              ioTags
            })
          });
          const data = await res.json();
          if (data.success) {
            setPlcData(data.data);
          } else {
            console.error('Polling error:', data.error);
          }
        } catch (error) {
          console.error('Polling network error:', error);
        }
      }, 2000); // 2 segundos (refresco en tiempo real)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, brandId, ipAddress, port, rack, slot, connectionMode, mockMode, ioTags]);

  if (loading) {`;

content = content.replace('  if (loading) {', hookString);

// Also let's handle the disconnection state optionally, but user can re-trigger connection. If we want a button to disconnect we would add it, but right now polling alone is fine.

fs.writeFileSync('src/app/planta/[brand]/page.tsx', content);
console.log('Polling effect applied');
