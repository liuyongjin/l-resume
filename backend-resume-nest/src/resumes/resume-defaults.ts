/** 与前端 ResumeData / ResumeStyle 默认结构对齐 */

export function emptyResumeData() {
  return {
    basicInfo: {
      name: '',
      avatar: '',
      showAvatar: true,
      position: '',
      phone: '',
      email: '',
      city: '',
      gender: '',
      age: '',
      workExperience: '',
      ethnicity: '',
      github: '',
      homepage: '',
      currentStatus: '',
      nativePlace: '',
    },
    education: [],
    workExperience: [],
    projectExperience: [],
    professionalSummary: '',
    openSourceProject: [],
    github: [],
    skills: [{ id: 'skill1', category: '技能分类', items: [] }],
    certificates: [],
    campusActivity: [],
    portfolio: [],
    dataProjects: [],
    productAchievements: [],
    publications: [],
    otherTags: [],
    githubDesc: '',
  };
}

export function defaultStyle() {
  return {
    theme: '#2563eb',
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'system-ui',
    margin: 28,
    layout: {
      mainSection: ['professionalSummary', 'workExperience', 'projectExperience', 'education'],
      sidebar: ['skills', 'certificates'],
    },
  };
}
