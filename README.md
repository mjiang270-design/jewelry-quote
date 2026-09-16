# 珠宝销售报价 V2.6｜融通金黄金9999版

## 实时金价来源

唯一实时行情源：

**融通金贵金属行情 → 黄金9999 → 销售价**

页面：
https://i.jzj9999.com/quoteh5

V2.6 不再使用 XAU/USD、USD/CNY 或任何第二实时行情源。

后台使用 Playwright 打开融通金页面，等待价格表渲染后读取：

- `.price-table-row`
- `.symbol-name` = 黄金9999
- 第2列 = 回购价
- 第3列 = 销售价
- 第4列 = 今日高 / 低

系统把**销售价**作为实时参考金价。

## 业务链路

融通金黄金9999销售价
→ Premium（可选）
→ 应用到报价金价
→ 锁定金价
→ 9K / 14K / 18K / 24K成本计算
→ 销售倍率
→ 客户报价

若融通金暂时读取失败：
- 不切换其他实时行情源
- 已锁定金价继续有效
- 手动报价金价继续可用
- 后端若有最近一次成功的“融通金同源数据”，会标记为 stale 后返回

## 为什么 V2.6 不能再只部署 index.html

融通金页面通过 JavaScript/WebSocket 渲染实时行情。
浏览器前端直接抓取会遇到跨域和二进制 WebSocket 协议问题。

因此 V2.6 包含：
- `public/index.html`：微信手机报价前端
- `server.js`：后台接口 `/api/gold`
- Playwright/Chromium：读取融通金渲染后的黄金9999价格

## 本地运行

需要 Node.js 20+：

```bash
npm install
npx playwright install chromium
npm start
```

打开：
http://localhost:3000

测试接口：
http://localhost:3000/api/gold

## 部署建议

这个版本需要“可运行 Node + Chromium”的服务器，不能只用普通静态网页托管。

推荐使用支持 Docker 的云服务，例如 Render / Railway / 自己的 VPS。
部署时直接使用本项目 Dockerfile 即可。

## 数据校验

`/api/gold` 返回示例：

```json
{
  "ok": true,
  "name": "黄金9999",
  "bidPrice": 1000.00,
  "askPrice": 1001.00,
  "high": 1010.00,
  "low": 990.00,
  "fetchedAt": "2026-09-16T...",
  "source": "融通金",
  "stale": false
}
```

前端只把 `askPrice`（销售价）用于“应用到报价金价”。

## 注意

融通金页面结构若未来改变，CSS选择器可能需要同步调整。
系统保留手动报价金价和锁价能力，避免第三方页面变化直接阻断销售报价。


## Render 快速部署

本项目现在包含 `render.yaml`。

上传到 GitHub 后，在 Render：
1. New → Blueprint
2. 连接这个 GitHub 仓库
3. Render 会读取 `render.yaml`
4. 创建 Web Service
5. 部署完成后测试 `/api/health` 和 `/api/gold`

注意：免费 Web Service 当前为 512MB RAM。Chromium 属于相对重的运行时；
如果实际抓价时遇到内存不足或频繁重启，需要把 Render 计划升级到更高内存。


## GitHub 根目录扁平版
本包专门匹配当前 GitHub 上传结构：
Dockerfile / README.md / index.html / package.json / render.yaml / server.js
不需要 public 文件夹；server.js 已同步调整。


## V2.7 页面简化
- 删除“市场价调整 / Premium”
- 删除“调整后报价参考”
- 融通金黄金9999销售价直接应用到报价金价
- 金价锁定保留
- 后台 /api/gold 无需修改


## V2.9 首页精简
- 删除首页顶部黑色说明框
- 保留原有计算、锁价、历史、多款报价、轻量模拟等功能
- 只需覆盖 index.html 即可上线


## V3.0 报价流程修复
- 新增“保存当前报价并填写客户信息”按钮
- 点击后自动保存当前产品，避免未加入多款时丢失
- 如果当前产品已经加入多款报价，不重复添加
- 自动跳转客户页并定位到客户资料填写区
- “加入多款报价单”改用轻提示，不再弹窗打断
- 修复轻量版模拟输入时重绘导致无法正常输入的问题
- 修复轻量版模拟方案刷新后无法恢复的问题
