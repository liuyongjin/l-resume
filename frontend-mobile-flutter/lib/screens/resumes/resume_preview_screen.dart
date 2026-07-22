import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../providers/resume_provider.dart';
import '../../theme/app_colors.dart';
import '../../utils/resume_defaults.dart';
import '../../utils/resume_export.dart';
import '../../widgets/common_widgets.dart';

class ResumePreviewScreen extends StatefulWidget {
  const ResumePreviewScreen({super.key, required this.id});

  final int id;

  @override
  State<ResumePreviewScreen> createState() => _ResumePreviewScreenState();
}

class _ResumePreviewScreenState extends State<ResumePreviewScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ResumeProvider>().fetchOne(widget.id);
    });
  }

  Future<void> _share() async {
    final resume = context.read<ResumeProvider>().current;
    if (resume == null) return;
    final text = buildResumeShareText(resume);
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('简历全文已复制到剪贴板，可粘贴分享')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ResumeProvider>();
    final resume = provider.current;

    return Scaffold(
      appBar: AppBar(
        title: const Text('简历预览'),
        actions: [
          TextButton(onPressed: resume == null ? null : _share, child: const Text('分享导出')),
        ],
      ),
      body: provider.isLoading && resume == null
          ? const LoadingView()
          : resume == null
              ? const Center(child: Text('简历不存在'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            getResumeDisplayName(resume.data),
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                          ),
                          if (resume.data.basicInfo.position.isNotEmpty)
                            Text(
                              resume.data.basicInfo.position,
                              style: const TextStyle(color: AppColors.primary, fontSize: 16),
                            ),
                          const SizedBox(height: 12),
                          _line('手机', resume.data.basicInfo.phone),
                          _line('邮箱', resume.data.basicInfo.email),
                          _line('城市', resume.data.basicInfo.city),
                          const Divider(height: 32),
                          if (resume.data.professionalSummary.isNotEmpty) ...[
                            _sectionTitle('个人总结'),
                            Text(resume.data.professionalSummary),
                            const SizedBox(height: 16),
                          ],
                          if (resume.data.workExperience.isNotEmpty) ...[
                            _sectionTitle('工作经历'),
                            ...resume.data.workExperience.map(_workItem),
                            const SizedBox(height: 8),
                          ],
                          if (resume.data.projectExperience.isNotEmpty) ...[
                            _sectionTitle('项目经验'),
                            ...resume.data.projectExperience.map(_projectItem),
                            const SizedBox(height: 8),
                          ],
                          if (resume.data.education.isNotEmpty) ...[
                            _sectionTitle('教育背景'),
                            ...resume.data.education.map(_eduItem),
                            const SizedBox(height: 8),
                          ],
                          if (resume.data.skills.any((s) {
                            final items = s['items'];
                            return items is List && items.isNotEmpty;
                          })) ...[
                            _sectionTitle('专业技能'),
                            ...resume.data.skills.where((s) {
                              final items = s['items'];
                              return items is List && items.isNotEmpty;
                            }).map((s) {
                              final items = (s['items'] as List).map((e) => e.toString()).join(' · ');
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Text('${s['category'] ?? '技能'}: $items'),
                              );
                            }),
                          ],
                          const SizedBox(height: 12),
                          Text(
                            '模板: ${resume.templateId ?? 'default'} · 简流',
                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(width: 4, height: 16, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _workItem(Map<String, dynamic> w) {
    final desc = (w['description'] as List?)?.map((e) => e.toString()) ?? const [];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${w['company'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
          Text(
            '${w['position'] ?? ''} · ${w['startDate'] ?? ''} - ${w['endDate'] ?? ''}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
          ...desc.map((d) => Text('• $d')),
        ],
      ),
    );
  }

  Widget _projectItem(Map<String, dynamic> p) {
    final desc = (p['description'] as List?)?.map((e) => e.toString()) ?? const [];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${p['name'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
          Text(
            '${p['role'] ?? ''} · ${p['startDate'] ?? ''} - ${p['endDate'] ?? ''}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
          ...desc.map((d) => Text('• $d')),
        ],
      ),
    );
  }

  Widget _eduItem(Map<String, dynamic> e) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${e['school'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
          Text(
            '${e['degree'] ?? ''} · ${e['major'] ?? ''}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _line(String label, String value) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text('$label：$value', style: const TextStyle(color: AppColors.textMuted)),
    );
  }
}
