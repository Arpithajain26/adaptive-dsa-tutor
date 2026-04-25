import React, { useState } from 'react';
import TopicSelector from './TopicSelector';
import Chat from './Chat';
import CodeEditor from './CodeEditor';
import Progress from './Progress';
import { Code2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LearnSession() {
  const [screen, setScreen] = useState('select'); // 'select' | 'chat' | 'code'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [initialQuestion, setInitialQuestion] = useState('');
  const [initialBoilerplate, setInitialBoilerplate] = useState('');
  const [initialVisualization, setInitialVisualization] = useState('');
  const [initialTestCases, setInitialTestCases] = useState([]);
  const [scoreData, setScoreData] = useState({ level: 'Beginner', score: 0, streak: 0 });
  const [questionNum, setQuestionNum] = useState(1);

  const handleStartTopic = (topic, firstQuestion, boilerplate, visualization, testCases) => {
    setSelectedTopic(topic);
    setInitialQuestion(firstQuestion);
    setInitialBoilerplate(boilerplate);
    setInitialVisualization(visualization);
    setInitialTestCases(testCases);
    setScreen('code'); // Default to Code Editor mode
  };

  const handleNextFromEditor = (data) => {
    setInitialQuestion(data.question);
    setInitialBoilerplate(data.boilerplate || '');
    setInitialVisualization(data.visualization || '');
    setInitialTestCases(data.testCases || []);
    if (data.topic) setSelectedTopic(data.topic);
    if (data.level) setCurrentLevel(data.level);
    setQuestionNum(q => q + 1);
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full min-h-screen">
      {(screen === 'chat' || screen === 'code') && <Progress scoreData={scoreData} setScoreData={setScoreData} />}

      {/* Mode Toggle (visible in chat/code screens) */}
      {(screen === 'chat' || screen === 'code') && (
        <div className="absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#111118] border border-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setScreen('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              screen === 'code' ? 'bg-primary/20 text-primary' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Code2 size={12} /> Code Editor
          </button>
          <button
            onClick={() => setScreen('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              screen === 'chat' ? 'bg-primary/20 text-primary' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageSquare size={12} /> Chat Mode
          </button>
        </div>
      )}
      
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

        {screen === 'code' && (
          <CodeEditor
            question={initialQuestion}
            topic={selectedTopic}
            level={currentLevel}
            testCases={initialTestCases}
            visualization={initialVisualization}
            boilerplate={initialBoilerplate}
            onNextQuestion={handleNextFromEditor}
            scoreData={scoreData}
            setScoreData={setScoreData}
            questionNum={questionNum}
          />
        )}
      </main>
    </div>
  );
}
