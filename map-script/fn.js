const data = require('./utils/data.json');
const sovereignCountriesSim = require('./output/sovereign-countries-simplified.json');
const sovereignCountries = require('./output/sovereign-countries.json');
const sovereignCountriesAll = require('./output/sovereign-countries-all.json');

// 运行程序
if (require.main === module) {
  const list = sovereignCountriesSim.map(t => t.adcode)
  const dataList = data['联合国会员国']['国家列表']
  const dataListCode = dataList.map(t => t.alpha2)
  console.log('sovereignCountries sovereignCountries', list.length);
  console.log('sovereignCountries length', sovereignCountries.length);
  console.log('sovereignCountriesAll length', sovereignCountriesAll.length);

  const otherList = dataListCode.filter(t => {
    return !list.includes(t)
  })

  const otherList2 = list.filter(t => {
    return !dataListCode.includes(t)
  })
  console.log('otherList', otherList.join('、'));
  console.log('otherList2', otherList2.join('、'));

}
