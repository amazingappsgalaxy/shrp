import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../../lib/config';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    );

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch payment data
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select(`
        id, userId, amount, currency, status, plan, paymentMethod,
        paidAt, createdAt, creditsGranted
      `)
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: false });

    if (paymentsError) {
      console.warn('Error fetching payments:', paymentsError);
      // Continue with empty data if payments table doesn't exist
    }

    // Also get user emails for recent transactions
    const userIds = payments?.slice(0, 20).map(p => p.userId) || [];
    let userEmails: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (!usersError && users) {
        userEmails = users.reduce((acc, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    const allPayments = payments || [];
    const successfulPayments = allPayments.filter(p => p.status === 'completed');

    // Calculate metrics
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    const monthlyPayments = successfulPayments.filter(p => {
      const paidDate = new Date(p.paidAt || p.createdAt);
      return paidDate >= startOfMonth;
    });
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const weeklyPayments = successfulPayments.filter(p => {
      const paidDate = new Date(p.paidAt || p.createdAt);
      return paidDate >= startOfWeek;
    });
    const weeklyRevenue = weeklyPayments.reduce((sum, p) => sum + p.amount, 0);

    const dailyPayments = successfulPayments.filter(p => {
      const paidDate = new Date(p.paidAt || p.createdAt);
      return paidDate >= startOfDay;
    });
    const dailyRevenue = dailyPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalTransactions = allPayments.length;
    const successfulTransactions = successfulPayments.length;
    const averageTransactionValue = successfulTransactions > 0 ? totalRevenue / successfulTransactions : 0;

    // Calculate growth (comparing this month to last month)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const lastMonthPayments = successfulPayments.filter(p => {
      const paidDate = new Date(p.paidAt || p.createdAt);
      return paidDate >= lastMonthStart && paidDate <= lastMonthEnd;
    });
    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthlyRevenue > 0 ? 100 : 0;

    // Customer growth (new users this month vs last month)
    const { data: thisMonthUsers, error: thisMonthError } = await supabaseAdmin
      .from('users')
      .select('id')
      .gte('created_at', startOfMonth.toISOString());

    const { data: lastMonthUsers, error: lastMonthError } = await supabaseAdmin
      .from('users')
      .select('id')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    const thisMonthUserCount = thisMonthUsers?.length || 0;
    const lastMonthUserCount = lastMonthUsers?.length || 0;

    const customerGrowth = lastMonthUserCount > 0
      ? ((thisMonthUserCount - lastMonthUserCount) / lastMonthUserCount) * 100
      : thisMonthUserCount > 0 ? 100 : 0;

    // Subscription breakdown
    const subscriptionBreakdown = successfulPayments.reduce((acc, payment) => {
      const plan = payment.plan || 'one-time';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Revenue by month (last 12 months)
    const revenueByMonth: Array<{ month: string; revenue: number; transactions: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthPayments = successfulPayments.filter(p => {
        const paidDate = new Date(p.paidAt || p.createdAt);
        return paidDate >= monthDate && paidDate < nextMonth;
      });

      revenueByMonth.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: monthPayments.length
      });
    }

    // Recent transactions with user emails
    const recentTransactions = successfulPayments.slice(0, 20).map(payment => ({
      ...payment,
      userEmail: userEmails[payment.userId] || undefined
    }));

    const salesData = {
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      totalTransactions,
      successfulTransactions,
      averageTransactionValue,
      revenueGrowth,
      customerGrowth,
      subscriptionBreakdown,
      recentTransactions,
      revenueByMonth
    };

    return NextResponse.json({ success: true, salesData });

  } catch (error) {
    console.error('Error fetching sales analytics:', error);

    // Return default/empty data structure on error
    const defaultSalesData = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      weeklyRevenue: 0,
      dailyRevenue: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      averageTransactionValue: 0,
      revenueGrowth: 0,
      customerGrowth: 0,
      subscriptionBreakdown: {},
      recentTransactions: [],
      revenueByMonth: []
    };

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sales analytics',
      salesData: defaultSalesData
    }, { status: 500 });
  }
}