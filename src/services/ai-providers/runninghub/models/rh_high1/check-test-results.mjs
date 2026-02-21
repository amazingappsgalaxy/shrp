import fetch from 'node-fetch';

const API_CONFIG = {
  apiKey: "95d3c787224840998c28fd0f2da9b4a2",
};

// Check the results of our test tasks
const testTasks = [
  { name: "Current Configuration", taskId: "1969402356536340481" },
  { name: "With Missing Nodes (Default)", taskId: "1969402358151135234" },
  { name: "With Guessed Fields", taskId: "1969402359703040002" }
];

async function checkTaskResult(taskName, taskId) {
  console.log(`\n🔍 Checking: ${taskName} (${taskId})`);

  try {
    // Check status
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
    console.log(`📊 Status: ${statusData.data}`);

    if (statusData.data === 'SUCCESS') {
      console.log('✅ Task completed! Getting outputs...');

      // Get outputs
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
          console.log(`🎯 Final output (node 136): ${finalOutput.fileUrl}`);

          // Compare with input
          const testImageUrl = "https://i.postimg.cc/yYypwH5r/39bd9385-94ea-9b11-0198-8c09797bc3bd.jpg";
          if (finalOutput.fileUrl === testImageUrl) {
            console.log('❌ PROBLEM: Output URL same as input URL!');
          } else {
            console.log('✅ SUCCESS: Output URL different from input URL!');
          }
        }
      } else {
        console.log('❌ No outputs found');
      }
    } else if (statusData.data === 'FAILED') {
      console.log('❌ Task failed');
    } else {
      console.log('⏳ Still running...');
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

async function checkAllResults() {
  console.log('🔍 Checking results of all test configurations...');

  for (const task of testTasks) {
    await checkTaskResult(task.name, task.taskId);
  }
}

checkAllResults().catch(console.error);