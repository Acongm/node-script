
        (function(modules) {
            // 模块缓存
            // (虽然这个简单版本没做缓存，但标准 Webpack 会有 installedModules)

            // 自定义的 require 函数
            function require(id) {
                // 根据 id 获取模块：[fn, mapping]
                const [fn, mapping] = modules[id];

                // 定义一个辅助 require，用于处理模块内部的相对路径引用
                // 因为模块内部 import 是相对路径 ('./message.js')，而我们的 modules 是用 id 索引的
                function localRequire(name) {
                    // 根据相对路径 name，查 mapping 表找到对应的 id
                    return require(mapping[name]);
                }

                // 构造 module 对象
                const module = { exports: {} };

                // 执行模块代码
                // 传入: localRequire (作为 require), module, module.exports (作为 exports)
                fn(localRequire, module, module.exports);

                // 返回模块导出的内容
                return module.exports;
            }

            // 从入口模块 (id=0) 开始执行
            require(0);
        })({0: [
            function (require, module, exports) {
                "use strict";

var _message = _interopRequireDefault(require("./message.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
console.log(_message["default"]);
            },
            {"./message.js":1},
        ],1: [
            function (require, module, exports) {
                "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _name = require("./name.js");
var _default = exports["default"] = "Hello ".concat(_name.name, "!");
            },
            {"./name.js":2},
        ],2: [
            function (require, module, exports) {
                "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.name = void 0;
var name = exports.name = 'World';
            },
            {},
        ],})
    