import React, { useState } from 'react';
import TopicSelector from './TopicSelector';
import Chat from './Chat';
import Progress from './Progress';

export default function LearnSession() {
  const [screen, setScreen] = useState('select'); // 'select' | 'chat'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [initialQuestion, setInitialQuestion] = useState('');
  const [initialBoilerplate, setInitialBoilerplate] = useState('');
  const [initialVisualization, setInitialVisualization] = useState('');
  const [initialTestCases, setInitialTestCases] = useState([]);
  const [scoreData, setScoreData] = useState({ level: 'Beginner', score: 0, streak: 0 });

  const handleStartTopic = (topic, firstQuestion, boilerplate, visualization, testCases) => {
    setSelectedTopic(topic);
    setInitialQuestion(firstQuestion);
    setInitialBoilerplate(boilerplate);
    setInitialVisualization(visualization);
    setInitialTestCases(testCases);
    setScreen('chat');
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full min-h-screen">
      {screen === 'chat' && <Progress scoreData={scoreData} setScoreData={setScoreData} />}
      
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {screen === 'select' && (
          <TopicSelector onStart={handleStartTopic} />
        )}
        
        {screen === 'chat' && (
          <Chat 
            topic={selectedTopic} 
            initialQuestion={initialQuestion}
            initialBoilerplate={initialBoilerplate}
            initialVisualization={initialVisualization}
            initialTestCases={initialTestCases}
            scoreData={scoreData} 
            setScoreData={setScoreData} 
          />
        )}
      </main>
    </div>
  );
}
