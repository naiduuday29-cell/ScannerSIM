import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SimulatorProvider } from './context/SimulatorContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { MainCanvas } from './components/canvas/MainCanvas';
import { ViewCube } from './components/navigation/ViewCube';
import { TransportControls } from './components/controls/TransportControls';
import { TelemetryDashboard } from './components/analysis/TelemetryDashboard';
import { CanvasToolbar } from './components/controls/CanvasToolbar';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SimulatorProvider>
        <div className="w-screen h-screen flex flex-col bg-industrial-950 overflow-hidden font-sans select-none">
          {/* Enterprise Studio Header */}
          <Header />

          {/* Main Workspace Layout */}
          <div className="flex-1 flex relative overflow-hidden">
            {/* Collapsible Left Configuration Sidebar */}
            <Sidebar />

            {/* 3D WebGL Viewport Context */}
            <main className="flex-1 relative h-full w-full overflow-hidden bg-industrial-950">
              {/* Primary Three.js 3D Canvas */}
              <MainCanvas />

              {/* Floating Quick Action Toolbar (Top-Left) */}
              <CanvasToolbar />

              {/* 3D View Cube & Orientation Navigator (Top-Right) */}
              <ViewCube />

              {/* Simulation Motion Timeline & Transport (Bottom-Center) */}
              <TransportControls />

              {/* Real-Time Telemetry & Coverage Analysis (Bottom-Right) */}
              <TelemetryDashboard />
            </main>
          </div>
        </div>
      </SimulatorProvider>
    </AuthProvider>
  );
};

export default App;