'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ApiModelTester() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE'); // IDLE, SUBMITTING, RUNNING, SUCCESS, FAILED
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleLoadExample = () => {
    const example = {
      "workflowId": "2023005806844710914",
      "nodeInfoList": [
        {
          "nodeId": "97",
          "fieldName": "image",
          "fieldValue": "https://i.postimg.cc/jjm6CGTD/8d4b95bc-73c3-46d5-a89c-77c61e3b8d6f.png"
        },
        {
          "nodeId": "140",
          "fieldName": "text",
          "fieldValue": "high quality, detailed, enhanced"
        }
      ]
    };
    setJsonInput(JSON.stringify(example, null, 2));
  };

  const handleSubmit = async () => {
    if (!jsonInput) {
      alert('Please enter JSON payload');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(jsonInput);
    } catch (e) {
      alert('Invalid JSON');
      return;
    }

    setLoading(true);
    setStatus('SUBMITTING');
    setResult(null);
    setLogs([]);
    setTaskId(null);

    addLog('Submitting task to RunningHub...');

    try {
      const res = await fetch('/api/admin/runninghub/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.code === 0 && data.data?.taskId) {
        const newTaskId = data.data.taskId;
        setTaskId(newTaskId);
        addLog(`Task Created! ID: ${newTaskId}`);
        setStatus('RUNNING');
      } else {
        addLog(`Error creating task: ${JSON.stringify(data)}`);
        setStatus('FAILED');
        setLoading(false);
      }
    } catch (err: any) {
      addLog(`Network Error: ${err.message}`);
      setStatus('FAILED');
      setLoading(false);
    }
  };

  // Polling Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'RUNNING' && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/runninghub/check-status?taskId=${taskId}`);
          const data = await res.json();
          
          if (data.status) {
            addLog(`Status Check: ${data.status}`);
            
            if (data.status === 'SUCCESS') {
              setStatus('SUCCESS');
              setResult(data);
              setLoading(false);
              addLog('Task Completed Successfully!');
            } else if (data.status === 'FAILED' || data.status === 'ERROR') {
              setStatus('FAILED');
              setResult(data);
              setLoading(false);
              addLog('Task Failed.');
            }
          } else if (data.code !== 0) {
             // Handle API error response structure if check-status proxies it directly
             addLog(`API Error: ${data.msg || JSON.stringify(data)}`);
          }

        } catch (e: any) {
          addLog(`Polling Error: ${e.message}`);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [status, taskId]);

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">RunningHub Raw API Tester</h1>
        <Button onClick={handleLoadExample} variant="outline" className="text-black bg-white hover:bg-gray-200 border-0">Load Example</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-4 space-y-4 bg-gray-900 border-gray-800 text-white">
          <Label className="text-gray-300">Request JSON Payload (POST /task/openapi/create)</Label>
          <Textarea 
            className="font-mono text-xs h-[500px] bg-slate-950 text-green-400 border-slate-800 focus:ring-green-500/20"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{ "workflowId": "...", "nodeInfoList": [...] }'
          />
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Processing...' : 'Send Request'}
          </Button>
        </Card>

        {/* Output Section */}
        <Card className="p-4 space-y-4 flex flex-col h-[600px] bg-gray-900 border-gray-800 text-white">
          <Label className="text-gray-300">Status & Logs</Label>
          <div className="bg-black border border-gray-800 text-green-400 p-4 rounded-md font-mono text-xs h-48 overflow-y-auto">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
            {logs.length === 0 && <span className="text-gray-600">Ready...</span>}
          </div>

          <Label className="text-gray-300">Result Output</Label>
          <div className="bg-black border border-gray-800 p-4 rounded-md overflow-auto flex-1 font-mono text-xs text-blue-300">
             {result ? (
               <pre>{JSON.stringify(result, null, 2)}</pre>
             ) : (
               <div className="text-gray-600 italic">No result yet</div>
             )}
          </div>
        </Card>
      </div>

      {/* Image Gallery */}
      {result?.outputs?.data && Array.isArray(result.outputs.data) && (
        <Card className="p-6 bg-gray-900 border-gray-800 text-white">
          <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.outputs.data.map((item: any, idx: number) => (
              item.fileUrl ? (
                <div key={idx} className="border border-gray-800 rounded p-2 bg-black">
                  <div className="text-xs text-gray-400 mb-1">Node ID: {item.nodeId}</div>
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                    <img src={item.fileUrl} alt={`Output ${item.nodeId}`} className="w-full h-auto rounded hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              ) : null
            ))}
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
