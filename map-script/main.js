const { fetchCompleteWorldData } = require('./worldDataFetcher');
const { generateEChartsData } = require('./echartsGenerator');

async function main() {
  try {
    console.log('🌍 开始获取世界国家数据...\n');
    
    // 1. 获取完整的世界国家数据
    const worldData = await fetchCompleteWorldData();
    
    // 2. 生成 ECharts 格式的数据
    const echartsData = await generateEChartsData(worldData);
    
    // 3. 显示统计信息
    displayStatistics(worldData);
    
    console.log('\n🎉 数据获取和转换完成！');
    console.log('📁 生成的文件：');
    console.log('   - output/world-countries-complete.json (完整国家数据)');
    console.log('   - output/echarts-world-data.json (ECharts 格式)');
    console.log('   - output/world-statistics.json (统计信息)');
    
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

function displayStatistics(worldData) {
  const stats = {
    total: worldData.length,
    byContinent: {},
    byRegion: {}
  };
  
  worldData.forEach(country => {
    // 按大洲统计
    const continent = country.continent || 'Unknown';
    stats.byContinent[continent] = (stats.byContinent[continent] || 0) + 1;
    
    // 按地区统计
    const region = country.region || 'Unknown';
    stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
  });
  
  console.log('\n📊 数据统计：');
  console.log(`   国家总数：${stats.total}`);
  console.log(`   大洲分布：${JSON.stringify(stats.byContinent)}`);
  
  // 显示各大洲详情
  Object.entries(stats.byContinent).forEach(([continent, count]) => {
    console.log(`   ${continent}: ${count} 个国家`);
  });
}

// 运行程序
if (require.main === module) {
  main();
}

module.exports = { main };