# receiptUI

基于 Verlet 积分的交互式小票纸张物理模拟 —— React + Three.js + WebGL

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.160-000000?logo=three.js&logoColor=white)

---

## 效果预览

小票顶部固定，下半部分在重力作用下自然下垂。鼠标左键拖拽可产生弯曲、褶皱、回弹，右键拖拽旋转视角。

## 核心特性

- **Verlet 积分物理引擎** — 粒子隐式速度计算，无需显式存储速度向量
- **距离约束系统** — 结构约束（防止拉伸）+ 剪切约束（防止倾斜）+ 弯曲约束（控制纸张刚度）
- **顶部边缘固定** — 整条水平约束，小票始终保持悬挂状态
- **鼠标交互** — 射线检测 + 邻域衰减权重拖拽，自然弯曲与褶皱
- **热敏纸材质** — Canvas 离屏绘制购物清单，噪点纹理模拟真实热敏纸
- **暖色调编辑风格 UI** — Playfair Display 衬线排版，入场动效，噪点纹理背景

## 物理架构

```
21 × 51 粒子网格 (1071 particles)
    │
    ├── 结构约束 ×1980    (水平 + 垂直相邻)
    ├── 剪切约束 ×1920    (对角相邻)
    └── 弯曲约束 × 280    (隔一跳连)
    ─────────────────
    合计 ≈ 4180 条约束，每帧 10 次迭代求解
```

每帧物理循环：

```
施加重力 + 风力扰动
        ↓
  Verlet 积分步进
        ↓
  迭代约束求解 (×10)
        ↓
  地面碰撞检测
        ↓
  同步几何体顶点
```

## 项目结构

```
receipt/
├── index.html                  # 入口 HTML
├── package.json                # 依赖配置
├── vite.config.js              # Vite 构建配置
└── src/
    ├── main.jsx                # React 挂载入口
    ├── App.jsx                 # 根组件 (UI 布局 + 入场动效)
    ├── index.css               # 全局样式 (排版 + 纹理 + 动画)
    ├── physics/
    │   ├── Particle.js         # Verlet 粒子
    │   ├── Constraint.js       # 距离约束
    │   └── ClothSimulation.js  # 布料模拟管理器
    ├── utils/
    │   └── receiptTexture.js   # 热敏纸购物清单纹理生成
    └── components/
        └── ReceiptCanvas.jsx   # Three.js 场景 / 光照 / 网格 / 交互
```

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 18 |
| 3D 引擎 | Three.js 0.160 |
| 构建 | Vite 5 |
| 物理 | 自研 Verlet 积分 + 距离约束 |
| 渲染 | WebGL (WebGLRenderer + PCFSoftShadowMap) |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/lyx0717/receipt-ui.git
cd receipt-ui

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:3000
```

## 操作说明

| 操作 | 效果 |
|---|---|
| 左键拖拽小票 | 抓取、弯曲、折叠，产生自然摆动与褶皱 |
| 右键拖拽 | 旋转 3D 视角 |

## 性能优化

- Vector3 对象复用，避免 GC 压力
- 几何体顶点原地更新，不重建 buffer
- 前端距检测跳过远端约束求解
- `clock.getDelta()` 限制 dt 上限 (0.025s) 防止物理爆炸
- pixelRatio 限制 2x 以控制渲染分辨率

## License

MIT
