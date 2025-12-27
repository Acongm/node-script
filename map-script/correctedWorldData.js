// correctedWorldData.js
const https = require('https');
const fs = require('fs-extra');
const rawData = require('./utils/raw-natural-earth-10m.json');

// 联合国成员国ISO代码（193个）
const UN_MEMBER_CODES = new Set([
  'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT',
  'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BT',
  'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH',
  'CM', 'CA', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD',
  'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO',
  'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FJ', 'FI',
  'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GD', 'GT', 'GN',
  'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ',
  'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KP',
  'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI',
  'LT', 'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR',
  'MU', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM',
  'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO',
  'OM', 'PK', 'PW', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT',
  'QA', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST',
  'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO',
  'ZA', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH', 'SY', 'TJ',
  'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TV',
  'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU', 'VE', 'VN',
  'YE', 'ZM', 'ZW'
]);

// 需要排除的非主权地区
const EXCLUDED_TERRITORIES = new Set([
  'Greenland', 'Puerto Rico', 'French Guiana', 'Guadeloupe',
  'Martinique', 'Réunion', 'Azores', 'Canary Islands', 'Bermuda',
  'Cayman Islands', 'Falkland Islands', 'Kashmir', 'Western Sahara',
  'Hong Kong', 'Macao', 'Svalbard', 'Åland Islands', 'Antarctica',
  'Northern Cyprus', 'American Samoa', 'Guam', 'Northern Mariana Islands',
  'U.S. Virgin Islands', 'British Virgin Islands', 'Anguilla',
  'Montserrat', 'Turks and Caicos Islands', 'Gibraltar', 'Faroe Islands',
  'Isle of Man', 'Channel Islands', 'Christmas Island', 'Cocos Islands',
  'Norfolk Island', 'Tokelau', 'Cook Islands', 'Niue', 'Wallis and Futuna',
  'French Polynesia', 'New Caledonia', 'Aruba', 'Curaçao', 'Sint Maarten',
  'Bonaire', 'Saba', 'Sint Eustatius', 'Saint Martin', 'Saint Barthélemy'
]);

async function fetchFromSource (url) {
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

/**
 * 从URL获取数据
 */
function fetchData (url) {
  return new Promise((resolve, reject) => {
    console.log(`正在从 ${url} 下载数据...`);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error('解析 JSON 失败'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    }).setTimeout(15000, () => {
      reject(new Error('请求超时'));
    });
  });
}

/**
 * 计算地理中心点
 */
function calculateCenter (geometry) {
  if (!geometry || !geometry.coordinates) {
    return [0, 0];
  }

  const allCoords = extractAllCoordinates(geometry.coordinates);

  if (allCoords.length === 0) {
    return [0, 0];
  }

  // 计算边界框中心
  const lons = allCoords.map(coord => coord[0]);
  const lats = allCoords.map(coord => coord[1]);

  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return [
    (minLon + maxLon) / 2,
    (minLat + maxLat) / 2
  ];
}

/**
 * 提取所有坐标点
 */
function extractAllCoordinates (coordinates) {
  const allCoords = [];

  function extract (arr) {
    if (!Array.isArray(arr)) return;

    if (arr.length >= 2 && typeof arr[0] === 'number') {
      // 这是一个坐标点 [lon, lat]
      allCoords.push([arr[0], arr[1]]);
    } else {
      // 递归处理嵌套数组
      arr.forEach(item => extract(item));
    }
  }

  extract(coordinates);
  return allCoords;
}

/**
 * 获取中文国家名称
 */
function getChineseName (englishName) {
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

  return chineseMap[englishName] || englishName;
}

/**
 * 根据国家代码获取大洲
 */
function getContinentFromCode (countryCode) {
  const continentMap = {
    // 亚洲
    'AF': 'Asia', 'AM': 'Asia', 'AZ': 'Asia', 'BH': 'Asia', 'BD': 'Asia',
    'BT': 'Asia', 'BN': 'Asia', 'KH': 'Asia', 'CN': 'Asia', 'CY': 'Asia',
    'GE': 'Asia', 'IN': 'Asia', 'ID': 'Asia', 'IR': 'Asia', 'IQ': 'Asia',
    'IL': 'Asia', 'JP': 'Asia', 'JO': 'Asia', 'KZ': 'Asia', 'KW': 'Asia',
    'KG': 'Asia', 'LA': 'Asia', 'LB': 'Asia', 'MY': 'Asia', 'MV': 'Asia',
    'MN': 'Asia', 'MM': 'Asia', 'NP': 'Asia', 'KP': 'Asia', 'OM': 'Asia',
    'PK': 'Asia', 'PH': 'Asia', 'QA': 'Asia', 'SA': 'Asia', 'SG': 'Asia',
    'KR': 'Asia', 'LK': 'Asia', 'SY': 'Asia', 'TW': 'Asia', 'TJ': 'Asia',
    'TH': 'Asia', 'TR': 'Asia', 'TM': 'Asia', 'AE': 'Asia', 'UZ': 'Asia',
    'VN': 'Asia', 'YE': 'Asia',

    // 欧洲
    'AL': 'Europe', 'AD': 'Europe', 'AT': 'Europe', 'BY': 'Europe', 'BE': 'Europe',
    'BA': 'Europe', 'BG': 'Europe', 'HR': 'Europe', 'CY': 'Europe', 'CZ': 'Europe',
    'DK': 'Europe', 'EE': 'Europe', 'FI': 'Europe', 'FR': 'Europe', 'DE': 'Europe',
    'GR': 'Europe', 'HU': 'Europe', 'IS': 'Europe', 'IE': 'Europe', 'IT': 'Europe',
    'LV': 'Europe', 'LI': 'Europe', 'LT': 'Europe', 'LU': 'Europe', 'MT': 'Europe',
    'MD': 'Europe', 'MC': 'Europe', 'ME': 'Europe', 'NL': 'Europe', 'MK': 'Europe',
    'NO': 'Europe', 'PL': 'Europe', 'PT': 'Europe', 'RO': 'Europe', 'RU': 'Europe',
    'SM': 'Europe', 'RS': 'Europe', 'SK': 'Europe', 'SI': 'Europe', 'ES': 'Europe',
    'SE': 'Europe', 'CH': 'Europe', 'UA': 'Europe', 'GB': 'Europe', 'VA': 'Europe',

    // 非洲
    'DZ': 'Africa', 'AO': 'Africa', 'BJ': 'Africa', 'BW': 'Africa', 'BF': 'Africa',
    'BI': 'Africa', 'CV': 'Africa', 'CM': 'Africa', 'CF': 'Africa', 'TD': 'Africa',
    'KM': 'Africa', 'CG': 'Africa', 'CD': 'Africa', 'CI': 'Africa', 'DJ': 'Africa',
    'EG': 'Africa', 'GQ': 'Africa', 'ER': 'Africa', 'SZ': 'Africa', 'ET': 'Africa',
    'GA': 'Africa', 'GM': 'Africa', 'GH': 'Africa', 'GN': 'Africa', 'GW': 'Africa',
    'KE': 'Africa', 'LS': 'Africa', 'LR': 'Africa', 'LY': 'Africa', 'MG': 'Africa',
    'MW': 'Africa', 'ML': 'Africa', 'MR': 'Africa', 'MU': 'Africa', 'MA': 'Africa',
    'MZ': 'Africa', 'NA': 'Africa', 'NE': 'Africa', 'NG': 'Africa', 'RW': 'Africa',
    'ST': 'Africa', 'SN': 'Africa', 'SC': 'Africa', 'SL': 'Africa', 'SO': 'Africa',
    'ZA': 'Africa', 'SS': 'Africa', 'SD': 'Africa', 'TZ': 'Africa', 'TG': 'Africa',
    'TN': 'Africa', 'UG': 'Africa', 'ZM': 'Africa', 'ZW': 'Africa',

    // 北美洲
    'AG': 'North America', 'BS': 'North America', 'BB': 'North America', 'BZ': 'North America',
    'CA': 'North America', 'CR': 'North America', 'CU': 'North America', 'DM': 'North America',
    'DO': 'North America', 'SV': 'North America', 'GD': 'North America', 'GT': 'North America',
    'HT': 'North America', 'HN': 'North America', 'JM': 'North America', 'MX': 'North America',
    'NI': 'North America', 'PA': 'North America', 'KN': 'North America', 'LC': 'North America',
    'VC': 'North America', 'TT': 'North America', 'US': 'North America',

    // 南美洲
    'AR': 'South America', 'BO': 'South America', 'BR': 'South America', 'CL': 'South America',
    'CO': 'South America', 'EC': 'South America', 'GY': 'South America', 'PY': 'South America',
    'PE': 'South America', 'SR': 'South America', 'UY': 'South America', 'VE': 'South America',

    // 大洋洲
    'AU': 'Oceania', 'FJ': 'Oceania', 'KI': 'Oceania', 'MH': 'Oceania', 'FM': 'Oceania',
    'NR': 'Oceania', 'NZ': 'Oceania', 'PW': 'Oceania', 'PG': 'Oceania', 'WS': 'Oceania',
    'SB': 'Oceania', 'TO': 'Oceania', 'TV': 'Oceania', 'VU': 'Oceania'
  };

  return continentMap[countryCode] || 'Unknown';
}

/**
 * 处理过滤后的数据
 */
function processFilteredData (features) {
  return features.map((feature, index) => {
    const properties = feature.properties || {};
    const geometry = feature.geometry || {};
    const name = properties.NAME_ZH || getChineseName(properties.NAME_LONG || properties.NAME)

    return {
      id: index + 1,
      adcode: fixIsoA2Code(properties.ISO_A2, name),
      name,
      name_en: properties.NAME_EN || properties.NAME_LONG || properties.NAME,
      name_local: properties.NAME_LONG || properties.NAME,
      center: calculateCenter(geometry),
      centroid: calculateCenter(geometry),
      isoCode: properties.ISO_A2,
      isoCode3: properties.ISO_A3,
      continent: getContinentFromCode(properties.ISO_A2),
      region: properties.REGION_WB || properties.REGION_UN || 'Unknown',
      population: properties.POP_EST || properties.POPULATION || 0,
      area_sqkm: properties.AREA_SQKM || properties.AREA || 0,
      sovereignty: 'Sovereign' // 标记为主权国家
    };
  });
}

/**
 * 保存结果
 */
async function saveResults (data, count) {
  await fs.ensureDir('./output');

  // 保存完整的主权国家数据
  await fs.writeJson('./output/sovereign-countries.json', data, { spaces: 2 });

  // 保存简化版本
  const simplified = data.map(country => ({
    adcode: country.adcode,
    name: country.name,
    name_en: country.name_en,
    center: country.center,
    continent: country.continent,
    isoCode: country.isoCode,
    population: country.population,
    area_sqkm: country.area_sqkm
  }));

  await fs.writeJson('./output/sovereign-countries-simplified.json', simplified, { spaces: 2 });

  // 保存统计信息
  await fs.writeJson('./output/country-count.json', {
    total: count,
    timestamp: new Date().toISOString(),
    source: 'Natural Earth Data + UN Member Filter'
  }, { spaces: 2 });

  console.log(`✅ 保存了 ${count} 个主权国家数据`);
}


const fixIsoA2Code = (isoCode, name) => {
  // 如果ISO_A2是-99，那么我们尝试通过国家名称来获取正确的ISO代码
  if (isoCode === '-99') {
    // 创建一个名称到ISO代码的映射（针对法国和挪威）
    const nameToISO = {
      '法国': 'FR',
      '法兰西': 'FR',
      'France': 'FR',
      '挪威': 'NO',
      'Norway': 'NO'
    };
    // 如果当前名称在映射中，则使用映射的ISO代码
    if (nameToISO[name]) {
      return nameToISO[name];
    }
  }
  return isoCode
}

/**
 * 获取修正后的世界数据
 */
async function getCorrectedWorldData () {
  try {
    const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
    const data = await fetchFromSource(url);
    // const data = rawData

    if (!data || !data.features) {
      throw new Error('无效的数据格式');
    }

    console.log(`原始数据包含: ${data.features.length} 个特征`);
    // await fs.writeJson('./output/order-all.json', data, { spaces: 2 });

    // 过滤出真正的国家
    const sovereignCountries = data.features.filter(feature => {
      const props = feature.properties || {};
      const name = props.NAME || props.NAME_LONG || '';
      const isoCode = fixIsoA2Code(props.ISO_A2, name);

      // 条件1: 必须是联合国成员国
      const isUNMember = UN_MEMBER_CODES.has(isoCode);

      // 条件2: 不能是非主权地区
      const isNotExcluded = !EXCLUDED_TERRITORIES.has(name);

      // 条件3: 必须有有效的ISO代码
      const hasValidISO = isoCode && isoCode.length === 2;

      if (['法国', '挪威'].includes(props.NAME_ZH)) {
        console.log(isoCode, 'isUNMember', isUNMember)
        console.log(name, 'isNotExcluded', isNotExcluded)
        console.log(isoCode, 'hasValidISO', hasValidISO)
      }

      return isUNMember && isNotExcluded && hasValidISO;
    });

    console.log(`过滤后得到: ${sovereignCountries.length} 个主权国家`);

    await fs.writeJson('./output/sovereign-countries-all.json', processFilteredData(data.features), { spaces: 2 });
    // 处理数据
    const processedData = processFilteredData(sovereignCountries);

    // 保存结果
    await saveResults(processedData, sovereignCountries.length);

    return processedData;

  } catch (error) {
    console.error('获取数据失败:', error.message);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  getCorrectedWorldData()
    .then((data) => {
      console.log('\n🎉 主权国家数据获取完成！');
      console.log(`📊 最终结果: ${data.length} 个联合国成员国`);

      // 显示前5个国家作为示例
      console.log('\n前5个国家示例:');
      data.slice(0, 5).forEach(country => {
        console.log(`${country.name} (${country.name_en}) - ${country.isoCode}`);
      });
    })
    .catch(error => {
      console.error('\n❌ 错误:', error.message);
      process.exit(1);
    });
}

module.exports = {
  getCorrectedWorldData,
  UN_MEMBER_CODES,
  EXCLUDED_TERRITORIES
};