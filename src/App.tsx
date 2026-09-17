import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { HostDashboard } from './components/host/HostDashboard';
import { PresentationScreen } from './components/presentation/PresentationScreen';

const MainApp: React.FC = () => {
  const { isStageMode } = useGame();
  const [isEmbeddedPresenting, setIsEmbeddedPresenting] = useState(false);

  // If opened via URL query parameter ?stage=true, always render full Stage mode
  if (isStageMode) {
    return <PresentationScreen />;
  }

  // If host activated embedded presentation mode
  if (isEmbeddedPresenting) {
    return (
      <PresentationScreen
        onCloseEmbedded={() => setIsEmbeddedPresenting(false)}
      />
    );
  }

  // Otherwise, render Host Dashboard
  return (
    <HostDashboard
      onOpenPresentation={() => setIsEmbeddedPresenting(true)}
    />
  );
};

export function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}

export default App;
