import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/resume_provider.dart';
import '../../theme/app_colors.dart';
import '../../utils/resume_defaults.dart';
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

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ResumeProvider>();
    final resume = provider.current;

    return Scaffold(
      appBar: AppBar(title: const Text('简历预览')),
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
                          const Divider(height: 32),
                          if (resume.data.professionalSummary.isNotEmpty) ...[
                            const Text('个人总结', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Text(resume.data.professionalSummary),
                          ],
                        ],
                      ),
                    ),
                  ),
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
