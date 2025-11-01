const https = require('https');
const fs = require('fs-extra');
const JSONStream = require('JSONStream');
const rawData = require('./utils/raw-natural-earth-10m.json');

class WorldDataFetcher {
  constructor() {
    this.dataSources = [
      {
        name: 'Natural Earth 10m',
        url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',
        description: '最高分辨率，包含所有国家'
      },
      {
        name: 'Natural Earth 50m',
        url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
        description: '中等分辨率'
      },
      {
        name: 'DataHub Countries',
        url: 'https://datahub.io/core/geo-countries/r/countries.geojson',
        description: '标准国家数据'
      }
    ];
  }

  async fetchCompleteWorldData () {
    console.log('🔍 尝试从多个数据源获取世界国家数据...\n');

    for (const source of this.dataSources) {
      try {
        console.log(`📡 尝试数据源: ${source.name}`);
        console.log(`   ${source.description}`);

        const data = await this.fetchFromSource(source.url);
        // const data = await this.fetchLargeJsonStream(source.url);


        if (data && data.features && data.features.length > 0) {
          console.log(`✅ 成功获取 ${data.features.length} 个国家数据`);

          // 处理数据
          const processedData = this.processGeoJSONData(data);

          // 保存原始数据
          await this.saveRawData(data, source.name);

          console.log(`✅ 数据处理完成，生成 ${processedData.length} 个国家\n`);
          return processedData;
        }
      } catch (error) {
        console.log(`❌ ${source.name} 获取失败: ${error.message}\n`);
      }
    }

    throw new Error('所有数据源均不可用');
  }

  async fetchFromSource (url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        console.log(`请求 ${url}，状态码: ${response.statusCode}`);

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
          return;
        }

        // 获取内容长度用于进度计算
        const contentLength = parseInt(response.headers['content-length'], 10);
        let receivedLength = 0;
        const chunks = []; // 使用 Buffer 数组替代字符串拼接
        let lastProgressUpdate = Date.now();

        console.log(`数据总大小: ${(contentLength / 1024 / 1024).toFixed(2)} MB`);

        response.on('data', (chunk) => {
          receivedLength += chunk.length;
          chunks.push(chunk);

          // 限制进度更新频率（每秒最多更新一次）
          const now = Date.now();
          if (now - lastProgressUpdate >= 1000) {
            const percent = contentLength ? Math.round((receivedLength / contentLength) * 100) : 0;
            const speed = receivedLength / ((now - lastProgressUpdate) / 1000);

            process.stdout.write(
              `\r下载进度: ${percent}% | ${(receivedLength / 1024 / 1024).toFixed(2)}/${(contentLength / 1024 / 1024).toFixed(2)} MB | 速度: ${(speed / 1024).toFixed(1)} KB/s`
            );

            lastProgressUpdate = now;
          }
        });

        response.on('end', () => {
          process.stdout.write('\n'); // 换行

          try {
            // 合并所有 Buffer  chunks
            const completeBuffer = Buffer.concat(chunks);
            const data = completeBuffer.toString('utf8');

            console.log(`请求 ${url} 成功，数据大小: ${(completeBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (error) {
            console.error('解析失败:', error.message);
            reject(new Error(`解析 JSON 失败: ${error.message}`));
          }
        });
      });

      request.on('error', (error) => {
        console.error('请求错误:', error.message);
        reject(error);
      });

      // 增加超时时间并添加超时监听
      request.setTimeout(60000, () => { // 60秒超时
        console.error('请求超时');
        request.destroy();
        reject(new Error('请求超时（60秒）'));
      });

      // 添加其他错误监听
      request.on('socket', (socket) => {
        socket.setTimeout(60000);
        socket.on('timeout', () => {
          console.error('Socket 超时');
          request.destroy();
          reject(new Error('Socket 超时'));
        });
      });
    });
  }


  async fetchLargeJsonStream (url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const contentLength = parseInt(response.headers['content-length'], 10);
        let receivedLength = 0;

        console.log(`开始流式处理大型 JSON (${(contentLength / 1024 / 1024).toFixed(2)} MB)`);

        // 创建流式 JSON 解析器
        const jsonStream = JSONStream.parse('*'); // 解析数组中的每个元素
        const result = [];

        jsonStream.on('data', (data) => {
          result.push(data);
          // 可以在这里处理每个解析出的对象，避免内存爆满
        });

        jsonStream.on('end', () => {
          console.log(`流式解析完成，共处理 ${result.length} 个元素`);
          resolve(result);
        });

        jsonStream.on('error', (error) => {
          reject(error);
        });

        // 进度监控
        response.on('data', (chunk) => {
          receivedLength += chunk.length;
          if (contentLength) {
            const percent = Math.round((receivedLength / contentLength) * 100);
            process.stdout.write(`\r下载进度: ${percent}%`);
          }
        });

        response.pipe(jsonStream);
      });

      request.on('error', reject);
      request.setTimeout(120000, () => {
        request.destroy();
        reject(new Error('超时'));
      });
    });
  }

  processGeoJSONData (geoJSON) {
    console.log('🔄 处理 GeoJSON 数据...');

    // 过滤出真正的国家, 使用 ISO 国家代码过滤
    return geoJSON.features
      .filter(feature => {
        const properties = feature.properties || {};

        // 只保留有正式 ISO 代码的主权国家
        const hasValidISOCode = properties.ISO_A2 && properties.ISO_A2.length === 2;

        // 排除特殊区域（根据名称或属性）
        const isSovereign = !properties.ADM0_A3?.includes('PS') && // 排除属地
          !properties.NAME?.includes('Antarctica') && // 排除南极
          !properties.NAME?.includes('Disputed'); // 排除争议地区

        return hasValidISOCode && isSovereign;
      }).map((feature, index) => {
        const properties = feature.properties || {};
        const geometry = feature.geometry || {};

        // 获取国家信息
        const countryInfo = this.getCountryInfo(properties);

        // 计算地理信息
        const geoInfo = this.calculateGeoInfo(geometry);

        return {
          id: index + 1,
          adcode: properties.ISO_A2 || properties.ISO_A3 || properties.ADM0_A3 || `COUNTRY_${index}`,
          name: countryInfo.chinese,
          name_en: countryInfo.english,
          name_local: properties.NAME_LONG || properties.NAME,
          center: geoInfo.center,
          centroid: geoInfo.centroid,
          bbox: geoInfo.bbox,
          area_sqkm: properties.AREA_SQKM || properties.AREA || 0,
          population: properties.POP_EST || properties.POPULATION || 0,
          continent: countryInfo.continent,
          region: properties.REGION_WB || properties.REGION_UN || 'Unknown',
          subregion: properties.SUBREGION || 'Unknown',
          economy: properties.ECONOMY || 'Unknown',
          income_level: properties.INCOME_GRP || 'Unknown',
          iso2: properties.ISO_A2,
          iso3: properties.ISO_A3,
          un_code: properties.UN_A3,
          developed: properties.DEVELOPED || 'Unknown',
          sovereignty: properties.SOVEREIGNT || 'Independent',
          feature_class: properties.FEATURE_CLASS || 'Admin-0 country',
          scale_rank: properties.SCALERANK || 0,
          geometry_type: geometry.type,
          coordinates_count: this.countCoordinates(geometry.coordinates),

          // 原始属性（用于调试）
          _properties: properties
        };
      });
  }

  getCountryInfo (properties) {
    const englishName = properties.NAME_LONG || properties.NAME || properties.ADMIN || 'Unknown';

    // 完整的中文国家名称映射
    const chineseMap = {
      'Afghanistan': '阿富汗',
      'Albania': '阿尔巴尼亚',
      'Algeria': '阿尔及利亚',
      'Andorra': '安道尔',
      'Angola': '安哥拉',
      'Antigua and Barbuda': '安提瓜和巴布达',
      'Argentina': '阿根廷',
      'Armenia': '亚美尼亚',
      'Australia': '澳大利亚',
      'Austria': '奥地利',
      'Azerbaijan': '阿塞拜疆',
      'Bahamas': '巴哈马',
      'Bahrain': '巴林',
      'Bangladesh': '孟加拉国',
      'Barbados': '巴巴多斯',
      'Belarus': '白俄罗斯',
      'Belgium': '比利时',
      'Belize': '伯利兹',
      'Benin': '贝宁',
      'Bhutan': '不丹',
      'Bolivia': '玻利维亚',
      'Bosnia and Herzegovina': '波斯尼亚和黑塞哥维那',
      'Botswana': '博茨瓦纳',
      'Brazil': '巴西',
      'Brunei': '文莱',
      'Bulgaria': '保加利亚',
      'Burkina Faso': '布基纳法索',
      'Burundi': '布隆迪',
      'Cabo Verde': '佛得角',
      'Cambodia': '柬埔寨',
      'Cameroon': '喀麦隆',
      'Canada': '加拿大',
      'Central African Republic': '中非共和国',
      'Chad': '乍得',
      'Chile': '智利',
      'China': '中国',
      'Colombia': '哥伦比亚',
      'Comoros': '科摩罗',
      'Congo': '刚果',
      'Costa Rica': '哥斯达黎加',
      'Croatia': '克罗地亚',
      'Cuba': '古巴',
      'Cyprus': '塞浦路斯',
      'Czechia': '捷克',
      'Democratic Republic of the Congo': '刚果民主共和国',
      'Denmark': '丹麦',
      'Djibouti': '吉布提',
      'Dominica': '多米尼克',
      'Dominican Republic': '多米尼加共和国',
      'Ecuador': '厄瓜多尔',
      'Egypt': '埃及',
      'El Salvador': '萨尔瓦多',
      'Equatorial Guinea': '赤道几内亚',
      'Eritrea': '厄立特里亚',
      'Estonia': '爱沙尼亚',
      'Eswatini': '斯威士兰',
      'Ethiopia': '埃塞俄比亚',
      'Fiji': '斐济',
      'Finland': '芬兰',
      'France': '法国',
      'Gabon': '加蓬',
      'Gambia': '冈比亚',
      'Georgia': '格鲁吉亚',
      'Germany': '德国',
      'Ghana': '加纳',
      'Greece': '希腊',
      'Grenada': '格林纳达',
      'Guatemala': '危地马拉',
      'Guinea': '几内亚',
      'Guinea-Bissau': '几内亚比绍',
      'Guyana': '圭亚那',
      'Haiti': '海地',
      'Honduras': '洪都拉斯',
      'Hungary': '匈牙利',
      'Iceland': '冰岛',
      'India': '印度',
      'Indonesia': '印度尼西亚',
      'Iran': '伊朗',
      'Iraq': '伊拉克',
      'Ireland': '爱尔兰',
      'Israel': '以色列',
      'Italy': '意大利',
      'Jamaica': '牙买加',
      'Japan': '日本',
      'Jordan': '约旦',
      'Kazakhstan': '哈萨克斯坦',
      'Kenya': '肯尼亚',
      'Kiribati': '基里巴斯',
      'Kuwait': '科威特',
      'Kyrgyzstan': '吉尔吉斯斯坦',
      'Laos': '老挝',
      'Latvia': '拉脱维亚',
      'Lebanon': '黎巴嫩',
      'Lesotho': '莱索托',
      'Liberia': '利比里亚',
      'Libya': '利比亚',
      'Liechtenstein': '列支敦士登',
      'Lithuania': '立陶宛',
      'Luxembourg': '卢森堡',
      'Madagascar': '马达加斯加',
      'Malawi': '马拉维',
      'Malaysia': '马来西亚',
      'Maldives': '马尔代夫',
      'Mali': '马里',
      'Malta': '马耳他',
      'Marshall Islands': '马绍尔群岛',
      'Mauritania': '毛里塔尼亚',
      'Mauritius': '毛里求斯',
      'Mexico': '墨西哥',
      'Micronesia': '密克罗尼西亚',
      'Moldova': '摩尔多瓦',
      'Monaco': '摩纳哥',
      'Mongolia': '蒙古',
      'Montenegro': '黑山',
      'Morocco': '摩洛哥',
      'Mozambique': '莫桑比克',
      'Myanmar': '缅甸',
      'Namibia': '纳米比亚',
      'Nauru': '瑙鲁',
      'Nepal': '尼泊尔',
      'Netherlands': '荷兰',
      'New Zealand': '新西兰',
      'Nicaragua': '尼加拉瓜',
      'Niger': '尼日尔',
      'Nigeria': '尼日利亚',
      'North Korea': '朝鲜',
      'North Macedonia': '北马其顿',
      'Norway': '挪威',
      'Oman': '阿曼',
      'Pakistan': '巴基斯坦',
      'Palau': '帕劳',
      'Palestine': '巴勒斯坦',
      'Panama': '巴拿马',
      'Papua New Guinea': '巴布亚新几内亚',
      'Paraguay': '巴拉圭',
      'Peru': '秘鲁',
      'Philippines': '菲律宾',
      'Poland': '波兰',
      'Portugal': '葡萄牙',
      'Qatar': '卡塔尔',
      'Romania': '罗马尼亚',
      'Russia': '俄罗斯',
      'Rwanda': '卢旺达',
      'Saint Kitts and Nevis': '圣基茨和尼维斯',
      'Saint Lucia': '圣卢西亚',
      'Saint Vincent and the Grenadines': '圣文森特和格林纳丁斯',
      'Samoa': '萨摩亚',
      'San Marino': '圣马力诺',
      'Sao Tome and Principe': '圣多美和普林西比',
      'Saudi Arabia': '沙特阿拉伯',
      'Senegal': '塞内加尔',
      'Serbia': '塞尔维亚',
      'Seychelles': '塞舌尔',
      'Sierra Leone': '塞拉利昂',
      'Singapore': '新加坡',
      'Slovakia': '斯洛伐克',
      'Slovenia': '斯洛文尼亚',
      'Solomon Islands': '所罗门群岛',
      'Somalia': '索马里',
      'South Africa': '南非',
      'South Korea': '韩国',
      'South Sudan': '南苏丹',
      'Spain': '西班牙',
      'Sri Lanka': '斯里兰卡',
      'Sudan': '苏丹',
      'Suriname': '苏里南',
      'Sweden': '瑞典',
      'Switzerland': '瑞士',
      'Syria': '叙利亚',
      'Taiwan': '台湾',
      'Tajikistan': '塔吉克斯坦',
      'Tanzania': '坦桑尼亚',
      'Thailand': '泰国',
      'Timor-Leste': '东帝汶',
      'Togo': '多哥',
      'Tonga': '汤加',
      'Trinidad and Tobago': '特立尼达和多巴哥',
      'Tunisia': '突尼斯',
      'Turkey': '土耳其',
      'Turkmenistan': '土库曼斯坦',
      'Tuvalu': '图瓦卢',
      'Uganda': '乌干达',
      'Ukraine': '乌克兰',
      'United Arab Emirates': '阿拉伯联合酋长国',
      'United Kingdom': '英国',
      'United States': '美国',
      'Uruguay': '乌拉圭',
      'Uzbekistan': '乌兹别克斯坦',
      'Vanuatu': '瓦努阿图',
      'Venezuela': '委内瑞拉',
      'Vietnam': '越南',
      'Yemen': '也门',
      'Zambia': '赞比亚',
      'Zimbabwe': '津巴布韦'
    };

    // 大洲映射
    const continentMap = {
      'AF': 'Africa',
      'AS': 'Asia',
      'EU': 'Europe',
      'NA': 'North America',
      'SA': 'South America',
      'OC': 'Oceania',
      'AN': 'Antarctica'
    };

    return {
      english: englishName,
      chinese: chineseMap[englishName] || englishName,
      continent: continentMap[properties.CONTINENT] || properties.REGION_UN || 'Unknown'
    };
  }

  calculateGeoInfo (geometry) {
    if (!geometry.coordinates) {
      return {
        center: [0, 0],
        centroid: [0, 0],
        bbox: [0, 0, 0, 0]
      };
    }

    const allCoords = this.extractAllCoordinates(geometry.coordinates);

    if (allCoords.length === 0) {
      return {
        center: [0, 0],
        centroid: [0, 0],
        bbox: [0, 0, 0, 0]
      };
    }

    // 计算边界框
    const lons = allCoords.map(coord => coord[0]);
    const lats = allCoords.map(coord => coord[1]);

    const bbox = [
      Math.min(...lons),
      Math.min(...lats),
      Math.max(...lons),
      Math.max(...lats)
    ];

    // 计算中心点（边界框中心）
    const center = [
      (bbox[0] + bbox[2]) / 2,
      (bbox[1] + bbox[3]) / 2
    ];

    // 计算质心（坐标平均值）
    const sumLon = allCoords.reduce((sum, coord) => sum + coord[0], 0);
    const sumLat = allCoords.reduce((sum, coord) => sum + coord[1], 0);
    const centroid = [
      sumLon / allCoords.length,
      sumLat / allCoords.length
    ];

    return { center, centroid, bbox };
  }

  extractAllCoordinates (coordinates) {
    const allCoords = [];

    const extract = (arr) => {
      if (!Array.isArray(arr)) return;

      if (arr.length >= 2 && typeof arr[0] === 'number') {
        // 这是一个坐标点 [lon, lat]
        allCoords.push([arr[0], arr[1]]);
      } else {
        // 递归处理嵌套数组
        arr.forEach(item => extract(item));
      }
    };

    extract(coordinates);
    return allCoords;
  }

  countCoordinates (coordinates) {
    let count = 0;

    const countRecursive = (arr) => {
      if (!Array.isArray(arr)) return;

      if (arr.length >= 2 && typeof arr[0] === 'number') {
        count++;
      } else {
        arr.forEach(item => countRecursive(item));
      }
    };

    countRecursive(coordinates);
    return count;
  }

  async saveRawData (data, sourceName) {
    await fs.ensureDir('./output');
    const filename = `raw-${sourceName.toLowerCase().replace(/\s+/g, '-')}.json`;
    await fs.writeJson(`./output/${filename}`, data, { spaces: 2 });
  }

  async saveProcessedData (data) {
    await fs.ensureDir('./output');

    // 保存完整数据
    await fs.writeJson('./output/world-countries-complete.json', data, { spaces: 2 });

    // 保存简化版本（用于前端）
    const simplified = data.map(country => ({
      adcode: country.adcode,
      name: country.name,
      name_en: country.name_en,
      center: country.center,
      centroid: country.centroid,
      continent: country.continent,
      region: country.region,
      iso2: country.iso2,
      iso3: country.iso3,
      population: country.population,
      area_sqkm: country.area_sqkm
    }));

    await fs.writeJson('./output/world-countries-simplified.json', simplified, { spaces: 2 });

    return simplified;
  }
}

// 创建实例并导出函数
const fetcher = new WorldDataFetcher();

async function fetchCompleteWorldData () {
  // const data = await fetcher.fetchCompleteWorldData();
  const data = fetcher.processGeoJSONData(rawData);
  return await fetcher.saveProcessedData(data);
}

module.exports = {
  fetchCompleteWorldData,
  WorldDataFetcher
};