# 镜牌 · Mirror Arcana

适用于 iPad 的私人电子塔罗应用原型。Python 标准库提供本地服务，无第三方运行依赖。

## 运行

需要 Python 3.10 或更新版本：

```sh
python3 server.py
```

在电脑打开 http://127.0.0.1:8000 。同一可信局域网内的 iPad 测试可运行 `python3 server.py --host 0.0.0.0`，再访问电脑的局域网地址和 8000 端口。此服务仅供本地开发，不应暴露在公网。

## 已实现

- 可编辑问题；iPad 可使用键盘自带听写。
- 滑动散牌混洗、切牌、单张 / 三张牌阵、逆位开关。
- 固定牌序选牌、避免重复、逐张翻牌。
- DeepSeek / OpenAI 综合解读与当前牌阵追问（需自备 API 密钥）。
- 基础象征资料、浏览器自动保存与刷新恢复、个人笔记、清除记录。
- 22 张大阿尔卡那符号示例牌。符号仅为界面占位，不是经典牌面复刻。

## 尚未实现

- 经过授权核实的完整 78 张经典牌面、专业审校牌义。
- 自定义牌组导入、历史记录列表、多个体系与复杂牌阵。
- 应用内语音识别、用户账号与正式部署。

当前基础资料为项目编写的简要概括，不冒充专业审校资料；AI 解读会根据当前牌阵和用户背景生成象征性分析，不保证预测或解释正确。用于象征探索，不能验证未来事实。

## 设计约束

语音识别结果必须可修改、确认后再提交。AI 只依据实际牌张、正逆位、位置、资料和已确认背景；不得虚构经历、他人思想或确定未来。服务端检查结构化引用与牌阵一致。追问默认不补牌，补牌必须明确确认。

牌序、逆位状态在洗牌时生成，切牌只旋转顺序；选牌引用固定牌组，刷新不重新抽牌。洗牌手势触发随机重排，是数字混洗模拟，不是物理运动仿真。关闭逆位时保留但忽略其内部方向标记。

## 数据与素材

当前问题、牌组顺序、抽牌结果、笔记存于此浏览器的 localStorage，没有上传服务。共享设备请清除数据。私人牌面、说明书、录音、密钥不应提交 Git。未来加入外部素材时须逐项记录来源及再分发许可。

## 检查

```sh
node --test tests/engine.test.mjs
python3 -m py_compile server.py
```

## 发布到 GitHub

1. 在自己的 GitHub 账号创建空仓库。
2. 在本项目目录执行 `git init`，检查待提交文件，再提交。
3. 添加自己的远程仓库并推送。不要提交 `.env`、私人资料或未经授权的牌面。

GitHub 仓库：https://github.com/chenyiweihaha/mirror-arcana 。当前为本地运行原型，尚未部署在线服务。代码许可采用 MIT；见 LICENSE。原型没有外部牌面素材。


## 接入 DeepSeek

1. 从 https://platform.deepseek.com/ 获取 API Key（API 调用可能收费）。不要把密钥发给别人。
2. 在项目根目录复制 `.env.example` 为 `.env`：`cp .env.example .env`。
3. 用 VS Code 打开 `.env`，将 `your_deepseek_api_key_here` 替换为你的密钥；保留 `DEEPSEEK_MODEL=deepseek-flash`，或填官方支持的模型。
4. 停止旧服务（Ctrl+C），重新运行 `python3 server.py`。刷新页面，完成翻牌后点击“结合我的问题解读”。
5. 输入追问并确认发送，沿用同一牌阵，最多10轮。

`.env` 已被 Git 忽略；不要放入 static 文件夹。环境变量优先于 .env。普通静态预览 / GitHub Pages 不提供 AI 后端，需要本项目 Python 服务。正式公网部署前还需用户认证、配额和生产服务器，当前仅适合本机或可信局域网。

仅在用户点击解读或发送追问后，向 DeepSeek 发送问题、实际牌张、后端读取的基础资料与本次对话，不发送个人笔记。结果保存在浏览器本地。后端核对返回牌阵、引用 id、明确提及的未抽中牌名，屏蔽错误格式并提供可重试错误；不自动重试以避免重复计费。这些检查不能验证自然语言每一句话的真实性，也不能完全防止模型受用户提示影响。基础资料仍需专业审校。

接口采用 https://api.deepseek.com/chat/completions，默认模型 deepseek-flash，JSON 输出，非思考模式。官方参考：https://api-docs.deepseek.com/en/ 。

后端检查：`python3 -m unittest discover -s tests -p 'test_*.py'`（使用模拟服务，不消耗 API 额度）。


## 保留两家 AI，并切换服务

已有 `.env` 不要覆盖已有密钥，手动补充配置：

```dotenv
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_MODEL=deepseek-flash
OPENAI_API_KEY=你的OpenAI密钥
OPENAI_MODEL=gpt-5.4-mini
```

只填实际会用的服务密钥即可。切换时把第一行改为 `AI_PROVIDER=openai` 或 `AI_PROVIDER=deepseek`，保存、停止旧服务并重新启动。未设置 AI_PROVIDER 时仍默认 DeepSeek，旧配置可继续使用。两家密钥各自保留，服务失败不会自动调用另一家；浏览器不能指定任意密钥或 API 地址。页面显示当前服务，每轮回答也记录其服务名称。切换服务后继续同一段对话，会将本次已有对话发送给新服务，点击前请确认。

OpenAI 接入的是 API，不是 ChatGPT 网页账号。密钥从 https://platform.openai.com/api-keys 创建；需要可用的 API 额度。采用 Responses API、`store=false`、JSON Schema 结构化输出；默认 gpt-5.4-mini，支持替换为兼容 Responses、结构化输出和 reasoning.effort=none 的可用模型。后端继续检查实际牌阵和引用。应用不主动将密钥返回浏览器，测试使用模拟响应，未使用真实密钥联调。

官方参考：https://developers.openai.com/api/reference/resources/responses/methods/create 、https://developers.openai.com/api/docs/models/gpt-5.4-mini 。
