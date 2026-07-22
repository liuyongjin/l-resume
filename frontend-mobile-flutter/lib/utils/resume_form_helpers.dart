/// Pure helpers for resume section editors (id gen, description / skills parsing).

String newSectionId(String prefix, [int? millisecondsSinceEpoch]) {
  final ms = millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch;
  return '$prefix-$ms';
}

List<String> splitDescriptionLines(String text) {
  return text
      .split('\n')
      .map((e) => e.trim())
      .where((e) => e.isNotEmpty)
      .toList();
}

String joinDescriptionLines(List<dynamic>? items) {
  if (items == null || items.isEmpty) return '';
  return items.map((e) => e.toString()).join('\n');
}

List<String> splitSkillItems(String text) {
  return text
      .split(RegExp('[,，]'))
      .map((e) => e.trim())
      .where((e) => e.isNotEmpty)
      .toList();
}

String joinSkillItems(List<dynamic>? items) {
  if (items == null || items.isEmpty) return '';
  return items.map((e) => e.toString()).join(', ');
}

Map<String, dynamic> emptyWorkItem([int? ms]) => {
      'id': newSectionId('work', ms),
      'company': '',
      'position': '',
      'startDate': '',
      'endDate': '',
      'description': <String>[''],
    };

Map<String, dynamic> emptyProjectItem([int? ms]) => {
      'id': newSectionId('proj', ms),
      'name': '',
      'role': '',
      'startDate': '',
      'endDate': '',
      'description': <String>[''],
    };

Map<String, dynamic> emptyEducationItem([int? ms]) => {
      'id': newSectionId('edu', ms),
      'school': '',
      'major': '',
      'degree': '',
      'startDate': '',
      'endDate': '',
      'description': '',
    };

Map<String, dynamic> emptySkillItem([int? ms]) => {
      'id': newSectionId('skill', ms),
      'category': '技能',
      'items': <String>[],
    };
