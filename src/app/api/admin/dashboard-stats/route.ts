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

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch user statistics
    const { data: totalUsersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    const totalUsers = totalUsersData?.length || 0;
    const activeUsers = totalUsersData?.filter(user => {
      const lastLogin = new Date(user.last_login_at || '2020-01-01');
      return lastLogin >= startOfToday;
    }).length || 0;

    // Fetch task statistics
    const { data: tasksData, error: tasksError } = await supabaseAdmin
      .from('history_items')
      .select('id, status, created_at, generation_time_ms')
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    const totalTasks = tasksData?.length || 0;
    const completedTasks = tasksData?.filter(task => task.status === 'completed').length || 0;

    // Calculate task processing rate (tasks per minute in last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentTasks = tasksData?.filter(task => {
      return task.status === 'completed' && new Date(task.created_at) >= oneHourAgo;
    }) || [];
    const taskProcessingRate = Math.round(recentTasks.length / 60);

    // Fetch payment statistics
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('amount, status, paidAt, createdAt')
      .eq('status', 'completed');

    if (paymentsError) {
      console.warn('Error fetching payments:', paymentsError);
    }

    const totalRevenue = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const monthlyRevenue = paymentsData?.filter(payment => {
      const paidDate = new Date(payment.paidAt || payment.createdAt);
      return paidDate >= startOfMonth;
    }).reduce((sum, payment) => sum + payment.amount, 0) || 0;

    // System health check
    let systemStatus: 'healthy' | 'warning' | 'error' = 'healthy';

    // Check for failed tasks in last hour
    const failedTasks = tasksData?.filter(task => {
      return task.status === 'failed' && new Date(task.created_at) >= oneHourAgo;
    }) || [];

    if (failedTasks.length > 10) {
      systemStatus = 'error';
    } else if (failedTasks.length > 5) {
      systemStatus = 'warning';
    }

    // Recent activity for overview
    const recentActivity = [
      {
        type: 'system',
        message: 'System health check completed',
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString()
      },
      ...(totalUsersData?.slice(0, 2).map(user => ({
        type: 'user',
        message: `New user registration: ${user.email || 'user'}`,
        timestamp: user.created_at
      })) || []),
      ...(paymentsData?.slice(0, 2).map(payment => ({
        type: 'payment',
        message: `Payment processed: $${payment.amount.toFixed(2)}`,
        timestamp: payment.paidAt || payment.createdAt
      })) || [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    const stats = {
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      monthlyRevenue: monthlyRevenue / 100,
      systemStatus,
      taskProcessingRate,
      recentActivity
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        systemStatus: 'error' as const,
        taskProcessingRate: 0,
        recentActivity: []
      }
    }, { status: 500 });
  }
}
