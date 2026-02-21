import { NextRequest, NextResponse } from 'next/server';

const RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY || '';
const BASE_URL = 'https://www.runninghub.ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // 1. Check Status
    const statusResponse = await fetch(`${BASE_URL}/task/openapi/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: RUNNINGHUB_API_KEY,
        taskId
      })
    });

    const statusData = await statusResponse.json();
    
    if (statusData.code !== 0) {
       return NextResponse.json(statusData);
    }

    const status = statusData.data; // "RUNNING", "SUCCESS", "FAILED", etc.

    if (status === 'SUCCESS') {
        // 2. Fetch Outputs
        const outputResponse = await fetch(`${BASE_URL}/task/openapi/outputs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: RUNNINGHUB_API_KEY,
                taskId
            })
        });
        
        const outputData = await outputResponse.json();
        return NextResponse.json({
            status,
            outputs: outputData
        });
    }

    return NextResponse.json({ status });

  } catch (error: any) {
    console.error('Error in check-status proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
