import '../models/resume.dart';
import 'resume_defaults.dart';

/// Plain-text resume body for share / clipboard (mobile MVP export).
String buildResumeShareText(Resume resume, {String brand = '简流'}) {
  final data = resume.data;
  final buf = StringBuffer();
  buf.writeln(resume.title.isNotEmpty ? resume.title : getResumeDisplayName(data));
  buf.writeln('—');
  buf.writeln(getResumeDisplayName(data));
  if (data.basicInfo.position.isNotEmpty) {
    buf.writeln(data.basicInfo.position);
  }
  final contact = [
    data.basicInfo.phone,
    data.basicInfo.email,
    data.basicInfo.city,
  ].where((e) => e.trim().isNotEmpty).join(' · ');
  if (contact.isNotEmpty) buf.writeln(contact);

  if (data.professionalSummary.trim().isNotEmpty) {
    buf.writeln();
    buf.writeln('【自我介绍】');
    buf.writeln(data.professionalSummary.trim());
  }

  if (data.workExperience.isNotEmpty) {
    buf.writeln();
    buf.writeln('【工作经历】');
    for (final w in data.workExperience) {
      final company = '${w['company'] ?? ''}';
      final position = '${w['position'] ?? ''}';
      final start = '${w['startDate'] ?? '?'}';
      final end = '${w['endDate'] ?? '?'}';
      buf.writeln('$company · $position（$start - $end）');
      for (final d in _stringList(w['description'])) {
        buf.writeln('  • $d');
      }
    }
  }

  if (data.projectExperience.isNotEmpty) {
    buf.writeln();
    buf.writeln('【项目经验】');
    for (final p in data.projectExperience) {
      final name = '${p['name'] ?? ''}';
      final role = '${p['role'] ?? ''}';
      final start = '${p['startDate'] ?? '?'}';
      final end = '${p['endDate'] ?? '?'}';
      buf.writeln('$name · $role（$start - $end）');
      for (final d in _stringList(p['description'])) {
        buf.writeln('  • $d');
      }
    }
  }

  if (data.education.isNotEmpty) {
    buf.writeln();
    buf.writeln('【教育背景】');
    for (final e in data.education) {
      buf.writeln('${e['school'] ?? ''} · ${e['degree'] ?? ''} · ${e['major'] ?? ''}');
      final desc = '${e['description'] ?? ''}'.trim();
      if (desc.isNotEmpty) buf.writeln('  $desc');
    }
  }

  final skillGroups = data.skills.where((s) {
    final items = s['items'];
    return items is List && items.isNotEmpty;
  });
  if (skillGroups.isNotEmpty) {
    buf.writeln();
    buf.writeln('【专业技能】');
    for (final s in skillGroups) {
      final items = _stringList(s['items']).join(' · ');
      buf.writeln('${s['category'] ?? '技能'}: $items');
    }
  }

  buf.writeln();
  buf.writeln('模板: ${resume.templateId ?? 'default'} · $brand');
  return buf.toString().trimRight();
}

List<String> _stringList(dynamic value) {
  if (value is! List) return const [];
  return value.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
}
