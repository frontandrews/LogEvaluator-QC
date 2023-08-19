import React, { useState } from 'react';
import { evaluateLogFile, FILE_TYPES } from './lib/SensorEvaluation';
import ReactJson from 'react-json-view';
import './App.css';

function App() {
  const [logResults, setLogResults] = useState<null | {[key: string]: string}>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [performanceTime, setPerformanceTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase() as FILE_TYPES;

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const startTime = performance.now();

        const results = evaluateLogFile(content, fileType);
        const endTime = performance.now();
        const time = ((endTime - startTime) / 1000); 

        setLogResults(results);
        setErrorMessage(null);
        setPerformanceTime(time.toFixed(5));
      } catch (error: any) {
        setErrorMessage(error.message);
        setLogResults(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
};

  return (
    <div className="App">
      <div className="App-content">
        <h1>Log Evaluator</h1>

        <div className='content-upload'>
          <label htmlFor="fileInput">Upload</label>
          {!isLoading && <input id="fileInput" type="file" accept=".json, .txt" onChange={handleFileChange} />}
        </div>

        {isLoading && <div className="loading-message">Loading...</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {logResults && (
          <div>
            <h2>Results:</h2>
            <ReactJson 
              src={logResults} 
              theme="twilight"  
              displayDataTypes={false}
              enableClipboard={false}
            />
            <p>Performance: {performanceTime} seconds</p> 
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
