import ReceiptCanvas from './components/ReceiptCanvas';

export default function App() {
  return (
    <>
      {/* Loading overlay (fades out after scene loads) */}
      <div className="loading-overlay">
        <span className="loading-text">initializing physics</span>
        <div className="loading-bar" />
      </div>

      {/* Decorative corner frame */}
      <div className="corner-frame" />

      {/* Title block — top left */}
      <div className="title-block">
        <h1 className="title">
          receipt<em>UI</em>
        </h1>
        <p className="subtitle">Verlet Cloth Simulation &middot; Interactive Paper Physics</p>
      </div>

      {/* Physics label — top right */}
      <div className="physics-tag">
        <span>React &middot; Three.js &middot; WebGL</span>
      </div>

      {/* 3D canvas */}
      <ReceiptCanvas className="scene" />

      {/* Interaction hints — bottom center */}
      <div className="hints">
        <div className="hint-item">
          <span className="hint-dot" />
          <span>左键拖拽 &middot; Drag to bend</span>
        </div>
        <span className="hint-sep" />
        <div className="hint-item">
          <span className="hint-dot" />
          <span>右键旋转 &middot; Orbit view</span>
        </div>
      </div>

      {/* Version — bottom right */}
      <div className="version-badge">
        <span>v1.0.0</span>
      </div>
    </>
  );
}
