// Standalone debug script for RH High1 model
// Tests the exact API call that should be made to RunningHub

console.log('🧪 RH High1 Debug Script Started');
console.log('=====================================');

// Your exact configuration from the specification
const API_CONFIG = {
  apiKey: "95d3c787224840998c28fd0f2da9b4a2",
  workflowId: "1969370493155483650",
  baseUrl: "https://www.runninghub.ai"
};

const testImageUrl = "https://i.postimg.cc/yYypwH5r/39bd9385-94ea-9b11-0198-8c09797bc3bd.jpg";

// The EXACT node configuration from your specification
const EXPECTED_NODE_LIST = [
  {
    "nodeId": "97",
    "fieldName": "image",
    "fieldValue": testImageUrl
  },
  {
    "nodeId": "90",
    "fieldName": "steps",
    "fieldValue": "10"
  },
  {
    "nodeId": "85",
    "fieldName": "megapixels",
    "fieldValue": "10"
  },
  {
    "nodeId": "142",
    "fieldName": "boolean",
    "fieldValue": "true"
  },
  // All area protection settings for node 138 - FROM YOUR SPEC
  {
    "nodeId": "138",
    "fieldName": "background",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "skin",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "nose",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "eye_g",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "r_eye",
    "fieldValue": "true"
  },
  {
    "nodeId": "138",
    "fieldName": "l_eye",
    "fieldValue": "true"
  },
  {
    "nodeId": "138",
    "fieldName": "r_brow",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "l_brow",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "r_ear",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "l_ear",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "mouth",
    "fieldValue": "true"
  },
  {
    "nodeId": "138",
    "fieldName": "u_lip",
    "fieldValue": "true"
  },
  {
    "nodeId": "138",
    "fieldName": "l_lip",
    "fieldValue": "true"
  },
  {
    "nodeId": "138",
    "fieldName": "hair",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "hat",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "ear_r",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "neck_l",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "neck",
    "fieldValue": "false"
  },
  {
    "nodeId": "138",
    "fieldName": "cloth",
    "fieldValue": "false"
  }
];

// Direct API call to RunningHub (exactly what the adapter should do)
async function testDirectApiCall() {
  console.log('\n🔥 TESTING DIRECT API CALL TO RUNNINGHUB');
  console.log('==========================================');

  const payload = {
    apiKey: API_CONFIG.apiKey,
    workflowId: API_CONFIG.workflowId,
    nodeInfoList: EXPECTED_NODE_LIST,
    addMetadata: true
  };

  console.log('📤 API Payload:', JSON.stringify(payload, null, 2));
  console.log(`📊 Total nodes: ${payload.nodeInfoList.length}`);
  console.log(`🔧 Workflow ID: ${payload.workflowId}`);

  try {
    console.log('\n🚀 Making API call to RunningHub...');

    const response = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.ai'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('\n📥 API Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.code === 0 && data.data?.taskId) {
      console.log('\n✅ SUCCESS: Task created successfully!');
      console.log('🆔 Task ID:', data.data.taskId);
      console.log('📋 Status:', data.data.taskStatus);

      if (data.data.promptTips) {
        console.log('💡 Prompt Tips:', data.data.promptTips);

        try {
          const tips = JSON.parse(data.data.promptTips);
          console.log('📊 Outputs to execute:', tips.outputs_to_execute);
          console.log('❌ Node errors:', tips.node_errors);
        } catch (e) {
          console.log('⚠️  Could not parse prompt tips');
        }
      }

      // Now poll for completion
      await pollTaskStatus(data.data.taskId);

    } else {
      console.log('\n❌ FAILURE: Task creation failed');
      console.log('💥 Error message:', data.msg);
    }

  } catch (error) {
    console.error('\n💥 API call failed:', error.message);
  }
}

// Poll task status until completion
async function pollTaskStatus(taskId) {
  console.log('\n⏳ Polling task status...');
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes

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
      console.log(`🔍 Attempt ${attempts + 1}: Status = ${statusData.data}`);

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
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      break;
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n⏰ Task timed out after 5 minutes');
  }
}

// Get task outputs
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
    console.log('\n📸 Task Outputs:', JSON.stringify(outputData, null, 2));

    if (outputData.code === 0 && outputData.data && outputData.data.length > 0) {
      // Look for node 136 output (your final result node)
      const finalOutput = outputData.data.find(output => String(output.nodeId) === '136');

      if (finalOutput && finalOutput.fileUrl) {
        console.log('\n🎯 FINAL OUTPUT FOUND:');
        console.log('📷 Output from node 136:', finalOutput.fileUrl);

        // Compare with input
        if (finalOutput.fileUrl === testImageUrl) {
          console.log('❌ PROBLEM: Output URL same as input URL!');
        } else {
          console.log('✅ SUCCESS: Output URL different from input URL!');
        }
      } else {
        console.log('\n⚠️  Final output from node 136 not found');
        console.log('Available outputs:');
        outputData.data.forEach(output => {
          console.log(`- Node ${output.nodeId}: ${output.fileUrl || 'no URL'}`);
        });
      }
    } else {
      console.log('\n❌ No outputs available');
    }

  } catch (error) {
    console.error('❌ Output fetch failed:', error.message);
  }
}

// Analyze our node configuration vs expected
function analyzeNodeConfiguration() {
  console.log('\n🔍 ANALYZING NODE CONFIGURATION');
  console.log('===============================');

  console.log(`📊 Total nodes configured: ${EXPECTED_NODE_LIST.length}`);
  console.log(`🎯 Workflow ID: ${API_CONFIG.workflowId}`);
  console.log(`🖼️  Final output node: 136`);

  console.log('\n📋 Node breakdown:');
  const nodesByType = {};
  EXPECTED_NODE_LIST.forEach(node => {
    if (!nodesByType[node.nodeId]) {
      nodesByType[node.nodeId] = [];
    }
    nodesByType[node.nodeId].push(`${node.fieldName}=${node.fieldValue}`);
  });

  Object.entries(nodesByType).forEach(([nodeId, fields]) => {
    console.log(`🔧 Node ${nodeId}: ${fields.length} fields`);
    fields.forEach(field => console.log(`   - ${field}`));
  });

  console.log('\n✅ Node configuration analysis complete');
}

// Run the debug tests
async function runDebugTests() {
  console.log('🚀 Starting RH High1 Debug Tests');

  analyzeNodeConfiguration();
  await testDirectApiCall();

  console.log('\n✅ Debug tests completed');
}

// Add fetch polyfill for Node.js
import fetch from 'node-fetch';
globalThis.fetch = fetch;

// Execute the debug
runDebugTests().catch(console.error);