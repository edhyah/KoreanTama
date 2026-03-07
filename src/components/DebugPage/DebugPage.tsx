import { useState } from 'react';
import { EmotionsGrid } from './EmotionsGrid';
import { AnimationSandbox } from './AnimationSandbox';
import { ReactionTester } from './ReactionTester';

type TabName = 'emotions' | 'sandbox' | 'reactions';

interface DebugPageProps {
  onClose: () => void;
}

export function DebugPage({ onClose }: DebugPageProps) {
  const [activeTab, setActiveTab] = useState<TabName>('emotions');

  return (
    <div className="debug-page">
      <div className="debug-page-scroll">
        <div className="debug-page-header">
          <h1>Debug Page</h1>
          <button onClick={onClose} className="debug-page-close">
            Exit (d)
          </button>
        </div>

        <div className="debug-tabs">
          <button
            onClick={() => setActiveTab('emotions')}
            className={`debug-tab ${activeTab === 'emotions' ? 'active' : ''}`}
          >
            Emotions Grid
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`debug-tab ${activeTab === 'sandbox' ? 'active' : ''}`}
          >
            Animation Sandbox
          </button>
          <button
            onClick={() => setActiveTab('reactions')}
            className={`debug-tab ${activeTab === 'reactions' ? 'active' : ''}`}
          >
            Reaction Tester
          </button>
        </div>

        <div className="debug-tab-content">
          {activeTab === 'emotions' && <EmotionsGrid />}
          {activeTab === 'sandbox' && <AnimationSandbox />}
          {activeTab === 'reactions' && <ReactionTester />}
        </div>
      </div>
    </div>
  );
}
