// 快速测试脚本 - 在微信开发者工具控制台运行
// 测试 sendMatchReminders 云函数修复

console.log('🧪 开始测试 sendMatchReminders 云函数...\n');

// 测试 1: 调用云函数
console.log('📝 测试 1: 手动调用云函数');
wx.cloud.callFunction({
  name: 'sendMatchReminders',
  data: {},
  success: res => {
    console.log('✅ 云函数调用成功!');
    console.log('📊 返回结果:', res.result);
    
    if (res.result.success) {
      console.log(`✅ 状态: 成功`);
      console.log(`📨 消息: ${res.result.message}`);
      console.log(`📬 发送数量: ${res.result.sentCount}`);
      
      if (res.result.matchesProcessed !== undefined) {
        console.log(`⚽ 处理比赛数: ${res.result.matchesProcessed}`);
      }
      
      console.log('\n🎉 测试通过! 云函数工作正常');
    } else {
      console.error('❌ 云函数返回失败:', res.result.message);
    }
  },
  fail: err => {
    console.error('❌ 云函数调用失败!');
    console.error('错误信息:', err);
    
    // 常见错误提示
    if (err.errCode === -1) {
      console.log('\n💡 提示: 请检查云函数是否已部署');
      console.log('   1. 右键 cloudfunctions/sendMatchReminders');
      console.log('   2. 选择 "上传并部署：云端安装依赖"');
    }
    
    if (err.errMsg && err.errMsg.includes('function not found')) {
      console.log('\n💡 提示: 云函数未找到，请确认:');
      console.log('   1. 云函数名称是否正确');
      console.log('   2. 是否已上传到云端');
    }
  }
});

// 测试 2: 检查数据库中的提醒记录
console.log('\n📝 测试 2: 检查数据库提醒记录');
const db = wx.cloud.database();
db.collection('match_reminders')
  .where({
    status: 'active'
  })
  .count()
  .then(res => {
    console.log(`✅ 当前活跃提醒数量: ${res.total}`);
    
    if (res.total > 0) {
      console.log('📋 获取详细记录...');
      return db.collection('match_reminders')
        .where({ status: 'active' })
        .limit(5)
        .get();
    }
  })
  .then(res => {
    if (res && res.data) {
      console.log(`📝 提醒记录示例 (前${res.data.length}条):`);
      res.data.forEach((record, index) => {
        console.log(`  ${index + 1}. 比赛ID: ${record.matchId}, 用户ID: ${record.userId.substring(0, 8)}...`);
      });
    }
  })
  .catch(err => {
    console.error('❌ 查询数据库失败:', err);
    
    if (err.errCode === -502005) {
      console.log('\n💡 提示: match_reminders 集合不存在');
      console.log('   这是正常的，如果还没有用户设置提醒');
    }
  });

// 测试 3: 检查用户订阅权限（需要在页面环境中）
console.log('\n📝 测试 3: 检查订阅消息设置');
wx.getSetting({
  withSubscriptions: true,
  success: res => {
    console.log('✅ 权限设置:', res);
    
    if (res.subscriptionsSetting) {
      console.log('📬 订阅消息状态:', res.subscriptionsSetting.mainSwitch ? '已开启' : '未开启');
      if (res.subscriptionsSetting.itemSettings) {
        console.log('📋 订阅模板:', res.subscriptionsSetting.itemSettings);
      }
    }
  },
  fail: err => {
    console.log('⚠️  无法获取订阅设置（可能不在页面环境中）');
  }
});

console.log('\n⏳ 测试进行中，请等待结果...\n');
console.log('=' .repeat(60));
