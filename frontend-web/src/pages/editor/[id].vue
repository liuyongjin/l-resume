<template>
  <div class="editor-page flex flex-1 flex-col min-h-0 overflow-hidden">
    <!-- 顶部工具栏 -->
    <header class="page-toolbar h-14 shrink-0">
      <div class="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" class="size-9 shrink-0" @click="goBack">
          <AppIcon :icon="ArrowLeft" size="lg" />
        </Button>
        <div class="min-w-0">
          <h1 class="text-base font-semibold text-foreground truncate">{{ resumeTitle }}</h1>
          <p class="text-xs mt-0.5" :class="isDirty ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
            {{ isDirty ? '有未保存的修改，请点击「保存」' : `已保存 ${lastSaved}` }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="hidden sm:inline-flex btn-icon-gap" @click="previewResume">
          <AppIcon :icon="Eye" size="sm" />
          预览
        </Button>
        <Button variant="ghost" size="sm" class="btn-icon-gap" @click="saveResume" :disabled="saving">
          <AppIcon :icon="Save" size="sm" />
          保存
        </Button>
        <div ref="exportMenuRef" class="relative">
          <Button size="sm" class="btn-icon-gap" :disabled="exporting || pageLoading" @click="exportMenuOpen = !exportMenuOpen">
            <AppIcon :icon="Download" size="sm" />
            {{ exporting ? '导出中...' : '导出' }}
            <AppIcon :icon="ChevronDown" size="xs" class="opacity-70" />
          </Button>
          <div
            v-if="exportMenuOpen"
            class="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[9.5rem] rounded-lg border border-border bg-popover p-1 shadow-lg"
          >
            <button
              v-for="item in exportOptions"
              :key="item.format"
              type="button"
              class="flex w-full items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              :disabled="exporting"
              @click="handleExport(item.format)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <LoadingState v-if="pageLoading" class="flex-1 min-h-[20rem]" text="加载简历编辑器..." />

    <div v-else ref="splitContainer" class="flex flex-1 min-h-0 overflow-hidden">
      <!-- 左侧编辑区（默认较窄，右侧优先展示完整 A4） -->
      <div
        class="editor-split-left flex flex-col min-h-0 min-w-0 bg-card shrink-0 w-full overflow-hidden max-lg:!w-full max-lg:!max-w-none max-lg:flex-1 lg:flex-none"
        :class="{ 'editor-split-left--pending': !splitReady }"
        :style="splitReady ? splitStyle : undefined"
      >
        <!-- 编辑模式 Tabs -->
        <div class="flex border-b border-border px-4 shrink-0">
          <button
            v-for="tab in editTabs"
            :key="tab.key"
            @click="activeEditTab = tab.key"
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeEditTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="editor-tab-body">
        <div v-if="activeEditTab === 'manual'" class="editor-manual-layout flex flex-1 min-h-0 min-w-0 overflow-hidden">
          <!-- 区块导航：固定全高，右侧分割线延伸至底部 -->
          <EditorSectionNav
            :sections="orderedSections"
            v-model:active-section="activeSection"
            :hidden-sections="styleSettings.hiddenSections"
            :is-section-visible="isEditorSectionVisible"
            @reorder="handleSectionReorder"
            @scroll="onEditorPaneScroll"
          />

          <!-- 表单区（独立滚动） -->
          <div
            class="editor-pane-scroll flex-1 min-h-0 min-w-0"
            @scroll="onEditorPaneScroll"
          >
          <div class="editor-form-panel page-form-stack">
              <!-- 个人信息 -->
              <template v-if="activeSection === 'basicInfo'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">个人信息</h3>
                    <p class="editor-form-hint">填写后将同步到右侧预览</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      :visible="isEditorSectionVisible('basicInfo', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('basicInfo', $event)"
                    />
                  </div>
                </div>
                <div class="editor-form-grid">
                  <div class="editor-form-field">
                    <Label>姓名</Label>
                    <Input v-model="formData.basicInfo.name" placeholder="请输入姓名" />
                  </div>
                  <div class="editor-form-field">
                    <Label>职业/职位</Label>
                    <Input v-model="formData.basicInfo.position" placeholder="例如：产品经理" />
                  </div>
                  <div class="editor-form-field">
                    <Label>手机号码</Label>
                    <Input v-model="formData.basicInfo.phone" placeholder="138-xxxx-xxxx" />
                  </div>
                  <div class="editor-form-field">
                    <Label>电子邮箱</Label>
                    <Input v-model="formData.basicInfo.email" placeholder="email@example.com" />
                  </div>
                  <div class="editor-form-field">
                    <Label>所在城市</Label>
                    <Input v-model="formData.basicInfo.city" placeholder="例如：上海" />
                  </div>
                  <div class="editor-form-field">
                    <Label>头像</Label>
                    <EditorAvatarUpload v-model="formData.basicInfo.avatar" />
                  </div>
                  <div class="editor-form-field flex items-center gap-3 pt-1">
                    <input
                      id="showAvatar"
                      v-model="formData.basicInfo.showAvatar"
                      type="checkbox"
                      class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <Label for="showAvatar" class="cursor-pointer font-normal">在简历中显示头像</Label>
                  </div>
                  <div class="editor-form-field">
                    <Label>个人简介</Label>
                    <Textarea v-model="formData.professionalSummary" :rows="5" placeholder="简要介绍您的职业背景和核心优势..." class="w-full resize-y min-h-[7rem]" />
                  </div>
                </div>
              </template>

              <!-- 工作经历 -->
              <template v-if="activeSection === 'workExperience'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">工作经历</h3>
                    <p class="editor-form-hint">拖动条目左侧手柄可调整顺序</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('workExperience', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('workExperience', $event)"
                      @add="addWorkExperience"
                    />
                  </div>
                </div>
                <EditorDraggableList v-model="formData.workExperience" item-label="经历">
                  <template #default="{ item: exp, index: idx }">
                    <div class="editor-form-grid editor-form-grid--2">
                      <div class="editor-form-field editor-form-field--full">
                        <Label>公司名称</Label>
                        <Input v-model="exp.company" placeholder="公司名称" />
                      </div>
                      <div class="editor-form-field editor-form-field--full">
                        <Label>职位</Label>
                        <Input v-model="exp.position" placeholder="职位名称" />
                      </div>
                      <div class="editor-form-field">
                        <Label>开始时间</Label>
                        <Input v-model="exp.startDate" placeholder="2020-01" />
                      </div>
                      <div class="editor-form-field">
                        <Label>结束时间</Label>
                        <Input v-model="exp.endDate" placeholder="至今" />
                      </div>
                      <div class="editor-form-field editor-form-field--full">
                        <Label>工作描述</Label>
                        <Textarea :model-value="exp.description.join('\n')" @update:model-value="(v: string) => exp.description = v.split('\n').filter(Boolean)" :rows="4" placeholder="每行一条职责描述" class="w-full resize-y min-h-[6rem]" />
                      </div>
                    </div>
                    <div class="editor-form-actions">
                      <Button variant="ghost" size="sm" class="text-destructive" @click="removeWorkExperience(idx)">删除</Button>
                    </div>
                  </template>
                </EditorDraggableList>
              </template>

              <!-- 教育背景 -->
              <template v-if="activeSection === 'education'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">教育背景</h3>
                    <p class="editor-form-hint">拖动条目左侧手柄可调整顺序</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('education', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('education', $event)"
                      @add="addEducation"
                    />
                  </div>
                </div>
                <EditorDraggableList v-model="formData.education" item-label="教育">
                  <template #default="{ item: edu, index: idx }">
                    <div class="editor-form-grid editor-form-grid--2">
                      <div class="editor-form-field editor-form-field--full">
                        <Label>学校</Label>
                        <Input v-model="edu.school" placeholder="学校名称" />
                      </div>
                      <div class="editor-form-field">
                        <Label>专业</Label>
                        <Input v-model="edu.major" placeholder="专业" />
                      </div>
                      <div class="editor-form-field">
                        <Label>学历</Label>
                        <Input v-model="edu.degree" placeholder="本科/硕士" />
                      </div>
                      <div class="editor-form-field">
                        <Label>开始时间</Label>
                        <Input v-model="edu.startDate" placeholder="2018-09" />
                      </div>
                      <div class="editor-form-field">
                        <Label>结束时间</Label>
                        <Input v-model="edu.endDate" placeholder="2022-06" />
                      </div>
                    </div>
                    <div class="editor-form-actions">
                      <Button variant="ghost" size="sm" class="text-destructive" @click="removeEducation(idx)">删除</Button>
                    </div>
                  </template>
                </EditorDraggableList>
              </template>

              <!-- 项目经历 -->
              <template v-if="activeSection === 'projectExperience'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">项目经历</h3>
                    <p class="editor-form-hint">拖动条目左侧手柄可调整顺序</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('projectExperience', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('projectExperience', $event)"
                      @add="addProject"
                    />
                  </div>
                </div>
                <EditorDraggableList v-model="formData.projectExperience" item-label="项目">
                  <template #default="{ item: proj, index: idx }">
                    <div class="editor-form-grid editor-form-grid--2">
                      <div class="editor-form-field editor-form-field--full">
                        <Label>项目名称</Label>
                        <Input v-model="proj.name" placeholder="项目名称" />
                      </div>
                      <div class="editor-form-field editor-form-field--full">
                        <Label>担任角色</Label>
                        <Input v-model="proj.role" placeholder="负责人 / 前端开发" />
                      </div>
                      <div class="editor-form-field editor-form-field--full">
                        <Label>项目描述</Label>
                        <Textarea :model-value="proj.description.join('\n')" @update:model-value="(v: string) => proj.description = v.split('\n').filter(Boolean)" :rows="4" placeholder="每行一条项目亮点" class="w-full resize-y min-h-[6rem]" />
                      </div>
                    </div>
                    <div class="editor-form-actions">
                      <Button variant="ghost" size="sm" class="text-destructive" @click="removeProject(idx)">删除</Button>
                    </div>
                  </template>
                </EditorDraggableList>
              </template>

              <!-- 技能证书 -->
              <template v-if="activeSection === 'skills'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">专业技能</h3>
                    <p class="editor-form-hint">多个技能用顿号分隔，可拖动排序</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      add-label="添加技能分类"
                      :visible="isEditorSectionVisible('skills', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('skills', $event)"
                      @add="addSkill"
                    />
                  </div>
                </div>
                <EditorDraggableList v-model="formData.skills" item-label="技能">
                  <template #default="{ item: skill, index: idx }">
                    <div class="editor-form-field">
                      <Label>分类名称</Label>
                      <Input v-model="skill.category" placeholder="例如：专业技能" />
                    </div>
                    <div class="editor-form-field">
                      <Label>技能项</Label>
                      <Input
                        :model-value="skill.items.join('、')"
                        @update:model-value="(v: string) => skill.items = v.split(/[、,，]/).map(s => s.trim()).filter(Boolean)"
                        placeholder="产品设计、Axure、SQL（用顿号分隔）"
                      />
                    </div>
                    <div class="editor-form-actions">
                      <Button variant="ghost" size="sm" class="text-destructive" @click="removeSkill(idx)">删除</Button>
                    </div>
                  </template>
                </EditorDraggableList>
              </template>

              <!-- 自我评价 -->
              <template v-if="activeSection === 'summary'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">自我评价</h3>
                    <p class="editor-form-hint">突出核心能力与职业目标</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      :visible="isEditorSectionVisible('summary', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('summary', $event)"
                    />
                  </div>
                </div>
                <div class="editor-form-field">
                  <Textarea v-model="formData.professionalSummary" :rows="8" placeholder="描述您的职业特点、核心能力和职业目标..." class="w-full resize-y min-h-[10rem]" />
                </div>
              </template>

              <!-- 证书 -->
              <template v-if="activeSection === 'certificates'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">证书/资格</h3>
                    <p class="editor-form-hint">拖动条目左侧手柄可调整顺序</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('certificates', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('certificates', $event)"
                      @add="addCertificate"
                    />
                  </div>
                </div>
                <EditorDraggableList v-model="formData.certificates" item-label="证书">
                  <template #default="{ item: cert, index: idx }">
                    <div class="editor-form-grid editor-form-grid--2">
                      <div class="editor-form-field editor-form-field--full">
                        <Label>证书名称</Label>
                        <Input v-model="cert.name" placeholder="如：CET-6" />
                      </div>
                      <div class="editor-form-field">
                        <Label>颁发机构</Label>
                        <Input v-model="cert.issuer" placeholder="颁发单位" />
                      </div>
                      <div class="editor-form-field">
                        <Label>获得时间</Label>
                        <Input v-model="cert.date" placeholder="2024-06" />
                      </div>
                    </div>
                    <div class="editor-form-actions">
                      <Button variant="ghost" size="sm" class="text-destructive" @click="removeCertificate(idx)">删除</Button>
                    </div>
                  </template>
                </EditorDraggableList>
              </template>

              <!-- 校园活动 -->
              <template v-if="activeSection === 'campusActivity'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">校园活动</h3>
                    <p class="editor-form-hint">记录社团、竞赛等校园经历</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('campusActivity', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('campusActivity', $event)"
                      @add="addCampusActivity"
                    />
                  </div>
                </div>
                <div class="editor-draggable-list">
                  <div v-for="(act, idx) in formData.campusActivity" :key="idx" class="editor-form-card">
                    <div class="editor-form-card__toolbar">
                      <span class="text-xs text-muted-foreground">活动 {{ idx + 1 }}</span>
                    </div>
                    <div class="editor-form-card__body">
                      <div class="editor-form-grid editor-form-grid--2">
                        <div class="editor-form-field editor-form-field--full">
                          <Label>活动/组织</Label>
                          <Input v-model="act.name" placeholder="学生会 / 创业大赛" />
                        </div>
                        <div class="editor-form-field">
                          <Label>担任角色</Label>
                          <Input v-model="act.role" placeholder="部长 / 队长" />
                        </div>
                        <div class="editor-form-field">
                          <Label>时间</Label>
                          <Input v-model="act.duration" placeholder="2022-2023" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>描述</Label>
                          <Textarea v-model="act.description" :rows="3" class="w-full resize-y" />
                        </div>
                      </div>
                      <div class="editor-form-actions">
                        <Button variant="ghost" size="sm" class="text-destructive" @click="removeCampusActivity(idx)">删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 作品集 -->
              <template v-if="activeSection === 'portfolio'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">作品集</h3>
                    <p class="editor-form-hint">展示设计或项目作品链接</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('portfolio', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('portfolio', $event)"
                      @add="addPortfolio"
                    />
                  </div>
                </div>
                <div class="editor-draggable-list">
                  <div v-for="(item, idx) in formData.portfolio" :key="idx" class="editor-form-card">
                    <div class="editor-form-card__toolbar">
                      <span class="text-xs text-muted-foreground">作品 {{ idx + 1 }}</span>
                    </div>
                    <div class="editor-form-card__body">
                      <div class="editor-form-grid editor-form-grid--2">
                        <div class="editor-form-field editor-form-field--full">
                          <Label>作品名称</Label>
                          <Input v-model="item.name" />
                        </div>
                        <div class="editor-form-field">
                          <Label>类型</Label>
                          <Input v-model="item.type" placeholder="UI设计" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>链接</Label>
                          <Input v-model="item.url" placeholder="https://..." />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>描述</Label>
                          <Textarea v-model="item.description" :rows="3" class="w-full resize-y" />
                        </div>
                      </div>
                      <div class="editor-form-actions">
                        <Button variant="ghost" size="sm" class="text-destructive" @click="removePortfolio(idx)">删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 数据项目 -->
              <template v-if="activeSection === 'dataProjects'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">数据项目</h3>
                    <p class="editor-form-hint">记录数据分析相关项目</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('dataProjects', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('dataProjects', $event)"
                      @add="addDataProject"
                    />
                  </div>
                </div>
                <div class="editor-draggable-list">
                  <div v-for="(proj, idx) in formData.dataProjects" :key="idx" class="editor-form-card">
                    <div class="editor-form-card__toolbar">
                      <span class="text-xs text-muted-foreground">项目 {{ idx + 1 }}</span>
                    </div>
                    <div class="editor-form-card__body">
                      <div class="editor-form-grid editor-form-grid--2">
                        <div class="editor-form-field editor-form-field--full">
                          <Label>项目名称</Label>
                          <Input v-model="proj.name" />
                        </div>
                        <div class="editor-form-field">
                          <Label>角色</Label>
                          <Input v-model="proj.role" />
                        </div>
                        <div class="editor-form-field">
                          <Label>时间</Label>
                          <Input v-model="proj.duration" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>描述</Label>
                          <Textarea v-model="proj.description" :rows="3" class="w-full resize-y" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>关键指标</Label>
                          <Input v-model="proj.metrics" placeholder="转化率提升 15%" />
                        </div>
                      </div>
                      <div class="editor-form-actions">
                        <Button variant="ghost" size="sm" class="text-destructive" @click="removeDataProject(idx)">删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 产品成果 -->
              <template v-if="activeSection === 'productAchievements'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">产品成果</h3>
                    <p class="editor-form-hint">记录产品上线与业务成果</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('productAchievements', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('productAchievements', $event)"
                      @add="addProductAchievement"
                    />
                  </div>
                </div>
                <div class="editor-draggable-list">
                  <div v-for="(item, idx) in formData.productAchievements" :key="idx" class="editor-form-card">
                    <div class="editor-form-card__toolbar">
                      <span class="text-xs text-muted-foreground">成果 {{ idx + 1 }}</span>
                    </div>
                    <div class="editor-form-card__body">
                      <div class="editor-form-grid editor-form-grid--2">
                        <div class="editor-form-field editor-form-field--full">
                          <Label>产品名称</Label>
                          <Input v-model="item.name" />
                        </div>
                        <div class="editor-form-field">
                          <Label>担任角色</Label>
                          <Input v-model="item.role" />
                        </div>
                        <div class="editor-form-field">
                          <Label>时间</Label>
                          <Input v-model="item.duration" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>描述</Label>
                          <Textarea v-model="item.description" :rows="3" class="w-full resize-y" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>核心指标</Label>
                          <Textarea v-model="item.metrics" :rows="2" class="w-full resize-y" />
                        </div>
                      </div>
                      <div class="editor-form-actions">
                        <Button variant="ghost" size="sm" class="text-destructive" @click="removeProductAchievement(idx)">删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 论文发表 -->
              <template v-if="activeSection === 'publications'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">论文发表</h3>
                    <p class="editor-form-hint">记录学术论文与发表信息</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('publications', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('publications', $event)"
                      @add="addPublication"
                    />
                  </div>
                </div>
                <div class="editor-draggable-list">
                  <div v-for="(pub, idx) in formData.publications" :key="idx" class="editor-form-card">
                    <div class="editor-form-card__toolbar">
                      <span class="text-xs text-muted-foreground">论文 {{ idx + 1 }}</span>
                    </div>
                    <div class="editor-form-card__body">
                      <div class="editor-form-grid editor-form-grid--2">
                        <div class="editor-form-field editor-form-field--full">
                          <Label>论文标题</Label>
                          <Input v-model="pub.title" />
                        </div>
                        <div class="editor-form-field">
                          <Label>期刊/会议</Label>
                          <Input v-model="pub.journal" />
                        </div>
                        <div class="editor-form-field">
                          <Label>年份</Label>
                          <Input v-model="pub.year" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>引用数</Label>
                          <Input v-model="pub.citations" />
                        </div>
                      </div>
                      <div class="editor-form-actions">
                        <Button variant="ghost" size="sm" class="text-destructive" @click="removePublication(idx)">删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 开源贡献 -->
              <template v-if="activeSection === 'openSource'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">开源贡献</h3>
                    <p class="editor-form-hint">记录 GitHub 等开源项目贡献</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      show-add
                      :visible="isEditorSectionVisible('openSource', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('openSource', $event)"
                      @add="addOpenSource"
                    />
                  </div>
                </div>
                <div class="editor-draggable-list">
                  <div v-for="(item, idx) in formData.openSourceProject" :key="item.id" class="editor-form-card">
                    <div class="editor-form-card__toolbar">
                      <span class="text-xs text-muted-foreground">项目 {{ idx + 1 }}</span>
                    </div>
                    <div class="editor-form-card__body">
                      <div class="editor-form-grid editor-form-grid--2">
                        <div class="editor-form-field editor-form-field--full">
                          <Label>项目名称</Label>
                          <Input v-model="item.name" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>仓库地址</Label>
                          <Input v-model="item.url" placeholder="github.com/user/repo" />
                        </div>
                        <div class="editor-form-field editor-form-field--full">
                          <Label>描述</Label>
                          <Textarea v-model="item.description" :rows="3" class="w-full resize-y" />
                        </div>
                      </div>
                      <div class="editor-form-actions">
                        <Button variant="ghost" size="sm" class="text-destructive" @click="removeOpenSource(idx)">删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 其他标签 (frontendEngineer) -->
              <template v-if="activeSection === 'other'">
                <div class="editor-section-head">
                  <div class="min-w-0">
                    <h3 class="editor-section-title">其他标签</h3>
                    <p class="editor-form-hint">每行一个标签，如证书、语言等级</p>
                  </div>
                  <div class="editor-section-head__actions">
                    <EditorSectionMenu
                      :visible="isEditorSectionVisible('other', styleSettings.hiddenSections)"
                      @update:visible="setSectionVisibility('other', $event)"
                    />
                  </div>
                </div>
                <div class="editor-form-field">
                  <Textarea
                    :model-value="(formData.otherTags || []).join('\n')"
                    @update:model-value="(v: string) => formData.otherTags = v.split('\n').map(s => s.trim()).filter(Boolean)"
                    :rows="6"
                    placeholder="英语 CET-6&#10;PMP 认证"
                    class="w-full resize-y min-h-[8rem]"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- AI 编辑 -->
        <EditorAiPanel
          v-else-if="activeEditTab === 'ai'"
          class="flex-1 min-h-0 min-w-0"
          :resume-id="resumeId"
          :form-data="formData"
          :style-settings="styleSettings"
          @apply-resume="handleAiApplyResume"
          @apply-title="handleAiApplyTitle"
          @apply-style="handleAiApplyStyle"
        />

        <!-- 样式 -->
        <EditorStylePanel
          v-else
          class="flex-1 min-h-0 min-w-0"
          :style-settings="styleSettings"
          :template-name="currentTemplateName"
          @update:style-settings="styleSettings = $event"
          @reset="handleResetStyleSettings"
        />
        </div>
      </div>

      <!-- 拖拽分隔条 -->
      <div
        class="hidden lg:block shrink-0 w-1.5 relative touch-none select-none z-10 transition-colors"
        :class="isDragging ? 'bg-primary/50' : 'bg-border hover:bg-primary/30'"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整编辑区与预览区宽度"
        @mousedown="startResize"
      >
        <div class="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />
      </div>

      <!-- 右侧预览区 -->
      <div
        class="hidden lg:flex flex-1 min-w-0 flex-col min-h-0 bg-muted/40"
        :class="{ 'preview-interactive': previewInteractive && !isCapturingExport, 'is-exporting': isCapturingExport }"
      >
        <div class="shrink-0 px-4 py-2 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
          <span class="text-xs text-muted-foreground truncate">
            实时预览
          </span>
          <span class="text-[10px] font-medium text-muted-foreground shrink-0 px-2 py-0.5 rounded-full border border-border/60 bg-background">
            {{ paperSizeLabel }}
          </span>
        </div>
        <div
          ref="previewScrollRef"
          class="editor-preview-scroll editor-pane-scroll flex-1 min-h-0 overflow-y-auto"
          @scroll="onEditorPaneScroll"
          @click="handlePreviewClick"
        >
          <div ref="previewDocumentRef" class="editor-preview-document" :data-paper-size="styleSettings.paperSize">
            <ResumePreview
              embedded
              :capture-mode="isCapturingExport"
              :data="previewData"
              :theme="currentTheme"
              :style-settings="styleSettings"
              :interactive="previewInteractive"
              :active-section-id="highlightPreviewSection"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', ssr: false })
import { ref, reactive, computed, watch, nextTick, type Component } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { ArrowLeft, ChevronDown, Download, Eye, Save } from 'lucide-vue-next'
import { getResumeSectionIcon } from '~/utils/iconMaps'
import { AppIcon } from '~/components/ui/icon'
import { useRoute, navigateTo } from 'nuxt/app'
import { useResumeStore, emptyResumeData, type ResumeData } from '~/stores/resume'
import { useTemplateStore } from '~/stores/template'
import { storeDataToPreviewData, normalizeResumeData, mergeResumeDataPatch } from '~/utils/resumeTransform'
import { useResizableSplit } from '~/composables/useResizableSplit'
import { onEditorPaneScroll } from '~/composables/useRevealScrollbar'
import { useAppConfirm } from '~/composables/useAppConfirm'
import { useAppToast } from '~/composables/useAppToast'
import { buildResumeExportBasename, exportResumeByFormat, type ResumeExportFormat } from '~/utils/resumeExport'
import {
  previewSectionToEditor,
  editorSectionToPreview,
  type EditorSectionMeta,
  editorOrderToLayoutMainSection,
  editorOrderToPreviewSectionOrder,
  sortEditorSections,
  storeLayoutToPreviewSectionOrder,
  ensureBasicInfoInPreviewOrder,
  themeComponentsToLayoutMainSection,
} from '~/utils/resumeEditSections'
import {
  isEditorSectionVisible,
  normalizeHiddenSections,
  resolveDefaultHiddenSections,
} from '~/utils/resumeSectionVisibility'
import { Button } from '~/components/ui/button'
import LoadingState from '~/components/ui/LoadingState.vue'
import { Input } from '~/components/ui/Input'
import { Label } from '~/components/ui/Label'
import { Textarea } from '~/components/ui/Textarea'
import ResumePreview from '~/components/resume/ResumePreview.vue'
import EditorAiPanel from '~/components/editor/EditorAiPanel.vue'
import EditorStylePanel, { type EditorStyleSettings } from '~/components/editor/EditorStylePanel.vue'
import EditorDraggableList from '~/components/editor/EditorDraggableList.vue'
import EditorSectionMenu from '~/components/editor/EditorSectionMenu.vue'
import EditorSectionNav from '~/components/editor/EditorSectionNav.vue'
import EditorAvatarUpload from '~/components/editor/EditorAvatarUpload.vue'
import { themes } from '~/components/resume/ThemeConfig'
import { PAPER_SPECS, normalizePaperSize } from '~/utils/resumePaper'

import { getThemeKeyByCatalogId } from '~/components/resume/schema/templates'
import { getComponentSchema } from '~/components/resume/schema/components'

const route = useRoute()
const appConfirm = useAppConfirm()
const toast = useAppToast()
const resumeStore = useResumeStore()
const templateStore = useTemplateStore()
const resumeId = computed(() => String(route.params.id))

const activeEditTab = ref<'manual' | 'ai' | 'style'>('manual')
const activeSection = ref('basicInfo')
const saving = ref(false)
const pageLoading = ref(true)
const isHydrating = ref(false)
const exporting = ref(false)
const isCapturingExport = ref(false)
const exportMenuOpen = ref(false)
const exportMenuRef = ref<HTMLElement | null>(null)
const previewDocumentRef = ref<HTMLElement | null>(null)
const previewScrollRef = ref<HTMLElement | null>(null)
const persistedSnapshot = ref('')
const selectedTemplate = ref('classic')
const lastSaved = ref('--:--')
const resumeTitle = ref('我的简历')

onClickOutside(exportMenuRef, () => {
  exportMenuOpen.value = false
})

const exportOptions: Array<{ format: ResumeExportFormat; label: string }> = [
  { format: 'pdf', label: '导出 PDF' },
  { format: 'docx', label: '导出 Word (.docx)' },
  { format: 'png', label: '导出 PNG 图片' },
  { format: 'jpeg', label: '导出 JPG 图片' },
]

const splitContainer = ref<HTMLElement | null>(null)
const { leftWidth, isDragging, isReady: splitReady, startResize } = useResizableSplit({
  containerRef: splitContainer,
  minLeft: 260,
  minRight: 340,
  maxLeftRatio: 0.3,
})

const splitStyle = computed(() => ({
  width: `${leftWidth.value}px`,
  maxWidth: `${leftWidth.value}px`,
  flexShrink: 0,
} as Record<string, string | number>))

const previewInteractive = computed(() => activeEditTab.value === 'manual')

const highlightPreviewSection = computed(() =>
  previewInteractive.value ? editorSectionToPreview(activeSection.value) : ''
)

function handlePreviewClick(e: MouseEvent) {
  if (!previewInteractive.value) return
  const zone = (e.target as HTMLElement).closest('[data-edit-section]')
  if (!zone) return
  const previewId = zone.getAttribute('data-edit-section')
  if (!previewId) return
  const editorKey = previewSectionToEditor(previewId)
  if (!editorKey) return
  if (orderedSections.value.some((s) => s.key === editorKey)) {
    activeSection.value = editorKey
  }
}

const editTabs = [
  { key: 'manual' as const, label: '手动编辑' },
  { key: 'ai' as const, label: 'AI编辑' },
  { key: 'style' as const, label: '样式' }
]

const BASE_SECTIONS: Array<{ key: string; label: string; icon: Component }> = [
  { key: 'basicInfo', label: '个人信息', icon: getResumeSectionIcon('basicInfo') },
  { key: 'workExperience', label: '工作经历', icon: getResumeSectionIcon('workExperience') },
  { key: 'education', label: '教育背景', icon: getResumeSectionIcon('education') },
  { key: 'projectExperience', label: '项目经历', icon: getResumeSectionIcon('projectExperience') },
  { key: 'skills', label: '技能证书', icon: getResumeSectionIcon('skills') },
  { key: 'summary', label: '自我评价', icon: getResumeSectionIcon('summary') },
]

const EXTRA_SECTION_META: Record<string, { label: string; icon: Component }> = {
  certificates: { label: '证书', icon: getResumeSectionIcon('certificates') },
  campusActivity: { label: '校园活动', icon: getResumeSectionIcon('campusActivity') },
  portfolio: { label: '作品集', icon: getResumeSectionIcon('portfolio') },
  dataProjects: { label: '数据项目', icon: getResumeSectionIcon('dataProjects') },
  productAchievements: { label: '产品成果', icon: getResumeSectionIcon('productAchievements') },
  publications: { label: '论文', icon: getResumeSectionIcon('publications') },
  openSource: { label: '开源', icon: getResumeSectionIcon('openSource') },
  other: { label: '其他', icon: getResumeSectionIcon('other') },
}

const COMPONENT_TO_PREVIEW: Record<string, string> = {
  basicInfo: 'basicInfo',
  summary: 'summary',
  experience: 'experience',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certificates: 'certificates',
  campusActivity: 'campusActivity',
  portfolio: 'portfolio',
  dataProjects: 'dataProjects',
  productAchievements: 'productAchievements',
  publications: 'publications',
  openSource: 'openSource',
  other: 'other',
}

const formData = reactive<ResumeData>(emptyResumeData())

const defaultStyleSettings = (): EditorStyleSettings => ({
  themeColor: '#2563eb',
  fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontSize: 12,
  lineHeight: 1.5,
  letterSpacing: 0,
  paperSize: 'A4',
  margins: 'normal',
  sectionOrder: [
    { key: 'summary' }, { key: 'experience' }, { key: 'education' }, { key: 'skills' },
  ],
  hiddenSections: [],
})

const styleSettings = ref<EditorStyleSettings>(defaultStyleSettings())

const currentTheme = computed(() => {
  const tpl = templateStore.templateListItems.find((t) => t.themeKey === selectedTemplate.value)
  const base = tpl
    ? templateStore.getThemeForTemplate(tpl.id)
    : (themes[selectedTemplate.value] || themes.classic)
  return {
    ...base,
    primaryColor: styleSettings.value.themeColor || base.primaryColor,
  }
})

const currentTemplateName = computed(() => templateStore.getTemplateName(selectedTemplate.value))

const paperSizeLabel = computed(() => {
  const key = normalizePaperSize(styleSettings.value.paperSize)
  return PAPER_SPECS[key].label
})

const orderedSections = ref<EditorSectionMeta[]>([])

function buildAllSectionMetas(): EditorSectionMeta[] {
  const extras = (currentTheme.value.components || [])
    .filter((id: string) => !['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects'].includes(id))
    .map((id: string) => {
      const meta = EXTRA_SECTION_META[id] || { label: getComponentSchema(id)?.name || id, icon: EXTRA_SECTION_META.other.icon }
      return { key: id, label: meta.label, icon: meta.icon }
    })
  return [...BASE_SECTIONS, ...extras]
}

function rebuildOrderedSections(orderHint?: string[]) {
  orderedSections.value = sortEditorSections(buildAllSectionMetas(), orderHint)
}

function applyEditorSectionOrder(editorKeys: string[]) {
  styleSettings.value = {
    ...styleSettings.value,
    sectionOrder: editorOrderToPreviewSectionOrder(editorKeys),
  }
}

function handleSectionReorder(sections: EditorSectionMeta[]) {
  const nextKeys = sections.map((section) => section.key).join('\0')
  const curKeys = orderedSections.value.map((section) => section.key).join('\0')
  if (nextKeys === curKeys) return
  orderedSections.value = sections
  applyEditorSectionOrder(sections.map((section) => section.key))
}

function applySavedLayoutOrder(mainSection?: string[]) {
  if (mainSection?.length) {
    rebuildOrderedSections(mainSection)
    const previewKeys = storeLayoutToPreviewSectionOrder(mainSection).map((item) => item.key)
    styleSettings.value.sectionOrder = ensureBasicInfoInPreviewOrder(previewKeys, {
      themeComponents: currentTheme.value.components || [],
      hiddenSections: styleSettings.value.hiddenSections,
    }).map((key) => ({ key }))
    return
  }
  styleSettings.value.sectionOrder = buildSectionOrderFromTheme(selectedTemplate.value)
  rebuildOrderedSections(styleSettings.value.sectionOrder.map((item) => item.key))
}

const previewData = computed(() => storeDataToPreviewData(formData))

function buildSectionOrderFromTheme(themeKey?: string) {
  const theme = themeKey
    ? (themes[themeKey] || themes.classic)
    : currentTheme.value
  const keys = (theme.components || [])
    .map((id: string) => COMPONENT_TO_PREVIEW[id] || id)
    .filter(Boolean)
  return keys.length ? keys.map((key) => ({ key })) : defaultStyleSettings().sectionOrder
}

function resetStyleSettings() {
  const tpl = templateStore.templateListItems.find((t) => t.themeKey === selectedTemplate.value)
  const theme = tpl ? templateStore.getThemeForTemplate(tpl.id) : currentTheme.value
  styleSettings.value = {
    ...defaultStyleSettings(),
    themeColor: theme.primaryColor || '#2563eb',
    sectionOrder: buildSectionOrderFromTheme(selectedTemplate.value),
    hiddenSections: resolveDefaultHiddenSections(selectedTemplate.value),
  }
}

function handleResetStyleSettings() {
  resetStyleSettings()
  applySavedLayoutOrder()
}

function setSectionVisibility(editorKey: string, visible: boolean) {
  const previewKey = editorSectionToPreview(editorKey)
  const hidden = styleSettings.value.hiddenSections.filter((k) => k !== previewKey)
  if (!visible) hidden.push(previewKey)
  styleSettings.value.hiddenSections = hidden

  if (visible) {
    const order = styleSettings.value.sectionOrder
    const hasKey = order.some((item) => (item.key || item) === previewKey)
    if (!hasKey) {
      styleSettings.value.sectionOrder = [...order, { key: previewKey }]
    }
  }
}

const GENERIC_DEFAULT_THEME = '#2563eb'

function resolveThemeColor(savedTheme?: string, templatePrimary?: string): string {
  const normalized = savedTheme?.toLowerCase()
  if (normalized && normalized !== GENERIC_DEFAULT_THEME) return savedTheme!
  return templatePrimary || savedTheme || GENERIC_DEFAULT_THEME
}

function applyResumeStyle(resumeStyle?: {
  theme?: string
  fontSize?: number
  lineHeight?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  margin?: number
  letterSpacing?: number
  paperSize?: string
  hiddenSections?: string[]
}) {
  if (!resumeStyle) {
    styleSettings.value.hiddenSections = resolveDefaultHiddenSections(selectedTemplate.value)
    return
  }
  const tpl = templateStore.templateListItems.find((t) => t.themeKey === selectedTemplate.value)
  const templateTheme = tpl ? templateStore.getThemeForTemplate(tpl.id) : null
  styleSettings.value.themeColor = resolveThemeColor(
    resumeStyle.theme,
    templateTheme?.primaryColor,
  )
  styleSettings.value.fontSize = resumeStyle.fontSize || styleSettings.value.fontSize
  styleSettings.value.lineHeight = resumeStyle.lineHeight || styleSettings.value.lineHeight
  styleSettings.value.fontFamily = resumeStyle.fontFamily || styleSettings.value.fontFamily
  styleSettings.value.fontWeight = resumeStyle.fontWeight || styleSettings.value.fontWeight
  styleSettings.value.fontStyle = resumeStyle.fontStyle || styleSettings.value.fontStyle
  if (typeof resumeStyle.letterSpacing === 'number') {
    styleSettings.value.letterSpacing = resumeStyle.letterSpacing
  }
  if (resumeStyle.paperSize) {
    styleSettings.value.paperSize = normalizePaperSize(resumeStyle.paperSize)
  }
  const marginRev: Record<number, string> = { 16: 'narrow', 28: 'normal', 36: 'wide' }
  styleSettings.value.margins = marginRev[resumeStyle.margin ?? 28] || 'normal'
  styleSettings.value.hiddenSections = normalizeHiddenSections(resumeStyle, selectedTemplate.value)
}

function handleAiApplyResume(data: ResumeData) {
  const merged = mergeResumeDataPatch(formData, data)
  Object.assign(formData, JSON.parse(JSON.stringify(merged)))
  syncToStore()
}

function handleAiApplyTitle(title: string) {
  const trimmed = title?.trim()
  if (!trimmed) return
  resumeTitle.value = trimmed
  resumeStore.updateResume(resumeId.value, { title: trimmed })
}

function handleAiApplyStyle(style: Record<string, unknown>) {
  if (style.theme && typeof style.theme === 'string') {
    styleSettings.value.themeColor = style.theme
  }
  if (typeof style.fontSize === 'number') styleSettings.value.fontSize = style.fontSize
  if (typeof style.lineHeight === 'number') styleSettings.value.lineHeight = style.lineHeight
  if (typeof style.fontFamily === 'string') styleSettings.value.fontFamily = style.fontFamily
  if (typeof style.fontWeight === 'string') styleSettings.value.fontWeight = style.fontWeight
  if (typeof style.fontStyle === 'string') styleSettings.value.fontStyle = style.fontStyle
  syncStyleToStore()
}

function syncStyleToStore() {
  if (isHydrating.value || pageLoading.value) return
  const marginMap: Record<string, number> = { narrow: 16, normal: 28, wide: 36 }
  const resume = resumeStore.getResumeById(resumeId.value)
  const mainSection = editorOrderToLayoutMainSection(orderedSections.value.map((section) => section.key))
  resumeStore.updateResumeStyle(resumeId.value, {
    theme: styleSettings.value.themeColor,
    fontSize: styleSettings.value.fontSize,
    lineHeight: styleSettings.value.lineHeight,
    fontFamily: styleSettings.value.fontFamily,
    fontWeight: styleSettings.value.fontWeight,
    fontStyle: styleSettings.value.fontStyle,
    margin: marginMap[styleSettings.value.margins] || 28,
    letterSpacing: styleSettings.value.letterSpacing,
    paperSize: normalizePaperSize(styleSettings.value.paperSize),
    hiddenSections: [...styleSettings.value.hiddenSections],
    layout: {
      mainSection,
      sidebar: resume?.style?.layout?.sidebar || [],
    },
  } as any)
}

function buildPersistSnapshot() {
  return JSON.stringify({
    data: formData,
    style: styleSettings.value,
  })
}

function markPersisted() {
  persistedSnapshot.value = buildPersistSnapshot()
}

const isDirty = computed(() => {
  if (!persistedSnapshot.value || isHydrating.value || pageLoading.value) return false
  return persistedSnapshot.value !== buildPersistSnapshot()
})

/** 程序化 navigateTo 前已确认，避免路由守卫重复弹窗 */
let bypassLeaveConfirm = false

async function confirmLeaveIfDirty(): Promise<boolean> {
  if (!isDirty.value) return true
  if (bypassLeaveConfirm) {
    bypassLeaveConfirm = false
    return true
  }
  return appConfirm.confirm({
    title: '有未保存的修改',
    description: '请点击顶部「保存」按钮保存修改内容后再离开，否则修改将丢失。',
    confirmText: '仍然离开',
    cancelText: '继续编辑',
    variant: 'destructive',
  })
}

function formatTime(d: Date) {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const addWorkExperience = () => {
  formData.workExperience.push({ id: uid(), company: '', position: '', startDate: '', endDate: '', description: [] })
}
const removeWorkExperience = (idx: number) => formData.workExperience.splice(idx, 1)
const addEducation = () => {
  formData.education.push({ id: uid(), school: '', major: '', degree: '', startDate: '', endDate: '', description: '' })
}
const removeEducation = (idx: number) => formData.education.splice(idx, 1)
const addProject = () => {
  formData.projectExperience.push({ id: uid(), name: '', role: '', startDate: '', endDate: '', description: [] })
}
const removeProject = (idx: number) => formData.projectExperience.splice(idx, 1)

const addSkill = () => {
  const index = formData.skills.length + 1
  formData.skills.push({
    id: uid(),
    category: index === 1 ? '技能分类' : `技能分类 ${index}`,
    items: [],
  })
}
const removeSkill = (idx: number) => formData.skills.splice(idx, 1)

const addCertificate = () => formData.certificates.push({ id: uid(), name: '', issuer: '', date: '' })
const removeCertificate = (idx: number) => formData.certificates.splice(idx, 1)
const addCampusActivity = () => formData.campusActivity!.push({ name: '', role: '', duration: '', description: '' })
const removeCampusActivity = (idx: number) => formData.campusActivity!.splice(idx, 1)
const addPortfolio = () => formData.portfolio!.push({ name: '', type: '', url: '', description: '' })
const removePortfolio = (idx: number) => formData.portfolio!.splice(idx, 1)
const addDataProject = () => formData.dataProjects!.push({ name: '', role: '', duration: '', description: '', metrics: '', tools: '' })
const removeDataProject = (idx: number) => formData.dataProjects!.splice(idx, 1)
const addProductAchievement = () => formData.productAchievements!.push({ name: '', role: '', duration: '', description: '', metrics: '' })
const removeProductAchievement = (idx: number) => formData.productAchievements!.splice(idx, 1)
const addPublication = () => formData.publications!.push({ title: '', journal: '', year: '', citations: '', doi: '' })
const removePublication = (idx: number) => formData.publications!.splice(idx, 1)
const addOpenSource = () => formData.openSourceProject.push({ id: uid(), name: '', url: '', description: '' })
const removeOpenSource = (idx: number) => formData.openSourceProject.splice(idx, 1)

const syncToStore = () => {
  if (isHydrating.value) return
  const id = resumeId.value
  resumeStore.updateResumeData(id, 'basicInfo', { ...formData.basicInfo, showAvatar: formData.basicInfo.showAvatar !== false })
  resumeStore.updateResumeData(id, 'professionalSummary', formData.professionalSummary)
  resumeStore.updateResumeData(id, 'workExperience', [...formData.workExperience])
  resumeStore.updateResumeData(id, 'education', [...formData.education])
  resumeStore.updateResumeData(id, 'projectExperience', [...formData.projectExperience])
  resumeStore.updateResumeData(id, 'skills', [...formData.skills])
  resumeStore.updateResumeData(id, 'certificates', [...formData.certificates])
  resumeStore.updateResumeData(id, 'openSourceProject', [...formData.openSourceProject])
  const resume = resumeStore.getResumeById(id)
  if (resume) {
    resume.data.campusActivity = [...(formData.campusActivity || [])]
    resume.data.portfolio = [...(formData.portfolio || [])]
    resume.data.dataProjects = [...(formData.dataProjects || [])]
    resume.data.productAchievements = [...(formData.productAchievements || [])]
    resume.data.publications = [...(formData.publications || [])]
    resume.data.otherTags = [...(formData.otherTags || [])]
    resume.data.githubDesc = formData.githubDesc || ''
  }
}

watch(formData, syncToStore, { deep: true })
watch(styleSettings, syncStyleToStore, { deep: true })
watch(
  () => currentTheme.value.components,
  () => {
    if (isHydrating.value || pageLoading.value) return
    rebuildOrderedSections(
      editorOrderToLayoutMainSection(orderedSections.value.map((section) => section.key)),
    )
  },
  { deep: true },
)

async function loadResume(id: string) {
  pageLoading.value = true
  isHydrating.value = true
  try {
    Object.assign(formData, JSON.parse(JSON.stringify(emptyResumeData())))

    resumeStore.setCurrentResumeId(id)
    const resume = await resumeStore.fetchResume(id)
    if (resume?.data) {
      resumeTitle.value = resume.title || '我的简历'
      Object.assign(formData, JSON.parse(JSON.stringify(normalizeResumeData(resume.data))))
      if (formData.basicInfo.showAvatar === undefined) {
        formData.basicInfo.showAvatar = true
      }
      if (resume.templateId) {
        const tpl = templateStore.templateListItems.find(
          (t) => t.id === resume.templateId || t.themeKey === resume.templateId,
        )
        selectedTemplate.value = tpl?.themeKey || getThemeKeyByCatalogId(resume.templateId)
      }
      resetStyleSettings()
      applySavedLayoutOrder(resume.style?.layout?.mainSection)
      applyResumeStyle(resume.style as any)
    } else {
      resetStyleSettings()
      applySavedLayoutOrder()
    }
    lastSaved.value = formatTime(new Date())
    markPersisted()
  } catch (err) {
    console.error('加载简历失败:', err)
    toast.error('加载简历失败，请刷新重试')
  } finally {
    isHydrating.value = false
    pageLoading.value = false
  }
}

watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    if (!templateStore.templates.length) {
      await templateStore.fetchTemplates()
    }
    await loadResume(String(id))
  },
  { immediate: true },
)

const saveResume = async () => {
  syncToStore()
  syncStyleToStore()
  saving.value = true
  const ok = await resumeStore.saveResume(resumeId.value)
  saving.value = false
  if (ok) {
    lastSaved.value = formatTime(new Date())
    markPersisted()
    toast.success('简历已保存')
  } else {
    toast.error('保存失败，请稍后重试')
  }
}

async function handleExport(format: ResumeExportFormat) {
  exportMenuOpen.value = false
  if (pageLoading.value) {
    toast.error('预览尚未加载，请稍后再试')
    return
  }

  exporting.value = true
  try {
    const basename = buildResumeExportBasename(previewData.value)
    await exportResumeByFormat({
      format,
      data: JSON.parse(JSON.stringify(formData)) as ResumeData,
      basename,
      style: {
        fontFamily: styleSettings.value.fontFamily,
        fontWeight: styleSettings.value.fontWeight,
        fontStyle: styleSettings.value.fontStyle,
        paperSize: styleSettings.value.paperSize,
        margins: styleSettings.value.margins,
        fontSize: styleSettings.value.fontSize,
      },
      beforeCapture: async () => {
        isCapturingExport.value = true
        if (previewScrollRef.value) previewScrollRef.value.scrollTop = 0
        await nextTick()
      },
      getPreviewElement: () => previewDocumentRef.value?.firstElementChild as HTMLElement | null,
    })
    toast.success('导出成功')
  } catch (error) {
    console.error(error)
    toast.error(error instanceof Error && error.message.includes('预览') ? error.message : '导出失败，请稍后重试')
  } finally {
    isCapturingExport.value = false
    exporting.value = false
  }
}

const goBack = async () => {
  if (!(await confirmLeaveIfDirty())) return
  bypassLeaveConfirm = true
  await navigateTo('/resume')
}

const previewResume = async () => {
  if (!(await confirmLeaveIfDirty())) return
  bypassLeaveConfirm = true
  await navigateTo(`/preview/${resumeId.value}`)
}

onBeforeRouteLeave(async () => {
  return await confirmLeaveIfDirty()
})
</script>
