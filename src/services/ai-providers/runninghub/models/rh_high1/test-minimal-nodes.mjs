import fetch from 'node-fetch';

// Test minimal configuration to understand what nodes 102, 139, 137 should contain
const API_CONFIG = {
  apiKey: "95d3c787224840998c28fd0f2da9b4a2",
  workflowId: "1969370493155483650",
  baseUrl: "https://www.runninghub.ai"
};

const testImageUrl = "https://i.postimg.cc/yYypwH5r/39bd9385-94ea-9b11-0198-8c09797bc3bd.jpg";

// Test different node configurations to understand requirements
async function testMinimalConfiguration() {
  console.log('🧪 Testing minimal configuration...');

  // Test 1: Only the nodes we know about
  await testNodeConfiguration('Current Configuration', [
    { nodeId: "97", fieldName: "image", fieldValue: testImageUrl },
    { nodeId: "90", fieldName: "steps", fieldValue: "10" },
    { nodeId: "85", fieldName: "megapixels", fieldValue: "10" },
    { nodeId: "142", fieldName: "boolean", fieldValue: "true" }
  ]);

  // Test 2: Add the missing nodes with empty/default values to see what fields they expect
  await testNodeConfiguration('With Missing Nodes (Default)', [
    { nodeId: "97", fieldName: "image", fieldValue: testImageUrl },
    { nodeId: "90", fieldName: "steps", fieldValue: "10" },
    { nodeId: "85", fieldName: "megapixels", fieldValue: "10" },
    { nodeId: "142", fieldName: "boolean", fieldValue: "true" },
    { nodeId: "102", fieldName: "pixels", fieldValue: "1024" },  // Common image size field
    { nodeId: "139", fieldName: "boolean", fieldValue: "true" }, // Common boolean field
    { nodeId: "137", fieldName: "boolean", fieldValue: "true" }  // Common boolean field
  ]);

  // Test 3: Try common field names for missing nodes
  await testNodeConfiguration('With Guessed Fields', [
    { nodeId: "97", fieldName: "image", fieldValue: testImageUrl },
    { nodeId: "90", fieldName: "steps", fieldValue: "10" },
    { nodeId: "85", fieldName: "megapixels", fieldValue: "10" },
    { nodeId: "142", fieldName: "boolean", fieldValue: "true" },
    { nodeId: "102", fieldName: "longer_side", fieldValue: "1024" },  // Based on FLUX pattern
    { nodeId: "139", fieldName: "image", fieldValue: testImageUrl },   // Maybe another image input
    { nodeId: "137", fieldName: "filename_prefix", fieldValue: "output" } // Common save field
  ]);
}

async function testNodeConfiguration(testName, nodeInfoList) {
  console.log(`\n🔬 Test: ${testName}`);
  console.log(`📋 Testing ${nodeInfoList.length} nodes:`, nodeInfoList.map(n => `${n.nodeId}:${n.fieldName}`).join(', '));

  const payload = {
    apiKey: API_CONFIG.apiKey,
    workflowId: API_CONFIG.workflowId,
    nodeInfoList: nodeInfoList,
    addMetadata: true
  };

  try {
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

    if (data.code === 0) {
      console.log(`✅ Success: Task ${data.data.taskId} created`);
      if (data.data.promptTips) {
        try {
          const tips = JSON.parse(data.data.promptTips);
          console.log(`🎯 Expected outputs: ${tips.outputs_to_execute.join(', ')}`);
          if (Object.keys(tips.node_errors).length > 0) {
            console.log(`❌ Node errors:`, tips.node_errors);
          } else {
            console.log(`✅ No node errors`);
          }
        } catch (e) {
          console.log(`⚠️  Could not parse promptTips`);
        }
      }
    } else {
      console.log(`❌ Failed: ${data.msg}`);
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the tests
testMinimalConfiguration().catch(console.error);