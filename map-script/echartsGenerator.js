const fs = require('fs-extra');

class EChartsGenerator {
  generateWorldMapData(worldData) {
    console.log('📊 生成 ECharts 世界地图数据...');
    
    // 基本地图配置
    const echartsData = {
      type: 'world',
      countries: worldData.map(country => ({
        name: country.name,
        name_en: country.name_en,
        value: [country.center[0], country.center[1], this.calculateValue(country)],
        adcode: country.adcode,
        iso2: country.iso2,
        iso3: country.iso3,
        continent: country.continent,
        region: country.region,
        population: country.population,
        area: country.area_sqkm,
        // 随机数据用于演示
        gdp: this.randomGDP(),
        development: this.randomDevelopmentIndex()
      }))
    };
    
    return echartsData;
  }

  generateCountrySeries(worldData) {
    // 生成 ECharts series 数据
    return worldData.map(country => ({
      name: country.name,
      value: country.population || 1000000,
      coord: [country.center[0], country.center[1]],
      itemStyle: {
        color: this.getColorByContinent(country.continent)
      }
    }));
  }

  calculateValue(country) {
    // 基于人口和面积的综合值
    const population = country.population || 1000000;
    const area = country.area_sqkm || 100000;
    
    // 标准化值（0-100）
    return Math.min(100, Math.log10(population) * 20 + Math.log10(area) * 10);
  }

  randomGDP() {
    // 随机GDP数据（单位：十亿美元）
    return (Math.random() * 5000 + 10).toFixed(2);
  }

  randomDevelopmentIndex() {
    // 随机发展指数（0-1）
    return (Math.random() * 0.8 + 0.2).toFixed(3);
  }

  getColorByContinent(continent) {
    const colorMap = {
      'Asia': '#ff4d4f',
      'Europe': '#1890ff',
      'Africa': '#52c41a',
      'North America': '#faad14',
      'South America': '#722ed1',
      'Oceania': '#13c2c2',
      'Antarctica': '#bfbfbf'
    };
    
    return colorMap[continent] || '#d9d9d9';
  }

  async saveEChartsData(echartsData) {
    await fs.ensureDir('./output');
    
    // 保存 ECharts 格式数据
    await fs.writeJson('./output/echarts-world-data.json', echartsData, { spaces: 2 });
    
    // 生成 ECharts 配置示例
    const echartsConfig = this.generateEChartsConfig(echartsData);
    await fs.writeJson('./output/echarts-config-example.json', echartsConfig, { spaces: 2 });
    
    return echartsConfig;
  }

  generateEChartsConfig(echartsData) {
    return {
      title: {
        text: '世界国家数据地图',
        subtext: `包含 ${echartsData.countries.length} 个国家`,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          const data = params.data;
          return `
            <b>${data.name}</b><br/>
            英文名: ${data.name_en}<br/>
            人口: ${(data.population / 1000000).toFixed(2)}M<br/>
            面积: ${(data.area / 1000).toFixed(1)}k km²<br/>
            GDP: $${data.gdp}B<br/>
            发展指数: ${data.development}
          `;
        }
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: 100,
        calculable: true,
        inRange: {
          color: ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027']
        },
        textStyle: {
          color: '#fff'
        }
      },
      series: [{
        name: '国家数据',
        type: 'map',
        map: 'world',
        roam: true,
        emphasis: {
          label: {
            show: true
          }
        },
        data: echartsData.countries.map(country => ({
          name: country.name,
          value: country.value[2]
        }))
      }]
    };
  }
}

// 生成 ECharts 数据
async function generateEChartsData(worldData) {
  const generator = new EChartsGenerator();
  const echartsData = generator.generateWorldMapData(worldData);
  return await generator.saveEChartsData(echartsData);
}

module.exports = {
  generateEChartsData,
  EChartsGenerator
};