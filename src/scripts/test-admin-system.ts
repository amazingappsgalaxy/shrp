/**
 * Comprehensive test script for the admin system
 * Run this to verify all admin functionality works correctly
 */

import { PricingEngine } from '../lib/pricing-engine';

interface TestResult {
  name: string;
  success: boolean;
  details?: string;
  error?: string;
}

class AdminSystemTester {
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:3003';

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive admin system tests...\n');

    // Test pricing engine
    await this.testPricingEngine();

    // Test admin setup
    await this.testAdminSetup();

    // Test admin authentication
    await this.testAdminAuthentication();

    // Test pricing configuration
    await this.testPricingConfiguration();

    // Test user management
    await this.testUserManagement();

    // Test sales analytics
    await this.testSalesAnalytics();

    // Test system settings
    await this.testSystemSettings();

    // Print results
    this.printResults();

    return this.results;
  }

  private addResult(name: string, success: boolean, details?: string, error?: string) {
    this.results.push({ name, success, details, error });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${name}${details ? `: ${details}` : ''}`);
    if (error) console.log(`   Error: ${error}`);
  }

  private async testPricingEngine() {
    console.log('📊 Testing Pricing Engine...');

    try {
      // Test basic price calculation
      const basicPricing = PricingEngine.calculateCredits(
        1920, 1080,
        'fermatresearch/magic-image-refiner',
        {}
      );
      this.addResult(
        'Basic price calculation',
        basicPricing.totalCredits > 0,
        `HD image: ${basicPricing.totalCredits} credits`
      );

      // Test option-based pricing
      const optionPricing = PricingEngine.calculateCredits(
        1920, 1080,
        'fermatresearch/magic-image-refiner',
        { creativity: 0.9, hdr: 1.0, steps: 100 }
      );
      this.addResult(
        'Option-based pricing',
        optionPricing.totalCredits > basicPricing.totalCredits,
        `With options: ${optionPricing.totalCredits} credits (${optionPricing.optionModifiers.length} modifiers)`
      );

      // Test different models
      const models = ['fermatresearch/magic-image-refiner', 'nightmareai/real-esrgan', 'runninghub-flux-upscaling'];
      for (const modelId of models) {
        try {
          const pricing = PricingEngine.calculateCredits(2160, 2160, modelId, {});
          this.addResult(
            `Model pricing: ${modelId.split('/').pop()}`,
            pricing.totalCredits > 0,
            `4K image: ${pricing.totalCredits} credits`
          );
        } catch (error) {
          this.addResult(
            `Model pricing: ${modelId.split('/').pop()}`,
            false,
            undefined,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      // Test resolution tiers
      const resolutions = [
        { name: 'SD', width: 800, height: 600 },
        { name: 'HD', width: 1920, height: 1080 },
        { name: '4K', width: 3840, height: 2160 }
      ];

      resolutions.forEach(res => {
        const pricing = PricingEngine.calculateCredits(res.width, res.height, 'fermatresearch/magic-image-refiner', {});
        this.addResult(
          `Resolution tier: ${res.name}`,
          pricing.totalCredits > 0,
          `${res.width}x${res.height}: ${pricing.totalCredits} credits (${pricing.resolutionTier})`
        );
      });

    } catch (error) {
      this.addResult('Pricing Engine', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testAdminSetup() {
    console.log('🔧 Testing Admin Setup...');

    try {
      const response = await fetch(`${this.baseUrl}/api/admin/setup-admin-system`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'Admin system setup',
          data.success,
          data.success ? 'Admin account created successfully' : data.error
        );
      } else {
        this.addResult('Admin system setup', false, undefined, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('Admin system setup', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testAdminAuthentication() {
    console.log('🔐 Testing Admin Authentication...');

    try {
      // Test with a dummy user ID (this should fail)
      const response = await fetch(`${this.baseUrl}/api/admin/check-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id' })
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'Admin check API',
          !data.isAdmin, // Should return false for non-admin user
          'Non-admin user correctly rejected'
        );
      } else {
        this.addResult('Admin check API', false, undefined, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('Admin authentication', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testPricingConfiguration() {
    console.log('💰 Testing Pricing Configuration...');

    try {
      // Test GET pricing config
      const getResponse = await fetch(`${this.baseUrl}/api/admin/pricing-config`);
      if (getResponse.ok) {
        const data = await getResponse.json();
        this.addResult(
          'Get pricing config',
          data.success && data.config,
          `${data.config?.resolutionTiers?.length || 0} tiers, ${data.config?.modelConfigs?.length || 0} models`
        );

        // Test PUT pricing config (with same data)
        if (data.success && data.config) {
          const putResponse = await fetch(`${this.baseUrl}/api/admin/pricing-config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: data.config })
          });

          if (putResponse.ok) {
            const putData = await putResponse.json();
            this.addResult('Update pricing config', putData.success, 'Configuration updated successfully');
          } else {
            this.addResult('Update pricing config', false, undefined, `HTTP ${putResponse.status}`);
          }
        }
      } else {
        this.addResult('Get pricing config', false, undefined, `HTTP ${getResponse.status}`);
      }
    } catch (error) {
      this.addResult('Pricing configuration', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testUserManagement() {
    console.log('👥 Testing User Management...');

    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users`);
      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'Get users list',
          data.success,
          `${data.users?.length || 0} users found`
        );
      } else {
        this.addResult('Get users list', false, undefined, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('User management', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testSalesAnalytics() {
    console.log('📈 Testing Sales Analytics...');

    try {
      const response = await fetch(`${this.baseUrl}/api/admin/sales-analytics?range=30d`);
      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'Sales analytics',
          data.success || data.salesData,
          `Revenue: $${((data.salesData?.totalRevenue || 0) / 100).toFixed(2)}`
        );
      } else {
        this.addResult('Sales analytics', false, undefined, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('Sales analytics', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private async testSystemSettings() {
    console.log('⚙️ Testing System Settings...');

    try {
      const response = await fetch(`${this.baseUrl}/api/admin/dashboard-stats`);
      if (response.ok) {
        const data = await response.json();
        this.addResult(
          'Dashboard stats',
          data.success,
          `${data.stats?.totalUsers || 0} users, ${data.stats?.totalTasks || 0} tasks`
        );
      } else {
        this.addResult('Dashboard stats', false, undefined, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('System settings', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('');
  }

  private printResults() {
    console.log('📋 Test Results Summary:');
    console.log('=======================');

    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed < total) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('\n🎉 Admin System Test Complete!');

    if (passed === total) {
      console.log('🟢 All tests passed! The admin system is working correctly.');
    } else {
      console.log('🔴 Some tests failed. Please review and fix the issues above.');
    }
  }
}

// Export for use in other files
export { AdminSystemTester };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AdminSystemTester();
  tester.runAllTests().catch(console.error);
}