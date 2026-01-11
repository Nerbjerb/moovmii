interface GridOverlayProps {
  spacing?: number;
  color?: string;
  opacity?: number;
  showMarkers?: boolean;
  markerInterval?: number;
}

export default function GridOverlay({ 
  spacing = 50, 
  color = '#00ff00',
  opacity = 0.3,
  showMarkers = true,
  markerInterval = 100
}: GridOverlayProps) {
  const width = 800;
  const height = 480;
  
  const horizontalMarkers = [];
  const verticalMarkers = [];
  
  for (let x = 0; x <= width; x += markerInterval) {
    horizontalMarkers.push(x);
  }
  
  for (let y = 0; y <= height; y += markerInterval) {
    verticalMarkers.push(y);
  }

  return (
    <>
      <div 
        className="fixed pointer-events-none"
        style={{ 
          zIndex: 9999,
          width: `${width}px`,
          height: `${height}px`,
          left: 0,
          top: 0,
          backgroundImage: `
            linear-gradient(to right, ${color} 1px, transparent 1px),
            linear-gradient(to bottom, ${color} 1px, transparent 1px)
          `,
          backgroundSize: `${spacing}px ${spacing}px`,
          opacity: opacity
        }}
        data-testid="grid-overlay"
      />
      
      {showMarkers && (
        <>
          {/* Top edge markers */}
          <div 
            className="fixed pointer-events-none"
            style={{ 
              zIndex: 10000,
              left: 0,
              top: '-25px',
              width: `${width}px`,
              height: '25px',
              display: 'flex',
              position: 'relative'
            }}
          >
            {horizontalMarkers.map(x => (
              <div 
                key={`top-${x}`}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: 0,
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  color: '#ff0',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: '0 0 2px #000, 0 0 4px #000'
                }}
              >
                {x}
                <div style={{ 
                  position: 'absolute',
                  left: '50%',
                  bottom: '-5px',
                  width: '1px',
                  height: '5px',
                  backgroundColor: '#ff0'
                }} />
              </div>
            ))}
          </div>
          
          {/* Bottom edge markers */}
          <div 
            className="fixed pointer-events-none"
            style={{ 
              zIndex: 10000,
              left: 0,
              top: `${height}px`,
              width: `${width}px`,
              height: '25px',
              display: 'flex',
              position: 'relative'
            }}
          >
            {horizontalMarkers.map(x => (
              <div 
                key={`bottom-${x}`}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: '5px',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  color: '#ff0',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: '0 0 2px #000, 0 0 4px #000'
                }}
              >
                <div style={{ 
                  position: 'absolute',
                  left: '50%',
                  top: '-5px',
                  width: '1px',
                  height: '5px',
                  backgroundColor: '#ff0'
                }} />
                {x}
              </div>
            ))}
          </div>
          
          {/* Left edge markers */}
          <div 
            className="fixed pointer-events-none"
            style={{ 
              zIndex: 10000,
              left: '-35px',
              top: 0,
              width: '35px',
              height: `${height}px`,
              position: 'relative'
            }}
          >
            {verticalMarkers.map(y => (
              <div 
                key={`left-${y}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: `${y}px`,
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  color: '#ff0',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: '0 0 2px #000, 0 0 4px #000',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {y}
                <div style={{ 
                  marginLeft: '2px',
                  width: '5px',
                  height: '1px',
                  backgroundColor: '#ff0'
                }} />
              </div>
            ))}
          </div>
          
          {/* Right edge markers */}
          <div 
            className="fixed pointer-events-none"
            style={{ 
              zIndex: 10000,
              left: `${width}px`,
              top: 0,
              width: '35px',
              height: `${height}px`,
              position: 'relative'
            }}
          >
            {verticalMarkers.map(y => (
              <div 
                key={`right-${y}`}
                style={{
                  position: 'absolute',
                  left: '5px',
                  top: `${y}px`,
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  color: '#ff0',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: '0 0 2px #000, 0 0 4px #000',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{ 
                  marginRight: '2px',
                  width: '5px',
                  height: '1px',
                  backgroundColor: '#ff0'
                }} />
                {y}
              </div>
            ))}
          </div>
          
          {/* Border outline */}
          <div 
            className="fixed pointer-events-none"
            style={{
              zIndex: 9998,
              left: 0,
              top: 0,
              width: `${width}px`,
              height: `${height}px`,
              border: '2px solid #ff0',
              boxSizing: 'border-box'
            }}
          />
        </>
      )}
    </>
  );
}
