import fetch from 'node-fetch';

// Test the simplified working configuration based on successful test results
const API_CONFIG = {
  apiKey: process.env.RUNNINGHUB_API_KEY || "",
  workflowId: "1969370493155483650",
  baseUrl: "https://www.runninghub.ai"
};

const testImageUrl = "https://i.postimg.cc/yYypwH5r/39bd9385-94ea-9b11-0198-8c09797bc3bd.jpg";

// Simplified working configuration (7 nodes total) - proven to work from tests
const SIMPLIFIED_WORKING_CONFIG = [
  // Core required nodes
  { nodeId: "97", fieldName: "image", fieldValue: testImageUrl },
  { nodeId: "90", fieldName: "steps", fieldValue: "10" },
  { nodeId: "85", fieldName: "megapixels", fieldValue: "10" },
  { nodeId: "142", fieldName: "boolean", fieldValue: "true" },

  // Additional workflow nodes (proven working configuration)
  { nodeId: "102", fieldName: "longer_side", fieldValue: "1024" },
  { nodeId: "139", fieldName: "image", fieldValue: testImageUrl },  // KEY: image field, not boolean
  { nodeId: "137", fieldName: "filename_prefix", fieldValue: "rh_high1_output" }
];

async function testSimplifiedWorkflow() {
  console.log('🧪 Testing SIMPLIFIED RH High1 Workflow (Proven Working)');
  console.log('======================================================');
  console.log(`📊 Total nodes: ${SIMPLIFIED_WORKING_CONFIG.length}`);
  console.log('🔧 Node configuration:');

  SIMPLIFIED_WORKING_CONFIG.forEach(node => {
    console.log(`   Node ${node.nodeId}: ${node.fieldName} = ${node.fieldValue === testImageUrl ? 'IMAGE_URL' : node.fieldValue}`);
  });

  const payload = {
    apiKey: API_CONFIG.apiKey,
    workflowId: API_CONFIG.workflowId,
    nodeInfoList: SIMPLIFIED_WORKING_CONFIG,
    addMetadata: true
  };

  try {
    console.log('\n🚀 Creating task with simplified working configuration...');

    const response = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.ai'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`📊 Status: ${response.status}`);

    if (data.code === 0 && data.data?.taskId) {
      console.log('✅ SUCCESS: Task created successfully!');
      console.log(`🆔 Task ID: ${data.data.taskId}`);
      console.log(`📋 Status: ${data.data.taskStatus}`);

      if (data.data.promptTips) {
        try {
          const tips = JSON.parse(data.data.promptTips);
          console.log(`🎯 Expected outputs: ${tips.outputs_to_execute.join(', ')}`);
          console.log(`❌ Node errors: ${Object.keys(tips.node_errors).length === 0 ? 'None' : JSON.stringify(tips.node_errors)}`);
        } catch (e) {
          console.log('⚠️  Could not parse prompt tips');
        }
      }

      // Poll for completion
      console.log('\n⏳ Polling for completion...');
      await pollTaskCompletion(data.data.taskId);

    } else {
      console.log('❌ FAILURE: Task creation failed');
      console.log(`💥 Error: ${data.msg}`);
    }

  } catch (error) {
    console.error('💥 API call failed:', error.message);
  }
}

async function pollTaskCompletion(taskId) {
  let attempts = 0;
  const maxAttempts = 24; // 2 minutes

  while (attempts < maxAttempts) {
    try {
      const statusResponse = await fetch('https://www.runninghub.ai/task/openapi/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': 'www.runninghub.ai'
        },
        body: JSON.stringify({
          apiKey: API_CONFIG.apiKey,
          taskId: taskId
        })
      });

      const statusData = await statusResponse.json();
      console.log(`🔍 Attempt ${attempts + 1}: ${statusData.data}`);

      if (statusData.data === 'SUCCESS') {
        console.log('\n✅ Task completed! Getting outputs...');
        await getTaskOutputs(taskId);
        break;
      } else if (statusData.data === 'FAILED') {
        console.log('\n❌ Task failed!');
        break;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      break;
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n⏰ Task timed out after 2 minutes');
  }
}

async function getTaskOutputs(taskId) {
  try {
    const outputResponse = await fetch('https://www.runninghub.ai/task/openapi/outputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.ai'
      },
      body: JSON.stringify({
        apiKey: API_CONFIG.apiKey,
        taskId: taskId
      })
    });

    const outputData = await outputResponse.json();

    if (outputData.code === 0 && outputData.data && outputData.data.length > 0) {
      console.log(`📸 Found ${outputData.data.length} outputs:`);

      outputData.data.forEach(output => {
        console.log(`  - Node ${output.nodeId}: ${output.fileUrl || 'no URL'}`);
      });

      // Check for final output from node 136
      const finalOutput = outputData.data.find(o => String(o.nodeId) === '136');
      if (finalOutput && finalOutput.fileUrl) {
        console.log(`\n🎯 FINAL OUTPUT (Node 136): ${finalOutput.fileUrl}`);

        if (finalOutput.fileUrl === testImageUrl) {
          console.log('❌ PROBLEM: Output URL same as input URL!');
        } else {
          console.log('✅ SUCCESS: Output URL different from input URL!');
          console.log('🎉 The simplified workflow is working correctly!');
          console.log('\n📋 CONFIG SUMMARY:');
          console.log('✅ This configuration is proven to work');
          console.log('✅ Uses 7 nodes (no area protection complexity)');
          console.log('✅ Node 139 uses "image" field, not "boolean"');
          console.log('✅ Produces different enhanced output');
        }
      } else {
        console.log('\n⚠️  No final output from node 136 found');
      }
    } else {
      console.log('❌ No outputs available');
    }

  } catch (error) {
    console.error('❌ Output fetch failed:', error.message);
  }
}

// Run the test
testSimplifiedWorkflow().catch(console.error);