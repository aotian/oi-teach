## 快速上手 — 仓库概要（给 AI 编码助手）

本仓库是两个静态演示页面：`mergesort.html`（归并排序可视化，含逆序计数）和 `qsort.html`（快速排序可视化）。每个文件是单文件前端演示：HTML + 内联 CSS + 内联 JavaScript（无构建流程）。

要点（大局）
- 两个主要页面位于根目录：`mergesort.html`、`qsort.html`。它们通过相似的约定渲染“steps”序列来演示算法步骤。
- 数据流：按钮事件 -> 生成步骤函数（`generateMergeSortSteps` / `generateQuicksortSteps`）-> 填充 `steps` 数组 -> 调用 `renderArray`/`renderSingleArray` 渲染 DOM -> 用户可通过“下一步”或自动播放观看。
- 设计理由：保持演示为单文件、零依赖（仅使用 CDN 的 Tailwind 和 Google Fonts），便于教学与快速迭代。

关键开发约定（请严格遵守）
- Step 对象结构是项目的契约（示例来自 `mergesort.html` 和 `qsort.html`）：
  - { array: [...], auxiliary?: [...], inversions?: number, highlights?: {...}, explanation?: string }
  - highlights 常见字段：`subArray`, `merging`, `sortedRanges`, `auxHighlights`, `compare`, `inversion`, `pivot`, `i`, `j`, `swapping`, `partition`, `sorted` 等。
  - 当新增 highlight 类型时，必须同时更新对应的渲染函数（`renderArray` 或 `renderSingleArray`）以映射到正确的 CSS 类（例如 `bar-merge`、`bar-compare`、`bar-inversion`）。

重要 DOM 与控制点（在代码中直接引用）
- 全局容器：`bar-container`（主数组），`aux-bar-container`（辅助数组），`aux-container`（辅助区域）。
- 控件 ID：`randomize-btn`, `sort-btn`, `next-step-btn`, `reset-btn`, `speed-slider`。
- 文案位置：`explanation-text`（当前步骤说明），`inversion-count`（归并例子中显示逆序数）。

修改算法或新增可视化要点
- 修改排序逻辑：首选编辑相应文件中的 `generateMergeSortSteps` 或 `generateQuicksortSteps`，保持函数签名与返回的 steps 数组格式一致。
- 新增高亮/样式：
  1) 在 step.highlights 中添加约定好的 key；
  2) 在 `renderArray`/`renderSingleArray` 中根据 key 映射到已有或新增的 CSS 类；
  3) 如需新样式，修改 head 内的 <style>，使用现有类前缀（如 `bar-`）保持一致。
- 保持 explanation 文本（目前为中文）与步骤顺序一致，UI 直接使用该字段显示，故不应移除或随意重命名。

运行 & 调试
- 本项目无需构建：在本地直接用浏览器打开 `mergesort.html` 或 `qsort.html` 即可。
- 推荐在本地启动简单静态服务器以避免某些浏览器对本地文件的限制（PowerShell 示例）：

```powershell
# 在仓库根目录运行（Windows PowerShell）
python -m http.server 8000
# 然后在浏览器打开: http://localhost:8000/mergesort.html
```

- 也可使用 VSCode 的 Live Server 插件进行热重载调试。

项目约束与常见误区
- 不存在后端或打包配置：不要尝试寻找 package.json、webpack 配置或测试框架。
- 所有交互均在内联 JS 中实现；重构时尽量维护现有 DOM ID 与 step 结构以免破坏渲染契约。
- 大数组可能导致渲染/动画卡顿；若需性能优化，优先减少 step 的数量或合并可合并的中间状态。

示例任务（如何安全修改）
- 添加一个新 highlight（例如 `highlightMax`）：
 1) 在 `generate*Steps` 中为相应 step 添加 `highlights.highlightMax = [index]`；
 2) 在 `renderArray` 中处理 `highlights.highlightMax` 并添加一个 `bar-highlight-max` 类；
 3) 在文件 head 的 style 区定义 `.bar-highlight-max` 的视觉样式。

最后说明与检查点
- 变更后，手动在浏览器中打开受影响页面并验证：1) 无 JS 错误（打开开发者控制台）；2) explanation 文本与可视化同步；3) 控件（下一步/自动播放/重置）行为正常。
- 如果你要做较大的重构（拆分文件、引入构建），先与仓库维护者确认，因为当前架构刻意保持单文件零依赖以便教学用途。

请检查此文档是否覆盖你需要的场景或我遗漏的文件/约定；告诉我需要补充的具体示例或规则，我会迭代更新。
