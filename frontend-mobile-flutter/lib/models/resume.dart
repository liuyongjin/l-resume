class ResumeBasicInfo {
  ResumeBasicInfo({
    this.name = '',
    this.avatar = '',
    this.showAvatar = true,
    this.position = '',
    this.phone = '',
    this.email = '',
    this.city = '',
    this.gender = '',
    this.age = '',
    this.workExperience = '',
    this.ethnicity = '',
    this.github = '',
    this.homepage = '',
    this.currentStatus = '',
    this.nativePlace = '',
  });

  String name;
  String avatar;
  bool showAvatar;
  String position;
  String phone;
  String email;
  String city;
  String gender;
  String age;
  String workExperience;
  String ethnicity;
  String github;
  String homepage;
  String currentStatus;
  String nativePlace;

  factory ResumeBasicInfo.fromJson(Map<String, dynamic> json) {
    return ResumeBasicInfo(
      name: json['name'] as String? ?? '',
      avatar: json['avatar'] as String? ?? '',
      showAvatar: json['showAvatar'] as bool? ?? true,
      position: json['position'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String? ?? '',
      city: json['city'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      age: json['age'] as String? ?? '',
      workExperience: json['workExperience'] as String? ?? '',
      ethnicity: json['ethnicity'] as String? ?? '',
      github: json['github'] as String? ?? '',
      homepage: json['homepage'] as String? ?? '',
      currentStatus: json['currentStatus'] as String? ?? '',
      nativePlace: json['nativePlace'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'avatar': avatar,
        'showAvatar': showAvatar,
        'position': position,
        'phone': phone,
        'email': email,
        'city': city,
        'gender': gender,
        'age': age,
        'workExperience': workExperience,
        'ethnicity': ethnicity,
        'github': github,
        'homepage': homepage,
        'currentStatus': currentStatus,
        'nativePlace': nativePlace,
      };
}

class ResumeData {
  ResumeData({
    required this.basicInfo,
    this.education = const [],
    this.workExperience = const [],
    this.projectExperience = const [],
    this.professionalSummary = '',
    this.openSourceProject = const [],
    this.github = const [],
    this.skills = const [],
    this.certificates = const [],
    this.otherTags = const [],
    this.githubDesc = '',
  });

  ResumeBasicInfo basicInfo;
  List<Map<String, dynamic>> education;
  List<Map<String, dynamic>> workExperience;
  List<Map<String, dynamic>> projectExperience;
  String professionalSummary;
  List<Map<String, dynamic>> openSourceProject;
  List<Map<String, dynamic>> github;
  List<Map<String, dynamic>> skills;
  List<Map<String, dynamic>> certificates;
  List<String> otherTags;
  String githubDesc;

  factory ResumeData.fromJson(Map<String, dynamic> json) {
    return ResumeData(
      basicInfo: ResumeBasicInfo.fromJson(
        Map<String, dynamic>.from((json['basicInfo'] as Map?) ?? {}),
      ),
      education: _listOfMap(json['education']),
      workExperience: _listOfMap(json['workExperience']),
      projectExperience: _listOfMap(json['projectExperience']),
      professionalSummary: json['professionalSummary'] as String? ?? '',
      openSourceProject: _listOfMap(json['openSourceProject']),
      github: _listOfMap(json['github']),
      skills: _listOfMap(json['skills']),
      certificates: _listOfMap(json['certificates']),
      otherTags: (json['otherTags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      githubDesc: json['githubDesc'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'basicInfo': basicInfo.toJson(),
        'education': education,
        'workExperience': workExperience,
        'projectExperience': projectExperience,
        'professionalSummary': professionalSummary,
        'openSourceProject': openSourceProject,
        'github': github,
        'skills': skills,
        'certificates': certificates,
        'otherTags': otherTags,
        'githubDesc': githubDesc,
      };

  static List<Map<String, dynamic>> _listOfMap(dynamic value) {
    if (value is! List) return [];
    return value
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }
}

class ResumeStyle {
  ResumeStyle({
    this.theme = '#7C3AED',
    this.fontSize = 14,
    this.lineHeight = 1.5,
    this.fontFamily = 'system-ui',
    this.margin = 28,
    this.layout = const {
      'mainSection': [
        'professionalSummary',
        'workExperience',
        'projectExperience',
        'education',
      ],
      'sidebar': ['skills', 'certificates'],
    },
  });

  String theme;
  num fontSize;
  num lineHeight;
  String fontFamily;
  num margin;
  Map<String, dynamic> layout;

  factory ResumeStyle.fromJson(Map<String, dynamic> json) {
    return ResumeStyle(
      theme: json['theme'] as String? ?? '#7C3AED',
      fontSize: json['fontSize'] as num? ?? 14,
      lineHeight: json['lineHeight'] as num? ?? 1.5,
      fontFamily: json['fontFamily'] as String? ?? 'system-ui',
      margin: json['margin'] as num? ?? 28,
      layout: Map<String, dynamic>.from(
        (json['layout'] as Map<String, dynamic>?) ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'theme': theme,
        'fontSize': fontSize,
        'lineHeight': lineHeight,
        'fontFamily': fontFamily,
        'margin': margin,
        'layout': layout,
      };
}

class Resume {
  Resume({
    required this.id,
    required this.title,
    required this.data,
    required this.style,
    this.createdAt,
    required this.updatedAt,
    this.templateId,
    this.source,
  });

  final int id;
  final String title;
  final ResumeData data;
  final ResumeStyle style;
  final String? createdAt;
  final String updatedAt;
  final String? templateId;
  final String? source;

  factory Resume.fromJson(Map<String, dynamic> json) {
    return Resume(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '未命名简历',
      data: ResumeData.fromJson(
        Map<String, dynamic>.from((json['data'] as Map?) ?? {}),
      ),
      style: ResumeStyle.fromJson(
        Map<String, dynamic>.from((json['style'] as Map?) ?? {}),
      ),
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String? ?? '',
      templateId: json['templateId'] as String?,
      source: json['source'] as String?,
    );
  }
}

class ResumeListResponse {
  ResumeListResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<Resume> items;
  final int total;
  final int page;
  final int limit;

  factory ResumeListResponse.fromJson(dynamic json) {
    if (json is List) {
      final items = json
          .whereType<Map>()
          .map((e) => Resume.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      return ResumeListResponse(
        items: items,
        total: items.length,
        page: 1,
        limit: items.length,
      );
    }
    final map = Map<String, dynamic>.from(json as Map);
    final rawItems = map['items'] as List<dynamic>? ?? [];
    return ResumeListResponse(
      items: rawItems
          .whereType<Map>()
          .map((e) => Resume.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      total: (map['total'] as num?)?.toInt() ?? rawItems.length,
      page: (map['page'] as num?)?.toInt() ?? 1,
      limit: (map['limit'] as num?)?.toInt() ?? 20,
    );
  }
}
