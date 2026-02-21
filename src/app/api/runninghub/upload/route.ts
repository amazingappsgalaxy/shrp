
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // RunningHub API Key
    const apiKey = process.env.RUNNINGHUB_API_KEY;
    if (!apiKey) {
      console.error('RUNNINGHUB_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Prepare FormData for RunningHub
    const runningHubFormData = new FormData();
    runningHubFormData.append('file', file);
    runningHubFormData.append('apikey', apiKey);
    runningHubFormData.append('apiKey', apiKey);
    
    // Upload to RunningHub
    // Using the /task/openapi/upload endpoint as identified
    const response = await fetch('https://www.runninghub.cn/task/openapi/upload', {
      method: 'POST',
      body: runningHubFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub upload failed:', response.status, errorText);
      return NextResponse.json({ error: `RunningHub upload failed: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
            
            // RunningHub returns { code: 0, msg: 'success', data: { fileName: 'api/...' } }
            const remoteKey = data.data?.fileName || data.fileName;
            
            return NextResponse.json({
              success: true,
              url: null, // No public URL available immediately
              key: remoteKey,
              originalName: file.name,
              size: file.size
            });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
