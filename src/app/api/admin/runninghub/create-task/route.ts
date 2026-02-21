import { NextRequest, NextResponse } from 'next/server';

const RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY || '95d3c787224840998c28fd0f2da9b4a2';
const BASE_URL = 'https://www.runninghub.ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Inject API Key if not present
    if (!body.apiKey) {
      body.apiKey = RUNNINGHUB_API_KEY;
    }

    console.log('Proxying Create Task request to RunningHub (apiKey hidden):', {
      ...body,
      apiKey: '***'
    });

    const response = await fetch(`${BASE_URL}/task/openapi/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('RunningHub Create Task Response:', data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in create-task proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
