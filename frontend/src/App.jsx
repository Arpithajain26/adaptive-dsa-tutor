import React, { useState } from 'react';
import TopicSelector from './components/TopicSelector';
import Chat from './components/Chat';
import Progress from './components/Progress';

function App() {
  const [screen, setScreen] = useState('select'); // 'select' | 'chat'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [scoreData, setScoreData] = useState({ level: 'Beginner', score: 0, streak: 0 });

  const handleStartTopic = (topic) => {
    setSelectedTopic(topic);
    setScreen('chat');
  };

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary selection:text-white flex flex-col">
      {screen === 'chat' && <Progress scoreData={scoreData} setScoreData={setScoreData} />}
      
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {screen === 'select' && (
          <TopicSelector onStart={handleStartTopic} />
        )}
        
        {screen === 'chat' && (
          <Chat 
            topic={selectedTopic} 
            scoreData={scoreData} 
            setScoreData={setScoreData} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
