// 云函数：manageMatchReminders
// 管理用户的比赛提醒设置

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, matchId, userId } = event;

  try {
    switch (action) {
      case 'setReminder':
        return await setReminder(userId, matchId);
      case 'cancelReminder':
        return await cancelReminder(userId, matchId);
      case 'getUserReminders':
        return await getUserReminders(userId);
      case 'getMatchReminders':
        return await getMatchReminders(matchId);
      default:
        return {
          success: false,
          message: '无效的操作类型'
        };
    }
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      message: error.message || '操作失败'
    };
  }
};

// 设置提醒
async function setReminder(userId, matchId) {
  // 检查是否已存在提醒
  const existingReminder = await db.collection('match_reminders')
    .where({
      userId: userId,
      matchId: matchId
    })
    .get();

  if (existingReminder.data && existingReminder.data.length > 0) {
    // ✅ 改进：如果已存在且状态为 active，返回成功（幂等性）
    const activeReminder = existingReminder.data.find(r => r.status === 'active');
    
    if (activeReminder) {
      return {
        success: true,
        message: '该比赛的提醒已设置',
        alreadyExists: true,
        reminderId: activeReminder._id
      };
    }
    
    // 如果存在但已取消，可以重新激活
    const cancelledReminder = existingReminder.data[0];
    await db.collection('match_reminders')
      .doc(cancelledReminder._id)
      .update({
        data: {
          status: 'active',
          reactivatedAt: new Date()
        }
      });
    
    return {
      success: true,
      message: '提醒重新激活成功',
      reminderId: cancelledReminder._id
    };
  }

  // 创建新提醒
  const result = await db.collection('match_reminders').add({
    data: {
      userId: userId,
      matchId: matchId,
      createdAt: new Date(),
      status: 'active'
    }
  });

  return {
    success: true,
    message: '提醒设置成功',
    reminderId: result._id
  };
}

// 取消提醒
async function cancelReminder(userId, matchId) {
  const result = await db.collection('match_reminders')
    .where({
      userId: userId,
      matchId: matchId,
      status: 'active'
    })
    .update({
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });

  if (result.stats.updated > 0) {
    return {
      success: true,
      message: '提醒已取消'
    };
  } else {
    return {
      success: false,
      message: '未找到对应的提醒设置'
    };
  }
}

// 获取用户的提醒列表
async function getUserReminders(userId) {
  const result = await db.collection('match_reminders')
    .where({
      userId: userId,
      status: 'active'
    })
    .orderBy('createdAt', 'desc')
    .get();

  return {
    success: true,
    reminders: result.data
  };
}

// 获取比赛的提醒列表（用于统计或管理）
async function getMatchReminders(matchId) {
  const result = await db.collection('match_reminders')
    .where({
      matchId: matchId,
      status: 'active'
    })
    .get();

  return {
    success: true,
    reminders: result.data,
    count: result.data.length
  };
}