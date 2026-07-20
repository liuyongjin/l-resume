import '../models/resume.dart';

ResumeData emptyResumeData() {
  return ResumeData(
    basicInfo: ResumeBasicInfo(),
    skills: [
      {'id': 'skill1', 'category': '技能', 'items': <String>[]},
    ],
  );
}

ResumeStyle defaultResumeStyle() => ResumeStyle();

String getResumeDisplayName(ResumeData data) {
  final name = data.basicInfo.name.trim();
  final position = data.basicInfo.position.trim();
  if (name.isNotEmpty) return name;
  if (position.isNotEmpty) return position;
  return '未命名';
}

String formatDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '${d.year}-$m-$day';
}
