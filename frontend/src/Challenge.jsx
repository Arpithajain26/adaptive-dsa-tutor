import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Code2, Info, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CHALLENGE = {
  title: "Two Sum",
  difficulty: "Easy",
  description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists."
  ],
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]"
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]"
    }
  ],
  boilerplate: `function twoSum(nums, target) {
  // Write your logic here
  
}`,
  testCases: [
    { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
    { nums: [3, 2, 4], target: 6, expected: [1, 2] },
    { nums: [3, 3], target: 6, expected: [0, 1] }
  ]
};

const Challenge = ({ onBack }) => {
  const [code, setCode] = useState(CHALLENGE.boilerplate);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = () => {
    setIsRunning(true);
    setResults(null);

    setTimeout(() => {
      try {
        // Create a function from the user's code
        // We wrap it to return the twoSum function
        const userFunc = new Function(`
          ${code}
          return twoSum;
        `)();

        if (typeof userFunc !== 'function') {
          throw new Error("Function 'twoSum' not found or is not a function.");
        }

        const testResults = CHALLENGE.testCases.map((tc, index) => {
          try {
            const actual = userFunc(tc.nums, tc.target);
            
            // Compare arrays (ignoring order or checking specifically)
            const isCorrect = Array.isArray(actual) && 
                              actual.length === 2 && 
                              actual.every(val => tc.expected.includes(val)) &&
                              tc.expected.every(val => actual.includes(val));

            return {
              id: index + 1,
              input: `nums = [${tc.nums}], target = ${tc.target}`,
              expected: JSON.stringify(tc.expected),
              actual: JSON.stringify(actual),
              passed: isCorrect
            };
          } catch (err) {
            return {
              id: index + 1,
              input: `nums = [${tc.nums}], target = ${tc.target}`,
              expected: JSON.stringify(tc.expected),
              actual: "Error: " + err.message,
              passed: false
            };
          }
        });

        setResults(testResults);
      } catch (err) {
        setResults([{
          id: "Error",
          input: "N/A",
          expected: "N/A",
          actual: err.message,
          passed: false,
          isSystemError: true
        }]);
      } finally {
        setIsRunning(false);
      }
    }, 800);
  };

  const allPassed = results && results.every(r => r.passed);

  return (
    <div className="challenge-view flex flex-col h-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight className="rotate-180 w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="text-indigo-400" /> {CHALLENGE.title}
          </h2>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold uppercase">
            {CHALLENGE.difficulty}
          </span>
        </div>
        <button 
          onClick={runCode} 
          disabled={isRunning}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          {isRunning ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          Run Code
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Side: Description */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" /> Description
            </h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              {CHALLENGE.description}
            </p>
            
            <div className="space-y-4">
              {CHALLENGE.examples.map((ex, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Example {i + 1}</div>
                  <div className="space-y-1 font-mono text-sm">
                    <div className="flex gap-2">
                      <span className="text-indigo-400">Input:</span>
                      <span className="text-slate-300">{ex.input}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-emerald-400">Output:</span>
                      <span className="text-slate-300">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="flex gap-2 mt-2 italic text-slate-400">
                        <span>Explanation:</span>
                        <span>{ex.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Constraints:</h4>
              <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                {CHALLENGE.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Editor & Results */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 glass rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            <div className="bg-slate-800/50 px-4 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">JavaScript Editor</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 font-mono text-sm resize-none focus:outline-none text-indigo-100 leading-relaxed"
              spellCheck="false"
              autoFocus
            />
          </div>

          {/* Results Area */}
          <div className={`h-64 glass rounded-2xl border border-white/10 overflow-hidden flex flex-col ${results ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} transition-all duration-300`}>
            <div className="bg-slate-800/50 px-4 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Test Results</span>
              {results && !results[0].isSystemError && (
                <span className={`text-xs font-bold ${allPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {results.filter(r => r.passed).length} / {results.length} Passed
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {results?.map((res, i) => (
                <div key={i} className={`p-3 rounded-xl border ${res.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {res.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      <span className={`text-sm font-bold ${res.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {res.isSystemError ? 'Compilation Error' : `Test Case ${res.id}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                    {!res.isSystemError && (
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-16">Input:</span>
                        <span className="text-slate-300">{res.input}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-16">{res.isSystemError ? 'Error:' : 'Actual:'}</span>
                      <span className={res.passed ? 'text-slate-300' : 'text-rose-300'}>{res.actual}</span>
                    </div>
                    {!res.passed && !res.isSystemError && (
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-16">Expected:</span>
                        <span className="text-emerald-400">{res.expected}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!results && (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                  Run your code to see results here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenge;
