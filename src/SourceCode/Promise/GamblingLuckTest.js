
// 链表节点
class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

let gameTimeout = null
// 赌博队列类 (基于链表)
class GamblingQueue {
    constructor(cheatProbability = 0.2, luckProbability = 0.1) {
        // 链表头尾指针
        this.head = null; // 消费端
        this.tail = null; // 生产端
        this.count = 0;   // 记录当前有多少"钱"
        this.profit = 10; // 初始资金
        this.globalId = 0; // 全局自增 ID，确保唯一顺序
        this.cheatProbability = cheatProbability; // 出老千概率 (默认 20%)
        this.luckProbability = luckProbability;   // 运气值 (默认 10%)

        // 启动内部生产逻辑 (只启动一次，后续由消费触发)
        this.playRound();
    }

  // 内部生产：不再定时器循环，而是单次执行
  // startProducing() { ... } 删掉

  // 玩一局游戏
  playRound () {
    // 自增 ID
    const currentId = ++this.globalId;

    // 1. 先下注：随机压大或压小
    const isBetBig = Math.random() > 0.5; // true: 压大, false: 压小
    const betStr = isBetBig ? '大' : '小';
    console.log(`+++ [单号#${currentId}] +++`);
    console.log(`--- 我压${betStr}`);

    // 2. 立即创建节点入队 (Result 先设为 null)
    const roundData = {
      id: currentId,
      betBig: isBetBig,
      isCheating: false,
      result: null
    };
    this.enqueue(roundData);

    // 3. 模拟开奖延迟 500ms
    setTimeout(() => {
      // 4. 随机开奖结果 (包含出老千和运气逻辑)
      let resultNum;
      const isCheating = Math.random() < this.cheatProbability; // 庄家出千概率
      const isLucky = Math.random() < this.luckProbability;     // 玩家运气爆棚概率

      let finalOutcome = 'normal'; // 'normal', 'cheat', 'lucky'

      // 冲突解决：当庄家出千遇上运气爆棚
      if (isCheating && isLucky) {
        if (this.luckProbability > this.cheatProbability) {
          finalOutcome = 'lucky';
          console.log(`!!! [单号#${currentId}] 巅峰对决：运气(${this.luckProbability.toFixed(2)}) 战胜 千术(${this.cheatProbability.toFixed(2)}) -> 强制玩家赢 !!!`);
        } else {
          finalOutcome = 'cheat';
          console.log(`!!! [单号#${currentId}] 巅峰对决：千术(${this.cheatProbability.toFixed(2)}) 碾压 运气(${this.luckProbability.toFixed(2)}) -> 强制玩家输 !!!`);
        }
      } else if (isCheating) {
        finalOutcome = 'cheat';
      } else if (isLucky) {
        finalOutcome = 'lucky';
        console.log(`!!! [单号#${currentId}] 鸿运当头！(强制玩家赢) !!!`);
      }

      if (finalOutcome === 'cheat') {
        // 出老千：故意让你输
        if (isBetBig) {
          resultNum = Math.floor(Math.random() * 3) + 1; // 1-3 (Small)
          console.log(`!!! [单号#${currentId}] 庄家出千！(你压大，强制开小) !!!`);
        } else {
          resultNum = Math.floor(Math.random() * 3) + 4; // 4-6 (Big)
          console.log(`!!! [单号#${currentId}] 庄家出千！(你压小，强制开大) !!!`);
        }
      } else if (finalOutcome === 'lucky') {
        // 运气爆棚：强制让你赢
        if (isBetBig) {
          resultNum = Math.floor(Math.random() * 3) + 4; // 4-6 (Big)
        } else {
          resultNum = Math.floor(Math.random() * 3) + 1; // 1-3 (Small)
        }
      } else {
        // 正常开奖 1-6
        resultNum = Math.floor(Math.random() * 6) + 1; 
      }
      
      roundData.isCheating = (finalOutcome === 'cheat');
      // 直接修改对象引用
      roundData.result = resultNum;
    }, 500);
  }

  // 入队操作 (尾插法)
  enqueue (item) {
    const node = new Node(item);

    if (this.tail) {
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = node;
      this.tail = node;
    }
    this.count++;
  }

  // 外部调用：消费操作 (头删法)
  consume () {
    // 如果链表为空
    if (!this.head) {
      console.log('===没钱了(没单子了)===');
      return;
    }

    // 取出头部数据
    const data = this.head.data;

    // --- 关键检查：如果结果还没出来，不能消费 ---
    if (data.result === null) {
      console.log('===等待开奖中... (头部订单未完成)===');
      return; // 不移动指针，下次再来
    }

    // 移动头指针 (只有开奖了才移走)
    this.head = this.head.next;

    // 如果取完后链表空了，tail 也要置空
    if (!this.head) {
      this.tail = null;
    }

    this.count--;

    // --- 在消费时判断输赢 ---
    const { id, betBig, result, isCheating } = data;
    const betStr = betBig ? '大' : '小';

    // 判断规则
    // 压大 & 结果4-6 -> 赢
    // 压小 & 结果1-3 -> 赢
    let isWin = false;
    if (betBig && result >= 4) isWin = true;
    if (!betBig && result <= 3) isWin = true;

    if (isCheating) console.log(`!!! 庄家出千！(你压${betBig ? '大' : '小'}，强制开${betBig ? '小' : '大'}) !!!`);
    if (isWin) {
      this.profit += 1;
      // 赢了运气增加 (上限 100%)
      this.luckProbability = Math.min(1.0, this.luckProbability + 0.02);
      console.log(`---赚--- [压${betStr}, 开${result}] 资金: $${this.profit} (运气值: ${(this.luckProbability * 100).toFixed(0)}%)`);
    } else {
      this.profit -= 1;
      // 输了运气减少 (下限 0%)
      this.luckProbability = Math.max(0.0, this.luckProbability - 0.01);
      console.log(`---赔了--- [压${betStr}, 开${result}] 资金: $${this.profit} (运气值: ${(this.luckProbability * 100).toFixed(0)}%)`);
    }

    if (this.profit <= 0) {
      console.log(`---倾家荡产---`);
      clearInterval(gameTimeout);
      return;
    }

    // --- 核心修改：消费完成后，立即触发下一轮下注 ---
    // 就像 Promise 的链式调用一样，前一个结束触发下一个
    setTimeout(() => {
      this.playRound();
    }, 1000);
  }
}

// ==========================================
// 运行逻辑 (测试模式)
// ==========================================

console.log('Test Start: High Cheat (40%) vs High Luck (40%)');
// Cheat 0.4, Luck 0.4 - Conflict should happen frequently
const game = new GamblingQueue(0.4, 0.4);

// Consume faster (every 1.5s)
gameTimeout = setInterval(() => {
  game.consume();
}, 1500);

// Stop after 30 seconds
setTimeout(() => {
    clearInterval(gameTimeout);
    console.log('Test Finished');
    process.exit(0);
}, 30000);
