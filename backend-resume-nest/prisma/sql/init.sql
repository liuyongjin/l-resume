-- l-resume 数据库初始化数据 (PostgreSQL)
-- 表结构由 `npm run prisma:push` 或 `npm run prisma:init` 创建，统一 jf_ 前缀：
--   jf_user / jf_resume / jf_resume_template / jf_workflow / jf_workflow_node / jf_workflow_edge
--   jf_workflow_step（步骤日志）/ jf_workflow_run（运行记录，幂等键 user_id+idempotency_key）
--   jf_llm_model / jf_resume_ai_session / jf_resume_ai_message
-- 全节点覆盖工作流 v2 已移除；默认 v1 工作流见下方 INSERT
-- 种子数据由 `npm run prisma:seed` 写入
-- 字段描述 JSON 由 scripts/run-init.cjs 注入 jf_resume_template.data_schema / style_schema 列

-- ========== 用户表 ==========
INSERT INTO jf_user (id, username, phone, password, role, status, created_at, updated_at)
VALUES (1, 'TestUser', '12345678900', '$2a$10$xw.VqckXDo24LqsSlssOzuD8Xv6ir8ZvCZ6JTPIhgp/C8ZC5j2LtK', 'USER', 'active', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

INSERT INTO jf_user (username, password, role, status, created_at, updated_at)
VALUES ('admin', '$2a$10$3BTGYqEtK1gbYuCmgJ9cUexa/UazR/AJ91VrG3kRn053U7XHlHiMG', 'SUPER_ADMIN', 'active', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, password = EXCLUDED.password;

-- ========== 模板表（含完整 data / style，供前端预览） ==========
INSERT INTO jf_resume_template (id, name, description, preview_url, data, style, config, data_schema, style_schema, is_active, created_at, updated_at) VALUES
('1', '高级前端工程师', '专业的前端工程师简历模板，适合有丰富经验的前端开发者', '/templates/frontend-engineer.png', '{"basicInfo":{"name":"陈思远","avatar":"","showAvatar":true,"position":"高级前端工程师","phone":"13912345678","email":"chen.siyuan@example.com","city":"深圳","gender":"","age":"","workExperience":"","ethnicity":"","github":"https://github.com/chensiyuan-dev","homepage":"https://chensiyuan.dev","currentStatus":"","nativePlace":""},"professionalSummary":"7 年前端开发经验，专注 React、Vue 3 与 TypeScript 技术栈，具备中大型 Web 应用架构与性能优化能力，熟悉微前端、组件库与设计系统建设，注重代码质量与团队协作。","githubDesc":"维护开源 UI 组件库 vue-kit，累计 800+ Star","otherTags":["英语 CET-6","前端架构师认证","技术分享讲师"],"workExperience":[{"id":"1","company":"深圳星云互动科技","position":"高级前端工程师","startDate":"2021-08","endDate":"至今","description":["主导企业级 SaaS 控制台重构，页面加载速度提升 58%","搭建 Monorepo + Vite 工程体系，团队交付效率提升 40%","推动设计系统落地，组件复用率超过 70%"]},{"id":"2","company":"广州极客网络","position":"前端开发工程师","startDate":"2018-06","endDate":"2021-07","description":["负责电商中台可视化模块，支撑日均 50 万+ 订单数据处理","引入前端监控与错误追踪，线上故障定位时间缩短 50%"]}],"education":[{"id":"1","school":"华中科技大学","major":"软件工程","degree":"本科","startDate":"2014-09","endDate":"2018-06","description":"校级优秀毕业生，ACM 竞赛区域赛银奖"}],"projectExperience":[{"id":"1","name":"低代码表单引擎","role":"前端负责人","startDate":"2023-03","endDate":"2023-11","description":["基于 React + JSON Schema 构建可视化表单搭建平台，服务 300+ 业务场景"]},{"id":"2","name":"实时协作文档","role":"核心开发","startDate":"2020-01","endDate":"2020-08","description":["实现 OT 协同编辑与冲突合并，支持 200 人同时在线编辑"]}],"skills":[{"id":"s1","category":"前端框架","items":["React","Vue 3","TypeScript","Next.js"]},{"id":"s2","category":"工程化","items":["Vite","Webpack","Docker","CI/CD"]}],"certificates":[],"openSourceProject":[],"github":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.5,"fontFamily":"system-ui","margin":28,"layout":{"mainSection":["professionalSummary","education","projectExperience","workExperience","skills"],"sidebar":["certificates"]},"hiddenSections":["other"],"theme":"#2563EB"}'::jsonb, '{"primaryColor":"#2563EB","layout":"frontendEngineer","layoutPreset":"classic","themeKey":"frontendEngineer","components":["basicInfo","summary","education","projects","experience","skills","other"],"defaultHiddenSections":["other"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW()),
('2', '应届大学生', '深色顶栏 + 标签式分区，突出实习、项目与校园经历', '/templates/student.png', '{"basicInfo":{"name":"林悦宁","avatar":"","showAvatar":true,"position":"应届毕业生 · 信息管理与信息系统","phone":"13688881234","email":"lin.yuening@example.com","city":"杭州","gender":"","age":"","workExperience":"","ethnicity":"","github":"https://github.com/yuening-lin","homepage":"","currentStatus":"求职中","nativePlace":""},"professionalSummary":"信息管理与信息系统专业应届硕士，具备产品调研与用户访谈经验，熟悉需求文档撰写与原型设计。曾在互联网大厂完成产品实习，参与过校园创新项目并获省级奖项，沟通协作能力强，期望从事产品或运营方向工作。","workExperience":[{"id":"1","company":"网易有道","position":"产品实习生","startDate":"2024-07","endDate":"2024-12","description":["协助完成学习类 App 新功能需求调研，输出 8 份用户访谈纪要","参与 A/B 测试方案设计，协助跟踪核心转化指标并撰写周报","使用 Figma 绘制 20+ 页面原型，支持 2 个版本迭代上线"]},{"id":"2","company":"杭州某科技初创","position":"产品运营实习生","startDate":"2024-02","endDate":"2024-05","description":["负责社群内容策划与活动执行，单月新增活跃用户 1200+","整理用户反馈并建立需求池，推动 3 项体验优化落地"]}],"education":[{"id":"1","school":"浙江大学","major":"信息管理与信息系统","degree":"硕士","startDate":"2022-09","endDate":"2025-06","description":"GPA 3.8/4.0，获研究生学业奖学金；研究方向：数字化产品与用户行为分析"},{"id":"2","school":"浙江工业大学","major":"电子商务","degree":"本科","startDate":"2018-09","endDate":"2022-06","description":"校级优秀毕业生，互联网+创业大赛省赛银奖"}],"projectExperience":[{"id":"1","name":"校园课程互助平台","role":"产品负责人","startDate":"2023-10","endDate":"2024-04","description":["从 0 到 1 完成需求分析与 MVP 设计，覆盖 3000+ 注册用户","设计评价与匹配机制，课程互助成功率提升 35%","组织 4 轮可用性测试并迭代交互流程"]},{"id":"2","name":"本地生活服务小程序","role":"产品策划","startDate":"2023-03","endDate":"2023-08","description":["完成竞品分析与功能规划，输出 PRD 与原型 30+ 页","协调设计开发推进上线，首月 GMV 突破 8 万元"]}],"skills":[{"id":"s1","category":"产品方法","items":["用户访谈","竞品分析","PRD 撰写","原型设计"]},{"id":"s2","category":"数据与工具","items":["Excel","SQL 基础","Figma","Axure","Notion"]},{"id":"s3","category":"协作沟通","items":["跨部门推进","需求评审","项目复盘"]}],"certificates":[{"id":"c1","name":"CET-6","issuer":"教育部考试中心","date":"2023-12"},{"id":"c2","name":"PMP 学习证书","issuer":"PMI 授权机构","date":"2024-08"},{"id":"c3","name":"校级优秀研究生","issuer":"浙江大学","date":"2024-09"}],"campusActivity":[{"name":"产品经理训练营","role":"学员 / 组长","duration":"2023-09 - 2024-01","description":"完成 6 周训练营项目，小组方案获最佳用户价值奖"},{"name":"学生创新实践协会","role":"副主席","duration":"2021-09 - 2022-06","description":"组织 12 场创业分享与 3 场企业参访，覆盖 800+ 学生"},{"name":"辩论队","role":"主力队员","duration":"2019-2021","description":"获省赛团体季军，锻炼逻辑表达与临场应变能力"}],"openSourceProject":[],"github":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.55,"fontFamily":"PingFang SC, Microsoft YaHei, sans-serif","margin":28,"layout":{"mainSection":["professionalSummary","skills","workExperience","projectExperience","education","certificates","campusActivity"],"sidebar":[]},"theme":"#3B82F6"}'::jsonb, '{"primaryColor":"#3B82F6","layout":"freshGraduate","layoutPreset":"modern","themeKey":"modern","components":["basicInfo","skills","experience","projects","education","certificates","campusActivity","summary"],"defaultHiddenSections":["summary"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW()),
('3', '创意设计师', '富有创意的设计风格，适合设计师和创意工作者', '/templates/creative-design.png', '{"basicInfo":{"name":"林诗涵","avatar":"","showAvatar":true,"position":"UI/UX 设计师","phone":"13800138000","email":"林诗涵@example.com","city":"上海","gender":"","age":"","workExperience":"","ethnicity":"","github":"https://github.com/demo","homepage":"","currentStatus":"","nativePlace":""},"professionalSummary":"5 年互联网设计经验，擅长品牌视觉、交互设计与设计系统搭建，具备从 0 到 1 的产品设计能力，作品多次获得设计社区推荐。","workExperience":[{"id":"1","company":"小红书","position":"高级 UI 设计师","startDate":"2021-06","endDate":"至今","description":["负责创作者工具产品设计，DAU 提升 25%","搭建设计组件库，设计交付效率提升 50%"]}],"education":[{"id":"1","school":"中国美术学院","major":"视觉传达设计","degree":"本科","startDate":"2015-09","endDate":"2019-06","description":"优秀毕业生，作品入选校级毕业展"}],"projectExperience":[{"id":"1","name":"品牌视觉升级项目","role":"主设计师","startDate":"2023-01","endDate":"2023-04","description":["完成品牌 Logo、VI 系统及 App 界面改版，用户满意度提升 30%"]}],"skills":[{"id":"s1","category":"设计工具","items":["Figma","Sketch","Principle","AE"]},{"id":"s2","category":"设计能力","items":["UI/UX","品牌设计","设计系统"]}],"portfolio":[{"name":"电商 App 改版","type":"UI 设计","url":"https://behance.net/demo","description":"移动端购物体验优化，转化率提升 18%"},{"name":"SaaS 仪表盘","type":"交互设计","description":"B 端数据可视化界面，获 Dribbble 首页推荐"}],"certificates":[],"openSourceProject":[],"github":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.5,"fontFamily":"system-ui","margin":28,"layout":{"mainSection":["professionalSummary","workExperience","projectExperience","education"],"sidebar":["skills","certificates"]},"theme":"#EC4899"}'::jsonb, '{"primaryColor":"#EC4899","layout":"composer","layoutPreset":"creative","themeKey":"creative","components":["basicInfo","summary","experience","education","skills","projects","portfolio"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW()),
('4', '数据分析师', '专业的数据分析师简历模板，突出数据分析技能和量化成果', '/templates/data-analyst.png', '{"basicInfo":{"name":"王Analytics","avatar":"","showAvatar":true,"position":"高级数据分析师","phone":"13800138000","email":"王analytics@example.com","city":"深圳","gender":"","age":"","workExperience":"","ethnicity":"","github":"https://github.com/demo","homepage":"","currentStatus":"","nativePlace":""},"professionalSummary":"6 年数据分析经验，精通 SQL、Python 与数据可视化，擅长 A/B 测试与用户行为分析，多次通过数据驱动决策带来显著业务增长。","workExperience":[{"id":"1","company":"腾讯","position":"高级数据分析师","startDate":"2020-03","endDate":"至今","description":["负责社交产品核心指标监控与归因分析，支撑产品迭代决策","搭建自动化报表体系，节省团队 60% 取数时间"]}],"education":[{"id":"1","school":"中山大学","major":"统计学","degree":"硕士","startDate":"2017-09","endDate":"2020-06","description":"研究方向：机器学习与商业智能"}],"projectExperience":[{"id":"1","name":"用户留存分析项目","role":"分析负责人","startDate":"2023-06","endDate":"2023-09","description":["通过 cohort 分析定位流失节点，制定策略使 30 日留存提升 12%"]}],"skills":[{"id":"s1","category":"分析工具","items":["SQL","Python","R","Tableau"]},{"id":"s2","category":"方法论","items":["A/B 测试","用户画像","漏斗分析"]}],"dataProjects":[{"name":"推荐算法效果评估","role":"数据分析师","duration":"2023-01 - 2023-03","description":"设计评估框架，对比 3 种推荐策略，CTR 提升 8.5%","metrics":"CTR +8.5%，人均时长 +15%","tools":"Python, Spark, Hive"}],"certificates":[{"id":"c1","name":"Google Data Analytics","issuer":"Google","date":"2022-08"}],"openSourceProject":[],"github":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.5,"fontFamily":"system-ui","margin":28,"layout":{"mainSection":["professionalSummary","workExperience","projectExperience","education"],"sidebar":["skills","certificates"]},"theme":"#10B981"}'::jsonb, '{"primaryColor":"#10B981","layout":"composer","layoutPreset":"data","themeKey":"data","components":["basicInfo","summary","experience","education","skills","projects","dataProjects","certificates"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW()),
('5', '产品经理', '深色侧栏双栏布局，突出产品规划、项目推进与业务成果', '/templates/product-manager.png', '{"basicInfo":{"name":"周明轩","avatar":"","showAvatar":true,"position":"高级产品经理","phone":"13766668888","email":"zhou.mingxuan@example.com","city":"上海","gender":"","age":"","workExperience":"6年","ethnicity":"","github":"","homepage":"","currentStatus":"在职","nativePlace":""},"professionalSummary":"6 年 ToB / ToC 产品经验，擅长从 0 到 1 搭建业务中台与增长型产品。具备完整的需求洞察、方案设计与跨团队推进能力，习惯以数据验证假设，多次主导核心指标显著提升。","workExperience":[{"id":"1","company":"得物","position":"高级产品经理","startDate":"2021-03","endDate":"至今","description":["负责商家运营工具产品线，覆盖 2 万+ 商家，核心功能月活提升 38%","主导需求优先级机制与版本节奏管理，协调设计、研发、运营 25 人团队","搭建商家数据看板，帮助运营决策效率提升 50%"]},{"id":"2","company":"拼多多","position":"产品经理","startDate":"2018-07","endDate":"2021-02","description":["参与推荐场景策略优化，人均浏览时长提升 12%","负责活动配置后台迭代，支持 30+ 营销玩法快速上线","输出 40+ 份 PRD，推动 3 个核心模块重构"]}],"education":[{"id":"1","school":"同济大学","major":"管理科学与工程","degree":"本科","startDate":"2014-09","endDate":"2018-06","description":"GPA 3.6/4.0，获校级优秀毕业论文；辅修数据分析基础课程"}],"projectExperience":[{"id":"1","name":"智能选品助手","role":"产品负责人","startDate":"2023-05","endDate":"2023-11","description":["基于用户行为与库存数据设计选品模型，帮助商家上新效率提升 45%","完成 12 轮用户访谈与 3 次可用性测试，迭代 4 个版本","项目上线 3 个月内覆盖 8000+ 商家"]},{"id":"2","name":"会员增长体系升级","role":"核心产品","startDate":"2022-01","endDate":"2022-09","description":["重构会员等级与权益体系，付费转化率提升 18%","设计任务激励与触达策略，30 日留存提升 9 个百分点"]}],"skills":[{"id":"s1","category":"产品规划","items":["市场分析","Roadmap","竞品研究","商业模式"]},{"id":"s2","category":"需求与设计","items":["用户访谈","PRD","原型设计","A/B 测试"]},{"id":"s3","category":"数据与工具","items":["SQL","Excel","Figma","Axure","Jira"]}],"productAchievements":[{"name":"商家任务中心","role":"产品负责人","duration":"2023-08 - 2024-02","description":"设计任务激励体系，提升商家活跃与工具使用深度","metrics":"商家周活 +32%，工具渗透率 +21%"},{"name":"新商 onboarding 优化","role":"主导产品","duration":"2022-10 - 2023-03","description":"简化入驻与首单流程，缩短新商家冷启动周期","metrics":"首单转化率 +26%，7 日留存 +14%"}],"certificates":[],"openSourceProject":[],"github":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.55,"fontFamily":"PingFang SC, Microsoft YaHei, sans-serif","margin":28,"layout":{"mainSection":["professionalSummary","skills","workExperience","projectExperience","productAchievements"],"sidebar":["education"]},"theme":"#F59E0B"}'::jsonb, '{"primaryColor":"#F59E0B","layout":"productManager","layoutPreset":"modern","themeKey":"amber","components":["basicInfo","summary","skills","experience","projects","productAchievements","education"],"defaultHiddenSections":["summary"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW()),
('6', '学术研究者', '适合科研岗位，突出研究成果和学术背景', '/templates/academic.png', '{"basicInfo":{"name":"李Research","avatar":"","showAvatar":true,"position":"助理研究员","phone":"13800138000","email":"李research@example.com","city":"南京","gender":"","age":"","workExperience":"","ethnicity":"","github":"https://github.com/demo","homepage":"","currentStatus":"","nativePlace":""},"professionalSummary":"计算机科学博士，研究方向为自然语言处理与知识图谱，在 ACL、EMNLP 等顶会发表论文 5 篇，具备独立科研与项目申请能力。","workExperience":[{"id":"1","company":"南京大学","position":"助理研究员","startDate":"2022-09","endDate":"至今","description":["主持 NLP 方向科研项目，指导 3 名硕士研究生","参与国家重点研发计划子课题"]}],"education":[{"id":"1","school":"南京大学","major":"计算机科学与技术","degree":"博士","startDate":"2017-09","endDate":"2022-06","description":"导师：某某教授，研究方向：自然语言处理"}],"projectExperience":[{"id":"1","name":"知识图谱构建项目","role":"核心成员","startDate":"2020-01","endDate":"2021-12","description":["构建领域知识图谱，实体数 100 万+，支撑智能问答系统"]}],"skills":[{"id":"s1","category":"研究方向","items":["NLP","知识图谱","机器学习"]},{"id":"s2","category":"工具","items":["Python","PyTorch","LaTeX"]}],"publications":[{"title":"Graph-enhanced Pre-training for Knowledge Graph Completion","journal":"ACL 2023","year":"2023","citations":"42","doi":"10.18653/v1/2023.acl-long.123"},{"title":"A Survey on Knowledge Graph Embedding","journal":"EMNLP 2022","year":"2022","citations":"128"}],"certificates":[],"openSourceProject":[],"github":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.5,"fontFamily":"system-ui","margin":28,"layout":{"mainSection":["professionalSummary","workExperience","projectExperience","education"],"sidebar":["skills","certificates"]},"theme":"#8B5CF6"}'::jsonb, '{"primaryColor":"#8B5CF6","layout":"composer","layoutPreset":"classic","themeKey":"purple","components":["basicInfo","summary","experience","education","skills","projects","publications"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW()),
('7', '程序开发', '清新简雅的双栏开发者简历，侧栏呈现技能与教育，主栏展示经历与项目', '/templates/developer.png', '{"basicInfo":{"name":"林知远","avatar":"","showAvatar":true,"position":"全栈工程师","phone":"13800138000","email":"linzhiyuan@example.com","city":"杭州","gender":"","age":"","workExperience":"5年","ethnicity":"","github":"https://github.com/linzhiyuan-dev","homepage":"https://linzhiyuan.dev","currentStatus":"在职","nativePlace":""},"professionalSummary":"5 年全栈开发经验，专注 TypeScript / Node.js 与云原生架构。擅长将复杂业务拆解为清晰模块，重视代码可读性与交付效率，在团队协作与工程规范建设方面有丰富实践。","workExperience":[{"id":"1","company":"清言科技","position":"高级全栈工程师","startDate":"2021-06","endDate":"至今","description":["主导 SaaS 控制台前后端重构，首屏加载时间降低 52%","设计 REST + GraphQL 混合 API 层，接口开发效率提升 35%","搭建 GitHub Actions 流水线，发布周期从周级缩短至日级"]},{"id":"2","company":"云栈网络","position":"软件工程师","startDate":"2019-07","endDate":"2021-05","description":["负责订单与用户中心模块，支撑日均 300 万+ 请求","引入 Redis 缓存与读写分离，核心接口 P99 降低 45%"]}],"education":[{"id":"1","school":"浙江大学","major":"软件工程","degree":"本科","startDate":"2015-09","endDate":"2019-06","description":"GPA 3.7/4.0，ACM 校队成员"}],"projectExperience":[{"id":"1","name":"低代码表单引擎","role":"技术负责人","startDate":"2023-03","endDate":"2023-10","description":["基于 Vue 3 + NestJS 构建可视化表单搭建平台","支持 JSON Schema 驱动渲染，覆盖 120+ 业务场景","沉淀可复用组件库，表单开发效率提升 60%"]},{"id":"2","name":"实时协作白板","role":"核心开发","startDate":"2022-01","endDate":"2022-08","description":["WebSocket + CRDT 实现多人协同编辑","支持 150 人同时在线，冲突合并成功率 99.9%"]}],"skills":[{"id":"s1","category":"语言","items":["TypeScript","JavaScript","Python","Go"]},{"id":"s2","category":"框架","items":["Vue 3","React","NestJS","Express"]},{"id":"s3","category":"工具","items":["Docker","PostgreSQL","Redis","GitHub Actions"]}],"openSourceProject":[{"id":"1","name":"vite-plugin-kit","url":"https://github.com/linzhiyuan-dev/vite-plugin-kit","stars":"820","description":"Vite 插件合集，简化多环境配置与构建优化","role":"作者"},{"id":"2","name":"vue-composable-utils","url":"https://github.com/linzhiyuan-dev/vue-composable-utils","stars":"540","description":"Vue 3 Composition API 工具库，涵盖请求、缓存与表单","role":"维护者"}],"github":[],"certificates":[]}'::jsonb, '{"fontSize":14,"lineHeight":1.55,"fontFamily":"PingFang SC, Microsoft YaHei, sans-serif","margin":28,"layout":{"mainSection":["professionalSummary","workExperience","projectExperience"],"sidebar":["skills","education","openSourceProject"]},"theme":"#4A9B8E","hiddenSections":[]}'::jsonb, '{"primaryColor":"#4A9B8E","layout":"developer","layoutPreset":"developer","themeKey":"developer","components":["basicInfo","summary","experience","education","skills","projects","openSource"]}'::jsonb, $data_schema$@@DATA_SCHEMA@@$data_schema$::jsonb, $style_schema$@@STYLE_SCHEMA@@$style_schema$::jsonb, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  preview_url = EXCLUDED.preview_url,
  data = EXCLUDED.data,
  style = EXCLUDED.style,
  config = EXCLUDED.config,
  data_schema = EXCLUDED.data_schema,
  style_schema = EXCLUDED.style_schema,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ========== 工作流表（版本化：图结构存 jf_workflow_node / jf_workflow_edge） ==========
INSERT INTO jf_workflow (
  user_id,
  version,
  name,
  description,
  is_default,
  is_active,
  published_at,
  created_at,
  updated_at
) VALUES (
  1,
  1,
  '简历优化工作流',
  '输入 → 简历编辑智能体 → 简历优化智能体 → 输出',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (user_id, version) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_default = EXCLUDED.is_default,
  is_active = EXCLUDED.is_active,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- ========== 大模型列表由 scripts/run-init.cjs 根据 config/llm-models.json 写入 ==========

-- ========== 工作流节点表（结构化存储节点配置） ==========
INSERT INTO jf_workflow_node (
  workflow_id, node_id, template_id, type, agent_type, category, name, description,
  position_x, position_y, config_tabs, config, sort_order,
  created_at, updated_at
)
SELECT
  w.id, v.node_id, v.template_id, v.type, v.agent_type, v.category, v.name, v.description,
  v.position_x, v.position_y, v.config_tabs::jsonb, v.config::jsonb, v.sort_order,
  NOW(), NOW()
FROM jf_workflow w
CROSS JOIN (VALUES
  ('workflow-input', NULL, 'input', NULL, 'io', '输入', '接收简历与运行配置', 464, 690, '[]', '{}', 0),
  ('edit', 'edit', 'editor', 'writer', 'agent', '简历编辑智能体', '润色结构与模板适配', 752, 690,
   '["config","prompt","memory","advanced"]',
   '{"model":"glm-4.7-flash","temperature":0.3,"topP":0.9,"maxTokens":2048,"outputFormat":"json","maxRetries":2,"memoryTurns":10,"systemPrompt":"你是简历编辑专家，根据所选模板调整结构与表述，确保内容完整、格式规范。"}',
   1),
  ('optimize', 'optimize', 'optimizer', 'optimizer', 'agent', '简历优化智能体', '优化表达与岗位匹配度', 1040, 690,
   '["config","prompt","memory","advanced"]',
   '{"model":"glm-4.7-flash","temperature":0.4,"topP":0.9,"maxTokens":2048,"outputFormat":"json","maxRetries":2,"memoryTurns":10,"systemPrompt":"你是简历优化专家，突出量化成果和岗位关键词匹配。"}',
   2),
  ('workflow-output', NULL, 'output', NULL, 'io', '输出', '输出最终简历结果', 1328, 690, '[]', '{}', 3)
) AS v(node_id, template_id, type, agent_type, category, name, description, position_x, position_y, config_tabs, config, sort_order)
WHERE w.user_id = 1 AND w.version = 1
ON CONFLICT (workflow_id, node_id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  type = EXCLUDED.type,
  agent_type = EXCLUDED.agent_type,
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  position_x = EXCLUDED.position_x,
  position_y = EXCLUDED.position_y,
  config_tabs = EXCLUDED.config_tabs,
  config = EXCLUDED.config,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO jf_workflow_edge (
  workflow_id, connection_id, from_node_id, to_node_id, from_port, to_port, sort_order,
  created_at, updated_at
)
SELECT w.id, v.connection_id, v.from_node_id, v.to_node_id, v.from_port, v.to_port, v.sort_order, NOW(), NOW()
FROM jf_workflow w
CROSS JOIN (VALUES
  ('c-input', 'workflow-input', 'edit', NULL, NULL, 0),
  ('c1', 'edit', 'optimize', NULL, NULL, 1),
  ('c-output', 'optimize', 'workflow-output', NULL, NULL, 2)
) AS v(connection_id, from_node_id, to_node_id, from_port, to_port, sort_order)
WHERE w.user_id = 1 AND w.version = 1
ON CONFLICT (workflow_id, connection_id) DO UPDATE SET
  from_node_id = EXCLUDED.from_node_id,
  to_node_id = EXCLUDED.to_node_id,
  from_port = EXCLUDED.from_port,
  to_port = EXCLUDED.to_port,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ========== 同步已有简历的主题色（应届大学生 / 产品经理） ==========
UPDATE jf_resume
SET style = jsonb_set(COALESCE(style, '{}'::jsonb), '{theme}', '"#3B82F6"', true),
    updated_at = NOW()
WHERE template_id IN ('2', 'modern');

UPDATE jf_resume
SET style = jsonb_set(COALESCE(style, '{}'::jsonb), '{theme}', '"#F59E0B"', true),
    updated_at = NOW()
WHERE template_id IN ('5', 'amber');

-- ========== 序列 ==========
SELECT setval('jf_user_id_seq', COALESCE((SELECT MAX(id) FROM jf_user), 1));
SELECT setval('jf_resume_id_seq', COALESCE((SELECT MAX(id) FROM jf_resume), 1));
SELECT setval('jf_workflow_step_id_seq', COALESCE((SELECT MAX(id) FROM jf_workflow_step), 1));
SELECT setval('jf_workflow_id_seq', COALESCE((SELECT MAX(id) FROM jf_workflow), 1));
SELECT setval('jf_workflow_node_id_seq', COALESCE((SELECT MAX(id) FROM jf_workflow_node), 1));
SELECT setval('jf_workflow_edge_id_seq', COALESCE((SELECT MAX(id) FROM jf_workflow_edge), 1));

SELECT '数据库初始化完成' AS result;
