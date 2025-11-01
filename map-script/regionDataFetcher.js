const https = require('https');
const fs = require('fs');
const path = require('path');
const rawData = require('./utils/raw-natural-earth-10m.json');

class RegionDataFetcher {
  constructor() {
    this.cacheDir = './cache';
    this.ensureCacheDir();

    // 国家代码到数据源的映射
    this.dataSources = {
      'CN': {
        baseUrl: 'geo.datav.aliyun.com',
        basePath: '/areas_v3/bound',
        adcode: '100000'
      },
      'JP': {
        baseUrl: 'raw.githubusercontent.com',
        basePath: '/nvkelso/natural-earth-vector/master/geojson',
        adcode: '392000'
      }
    };
  }

  ensureCacheDir () {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // HTTPS 请求函数
  httpsRequest (options, postData = null) {
    return new Promise((resolve, reject) => {
      const request = https.request(options, (res) => {
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
  httpsRequest2 (options, postData = null) {
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

  async fetchData (countryCode, level = 'country') {
    try {
      const cacheFile = path.join(this.cacheDir, `${countryCode}_${level}.json`);

      // 检查缓存
      if (fs.existsSync(cacheFile)) {
        console.log(`从缓存加载数据: ${countryCode}_${level}`);
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }

      let options;
      if (countryCode === 'JP') {
        // 使用 Natural Earth 数据源获取日本数据
        options = {
          hostname: this.dataSources[countryCode].baseUrl,
          path: `${this.dataSources[countryCode].basePath}/ne_10m_admin_0_countries.geojson`,
          method: 'GET',
          headers: {
            'User-Agent': 'Node.js Region Data Fetcher/1.0',
            'Accept': 'application/json'
          },
          timeout: 30000
        };
      } else {
        // 使用阿里云数据源获取其他国家数据
        const adcode = this.dataSources[countryCode]?.adcode || '100000';
        let urlPath;
        if (level === 'country') {
          urlPath = `${this.dataSources[countryCode].basePath}/${adcode}_full.json`;
        } else {
          urlPath = `${this.dataSources[countryCode].basePath}/${adcode}_full.json`;
        }

        options = {
          hostname: this.dataSources[countryCode].baseUrl,
          path: urlPath,
          method: 'GET',
          headers: {
            'User-Agent': 'Node.js Region Data Fetcher/1.0',
            'Accept': 'application/json'
          },
          timeout: 30000
        };
      }

      console.log(`正在获取数据: https://${options.hostname}${options.path}`);
      let data = null
      // console.log(`${options.path}`);

      if (options.path === '/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson') {
        console.log(`跳过请求 ，使用本地数据`);
        data = rawData
      } else {
        data = await this.httpsRequest(options);
      }

      // 缓存数据
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
      console.log(`数据已缓存: ${cacheFile}`);

      return data;
    } catch (error) {
      console.error(`获取数据失败 (country: ${countryCode}, level: ${level}):`, error.message);
      return null;
    }
  }

  // 获取指定国家的所有一级行政区划数据
  async getAllRegions (countryCode, regionType = 'province') {
    const countryData = await this.fetchData(countryCode, 'country');
    if (!countryData) return null;

    const regions = [];

    if (countryCode === 'JP') {
      // 处理日本数据 (Natural Earth 格式)
      for (const feature of countryData.features) {
        if (feature.properties.ISO_A2 === 'JP') {
          regions.push({
            adcode: '392000',
            name: '日本',
            name_en: 'Japan',
            level: 'country',
            geometry: feature.geometry
          });
          break;
        }
      }
    } else {
      // 处理中国和其他国家数据 (阿里云格式)
      for (const feature of countryData.features) {
        const adcode = feature.properties.adcode;

        // 根据不同国家的ADCODE规则筛选一级行政区划
        let isRegion = false;
        if (countryCode === 'CN') {
          // 中国：adcode以0000结尾且不等于100000
          isRegion = adcode.toString().endsWith('0000') && adcode !== '100000';
        } else {
          // 默认规则：adcode以000结尾且不等于国家adcode
          isRegion = adcode.toString().endsWith('000') && adcode !== this.dataSources[countryCode].adcode;
        }

        if (isRegion) {
          regions.push({
            adcode: feature.properties.adcode,
            name: feature.properties.name,
            name_en: feature.properties.name_en || feature.properties.name,
            center: feature.properties.center,
            centroid: feature.properties.centroid,
            level: regionType,
            geometry: feature.geometry
          });
        }
      }
    }

    return regions;
  }

  // 获取完整的国家行政区划数据
  async getFullCountryData (countryCode, regionType = 'province') {
    console.log(`开始获取 ${countryCode} 的行政区划数据...`);

    const regions = await this.getAllRegions(countryCode, regionType);
    if (!regions || regions.length === 0) {
      throw new Error(`获取 ${countryCode} 的行政区划数据失败`);
    }

    const result = {
      country: {
        code: countryCode,
        level: 'country',
        ...regions[0]  // 国家级别数据
      }
    };

    return result;
  }

  // 格式化数据为ECharts需要的格式
  formatForECharts (countryData) {
    const echartsData = {
      type: 'FeatureCollection',
      features: []
    };

    if (countryData.country) {
      echartsData.features.push({
        type: 'Feature',
        properties: {
          name: countryData.country.name,
          name_en: countryData.country.name_en || countryData.country.name,
          adcode: countryData.country.adcode || countryData.country.code,
          level: 'country'
        },
        geometry: countryData.country.geometry
      });
    }

    return echartsData;
  }

  // 保存数据到文件
  saveToFile (data, filename) {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`数据已保存到: ${filePath}`);
    return filePath;
  }
}

// 使用示例
async function main () {
  const fetcher = new RegionDataFetcher();

  try {
    // 1. 获取日本数据
    console.log('=== 获取日本数据 ===');
    const japanData = await fetcher.getFullCountryData('JP');
    const japanEcharts = fetcher.formatForECharts(japanData);
    fetcher.saveToFile(japanEcharts, 'japan_echarts.json');

    // 2. 获取中国数据
    console.log('\n=== 获取中国数据 ===');
    const chinaData = await fetcher.getFullCountryData('CN');
    const chinaEcharts = fetcher.formatForECharts(chinaData);
    fetcher.saveToFile(chinaEcharts, 'china_echarts.json');

    console.log('\n=== 数据获取完成 ===');
    console.log('生成的文件:');
    console.log('- japan_echarts.json (日本地图数据)');
    console.log('- china_echarts.json (中国地图数据)');

  } catch (error) {
    console.error('程序执行出错:', error);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length > 0) {
  const fetcher = new RegionDataFetcher();

  if (args[0] === 'country' && args[1]) {
    // 获取特定国家数据
    fetcher.getFullCountryData(args[1])
      .then(data => {
        if (data) {
          const echartsData = fetcher.formatForECharts(data);
          const filename = `country_${args[1]}_echarts.json`;
          fetcher.saveToFile(echartsData, filename);
        }
      })
      .catch(error => {
        console.error('获取国家数据失败:', error.message);
      });
  } else if (args[0] === 'full') {
    // 获取完整数据
    main();
  } else {
    console.log('用法:');
    console.log('node script.js full                    # 获取完整示例数据');
    console.log('node script.js country <code>          # 获取特定国家数据');
    console.log('\n示例:');
    console.log('node script.js country JP               # 获取日本数据');
    console.log('node script.js country CN              # 获取中国数据');
  }
} else {
  // 没有参数时运行完整示例
  main();
}