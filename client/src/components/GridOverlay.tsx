interface GridOverlayProps {
  spacing?: number;
  color?: string;
  opacity?: number;
}

export default function GridOverlay({ 
  spacing = 10, 
  color = '#00ff00',
  opacity = 0.3 
}: GridOverlayProps) {
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 9999,
        backgroundImage: `
          linear-gradient(to right, ${color} 1px, transparent 1px),
          linear-gradient(to bottom, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${spacing}px ${spacing}px`,
        opacity: opacity
      }}
      data-testid="grid-overlay"
    />
  );
}
