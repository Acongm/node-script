const https = require('https');
const fs = require('fs');
const path = require('path');

class ChinaRegionDataFetcher {
  constructor() {
    this.baseUrl = 'geo.datav.aliyun.com';
    this.baseFile = '/output-country';
    this.basePath = '/areas_v3/bound';
    this.cacheDir = `.${this.baseFile}/cache`;
    this.ensureCacheDir();
  }

  ensureCacheDir () {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // HTTPS 请求函数
  httpsRequest (options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (e) {
              resolve(data); // 如果不是JSON，返回原始数据
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  async fetchData (adcode, level = 'province') {
    try {
      const cacheFile = path.join(this.cacheDir, `${adcode}_${level}.json`);

      // 检查缓存
      if (fs.existsSync(cacheFile)) {
        console.log(`从缓存加载数据: ${adcode}_${level}`);
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }

      let urlPath;
      if (level === 'country') {
        urlPath = `${this.basePath}/100000_full.json`;
      } else {
        urlPath = `${this.basePath}/${adcode}_full.json`;
      }

      console.log(`正在获取数据: https://${this.baseUrl}${urlPath}`);

      const options = {
        hostname: this.baseUrl,
        path: urlPath,
        method: 'GET',
        headers: {
          'User-Agent': 'Node.js China Region Data Fetcher/1.0',
          'Accept': 'application/json'
        },
        timeout: 30000
      };

      const data = await this.httpsRequest(options);

      // 缓存数据
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
      console.log(`数据已缓存: ${cacheFile}`);

      return data;
    } catch (error) {
      console.error(`获取数据失败 (adcode: ${adcode}, level: ${level}):`, error.message);
      return null;
    }
  }

  // 获取中国所有省份数据
  async getAllProvinces () {
    const countryData = await this.fetchData('100000', 'country');
    if (!countryData) return null;

    const provinces = [];
    for (const feature of countryData.features) {
      const adcode = feature.properties.adcode;
      if (adcode.toString().endsWith('0000') && adcode !== '100000') {
        provinces.push({
          adcode: feature.properties.adcode,
          name: feature.properties.name,
          center: feature.properties.center,
          centroid: feature.properties.centroid,
          level: 'province'
        });
      }
    }
    return provinces;
  }

  // 获取指定省份的所有城市数据
  async getCitiesByProvince (provinceAdcode) {
    const provinceData = await this.fetchData(provinceAdcode, 'city');
    if (!provinceData) return null;

    const cities = [];
    for (const feature of provinceData.features) {
      const adcode = feature.properties.adcode;
      // 城市级别的adcode：前4位相同，后2位不为00
      if (adcode.toString().substring(0, 4) === provinceAdcode.toString().substring(0, 4) &&
        !adcode.toString().endsWith('00')) {
        cities.push({
          adcode: feature.properties.adcode,
          name: feature.properties.name,
          center: feature.properties.center,
          centroid: feature.properties.centroid,
          level: 'city',
          parent: provinceAdcode
        });
      }
    }
    return cities;
  }

  // 获取指定城市的所有区县数据
  async getDistrictsByCity (cityAdcode) {
    const cityData = await this.fetchData(cityAdcode, 'district');
    if (!cityData) return null;

    const districts = [];
    for (const feature of cityData.features) {
      districts.push({
        adcode: feature.properties.adcode,
        name: feature.properties.name,
        center: feature.properties.center,
        centroid: feature.properties.centroid,
        level: 'district',
        parent: cityAdcode
      });
    }
    return districts;
  }

  // 获取完整的省市区三级数据
  async getFullChinaData () {
    console.log('开始获取中国省市区数据...');

    const provinces = await this.getAllProvinces();
    if (!provinces) {
      throw new Error('获取省份数据失败');
    }

    const result = {
      country: {
        adcode: '100000',
        name: '中国',
        level: 'country'
      },
      provinces: []
    };

    for (const province of provinces) {
      console.log(`获取 ${province.name} 的城市数据...`);
      const cities = await this.getCitiesByProvince(province.adcode);

      const provinceData = {
        ...province,
        cities: []
      };

      if (cities) {
        for (const city of cities) {
          console.log(`获取 ${city.name} 的区县数据...`);
          const districts = await this.getDistrictsByCity(city.adcode);

          const cityData = {
            ...city,
            districts: districts || []
          };

          provinceData.cities.push(cityData);
        }
      }

      result.provinces.push(provinceData);
    }

    return result;
  }

  // 格式化数据为ECharts需要的格式
  formatForECharts (fullData) {
    const echartsData = {
      type: 'FeatureCollection',
      features: []
    };

    // 递归处理所有层级的数据
    const processFeatures = (data, parentAdcode = null) => {
      if (!data || !data.features) return;

      for (const feature of data.features) {
        const newFeature = {
          type: 'Feature',
          properties: {
            name: feature.properties.name,
            adcode: feature.properties.adcode,
            level: this.getLevelByAdcode(feature.properties.adcode),
            parent: parentAdcode
          },
          geometry: feature.geometry
        };

        if (feature.properties.center) {
          newFeature.properties.center = feature.properties.center;
        }
        if (feature.properties.centroid) {
          newFeature.properties.centroid = feature.properties.centroid;
        }

        echartsData.features.push(newFeature);
      }
    };

    return echartsData;
  }

  getLevelByAdcode (adcode) {
    const code = adcode.toString();
    if (code === '100000') return 'country';
    if (code.endsWith('0000')) return 'province';
    if (code.endsWith('00')) return 'city';
    return 'district';
  }

  // 保存数据到文件
  saveToFile (data, filename) {
    const filePath = path.join(`${process.cwd()}${this.baseFile}`, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`数据已保存到: ${filePath}`);
    return filePath;
  }
}

// 使用示例
async function main () {
  const fetcher = new ChinaRegionDataFetcher();

  try {
    // 1. 获取完整的省市区数据
    console.log('=== 获取完整省市区数据 ===');
    const fullData = await fetcher.getFullChinaData();
    fetcher.saveToFile(fullData, 'china_full_regions.json');

    // 2. 获取特定省份的数据（示例：广东省 440000）
    console.log('\n=== 获取广东省数据 ===');
    const guangdongData = await fetcher.fetchData('440000', 'province');
    if (guangdongData) {
      fetcher.saveToFile(guangdongData, 'guangdong_province.json');

      // 获取广东省的城市数据
      const guangdongCities = await fetcher.getCitiesByProvince('440000');
      fetcher.saveToFile(guangdongCities, 'guangdong_cities.json');
    }

    // 3. 获取特定城市的数据（示例：深圳市 440300）
    console.log('\n=== 获取深圳市数据 ===');
    const shenzhenData = await fetcher.fetchData('440300', 'city');
    if (shenzhenData) {
      fetcher.saveToFile(shenzhenData, 'shenzhen_city.json');

      // 获取深圳市的区县数据
      const shenzhenDistricts = await fetcher.getDistrictsByCity('440300');
      fetcher.saveToFile(shenzhenDistricts, 'shenzhen_districts.json');
    }

    // 4. 格式化为ECharts数据
    console.log('\n=== 格式化为ECharts数据 ===');
    const countryData = await fetcher.fetchData('100000', 'country');
    if (countryData) {
      const echartsData = fetcher.formatForECharts(countryData);
      fetcher.saveToFile(echartsData, 'china_echarts.json');
    }

    console.log('\n=== 数据获取完成 ===');
    console.log('生成的文件:');
    console.log('- china_full_regions.json (完整省市区层级数据)');
    console.log('- guangdong_province.json (广东省边界数据)');
    console.log('- guangdong_cities.json (广东省城市列表)');
    console.log('- shenzhen_city.json (深圳市边界数据)');
    console.log('- shenzhen_districts.json (深圳市区县列表)');
    console.log('- china_echarts.json (ECharts格式数据)');

  } catch (error) {
    console.error('程序执行出错:', error);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length > 0) {
  const fetcher = new ChinaRegionDataFetcher();

  if (args[0] === 'province' && args[1]) {
    // 获取特定省份数据
    fetcher.fetchData(args[1], 'province')
      .then(data => {
        if (data) {
          const filename = `province_${args[1]}.json`;
          fetcher.saveToFile(data, filename);
        }
      });
  } else if (args[0] === 'city' && args[1]) {
    // 获取特定城市数据
    fetcher.fetchData(args[1], 'city')
      .then(data => {
        if (data) {
          const filename = `city_${args[1]}.json`;
          fetcher.saveToFile(data, filename);
        }
      });
  } else if (args[0] === 'full') {
    // 获取完整数据
    main();
  } else {
    console.log('用法:');
    console.log('node script.js full                    # 获取完整中国省市区数据');
    console.log('node script.js province <adcode>      # 获取特定省份数据');
    console.log('node script.js city <adcode>          # 获取特定城市数据');
    console.log('\n示例:');
    console.log('node script.js province 440000         # 获取广东省数据');
    console.log('node script.js city 440300            # 获取深圳市数据');
  }
} else {
  // 没有参数时运行完整示例
  main();
}