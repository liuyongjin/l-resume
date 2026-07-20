import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src', 'pages', 'editor', '[id].vue');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. 在 script setup 中添加高亮状态
content = content.replace(
  `const newSkillCategory = ref('')`,
  `const newSkillCategory = ref('')
const highlightedSection = ref('')
let highlightTimer: ReturnType<typeof setTimeout> | null = null

function highlightSection(sectionId: string) {
  highlightedSection.value = sectionId
  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }
  highlightTimer = setTimeout(() => {
    highlightedSection.value = ''
  }, 3000)
}`
);

// 2. 修改 scrollToSection 函数，添加高亮功能
const oldScrollToSection = `function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  const panelContent = document.querySelector('.panel-content')
  if (element && panelContent) {
    const elementRect = element.getBoundingClientRect()
    const containerRect = panelContent.getBoundingClientRect()
    const scrollTop = panelContent.scrollTop + (elementRect.top - containerRect.top) - 20
    panelContent.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }
}`;

const newScrollToSection = `function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  const panelContent = document.querySelector('.panel-content')
  if (element && panelContent) {
    highlightSection(sectionId)
    const elementRect = element.getBoundingClientRect()
    const containerRect = panelContent.getBoundingClientRect()
    const scrollTop = panelContent.scrollTop + (elementRect.top - containerRect.top) - 20
    panelContent.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }
}`;

content = content.replace(oldScrollToSection, newScrollToSection);

// 3. 调整 quick-tags 的位置 - 移动到基本信息后面
const oldContentOrder = `        <div class="quick-tags">
          <button class="tag-btn" @click="goToAI">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            当前状态
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            性别
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            籍贯
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            主页链接
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M9 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            GitHub
          </button>
          <button class="tag-btn tag-btn-custom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
            + 自定义
          </button>
        </div>

        <div class="editor-section" id="basic-info">`;

const newContentOrder = `        <div class="editor-section" id="basic-info">`;

content = content.replace(oldContentOrder, newContentOrder);

// 在基本信息后面添加 quick-tags
const basicInfoEnd = `        </div>

        <div class="editor-section" id="professional-summary">`;

const quickTagsInsert = `        </div>

        <div class="quick-tags">
          <button class="tag-btn" @click="goToAI">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            当前状态
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            性别
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            籍贯
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            主页链接
          </button>
          <button class="tag-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M9 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            GitHub
          </button>
          <button class="tag-btn tag-btn-custom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
            + 自定义
          </button>
        </div>

        <div class="editor-section" id="professional-summary">`;

content = content.replace(basicInfoEnd, quickTagsInsert);

// 4. 给所有 editor-section 添加动态 class
content = content.replace(
  /<div class="editor-section" id="([^"]+)"/g,
  (match, id) => `<div class="editor-section" :class="{ 'editor-section-highlight': highlightedSection === '${id}' }" id="${id}"`
);

// 5. 添加高亮 CSS 样式
const styleTag = `    </style>`;

const highlightCss = `.editor-section-highlight {
  border: 3px solid #2563eb;
  border-radius: 12px;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  transition: all 0.3s ease;
}

.editor-section {
  position: relative;
}`;

content = content.replace(styleTag, highlightCss + styleTag);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('功能增强完成！');
