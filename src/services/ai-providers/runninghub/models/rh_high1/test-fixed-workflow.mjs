import fetch from 'node-fetch';

// Test the fixed workflow with all required nodes
const API_CONFIG = {
  apiKey: "95d3c787224840998c28fd0f2da9b4a2",
  workflowId: "1969370493155483650",
  baseUrl: "https://www.runninghub.ai"
};

const testImageUrl = "https://i.postimg.cc/yYypwH5r/39bd9385-94ea-9b11-0198-8c09797bc3bd.jpg";

// Complete node configuration with all required nodes
const COMPLETE_NODE_LIST = [
  // Original nodes
  { nodeId: "97", fieldName: "image", fieldValue: testImageUrl },
  { nodeId: "90", fieldName: "steps", fieldValue: "10" },
  { nodeId: "85", fieldName: "megapixels", fieldValue: "10" },
  { nodeId: "142", fieldName: "boolean", fieldValue: "true" },

  // Missing nodes we discovered
  { nodeId: "102", fieldName: "longer_side", fieldValue: "1024" },
  { nodeId: "139", fieldName: "boolean", fieldValue: "true" },
  { nodeId: "137", fieldName: "filename_prefix", fieldValue: "rh_high1_output" },

  // Area protection settings for node 138
  { nodeId: "138", fieldName: "background", fieldValue: "false" },
  { nodeId: "138", fieldName: "skin", fieldValue: "false" },
  { nodeId: "138", fieldName: "nose", fieldValue: "false" },
  { nodeId: "138", fieldName: "eye_g", fieldValue: "false" },
  { nodeId: "138", fieldName: "r_eye", fieldValue: "true" },
  { nodeId: "138", fieldName: "l_eye", fieldValue: "true" },
  { nodeId: "138", fieldName: "r_brow", fieldValue: "false" },
  { nodeId: "138", fieldName: "l_brow", fieldValue: "false" },
  { nodeId: "138", fieldName: "r_ear", fieldValue: "false" },
  { nodeId: "138", fieldName: "l_ear", fieldValue: "false" },
  { nodeId: "138", fieldName: "mouth", fieldValue: "true" },
  { nodeId: "138", fieldName: "u_lip", fieldValue: "true" },
  { nodeId: "138", fieldName: "l_lip", fieldValue: "true" },
  { nodeId: "138", fieldName: "hair", fieldValue: "false" },
  { nodeId: "138", fieldName: "hat", fieldValue: "false" },
  { nodeId: "138", fieldName: "ear_r", fieldValue: "false" },
  { nodeId: "138", fieldName: "neck_l", fieldValue: "false" },
  { nodeId: "138", fieldName: "neck", fieldValue: "false" },
  { nodeId: "138", fieldName: "cloth", fieldValue: "false" }
];

async function testCompleteWorkflow() {
  console.log('🧪 Testing COMPLETE RH High1 Workflow');
  console.log('=====================================');
  console.log(`📊 Total nodes: ${COMPLETE_NODE_LIST.length}`);
  console.log('🔧 Node breakdown:');

  const nodesByType = {};
  COMPLETE_NODE_LIST.forEach(node => {
    if (!nodesByType[node.nodeId]) {
      nodesByType[node.nodeId] = [];
    }
    nodesByType[node.nodeId].push(`${node.fieldName}=${node.fieldValue}`);
  });

  Object.entries(nodesByType).forEach(([nodeId, fields]) => {
    console.log(`   Node ${nodeId}: ${fields.length} fields`);
  });

  const payload = {
    apiKey: API_CONFIG.apiKey,
    workflowId: API_CONFIG.workflowId,
    nodeInfoList: COMPLETE_NODE_LIST,
    addMetadata: true
  };

  try {
    console.log('\n🚀 Creating task with complete configuration...');

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

      // Poll for completion (up to 3 minutes)
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
  console.log('\n⏳ Polling for task completion...');
  let attempts = 0;
  const maxAttempts = 36; // 3 minutes

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
    console.log('\n⏰ Task timed out after 3 minutes');
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
          console.log('🎉 The workflow is working correctly!');
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
testCompleteWorkflow().catch(console.error);