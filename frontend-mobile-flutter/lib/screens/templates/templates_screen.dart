import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/resume_provider.dart';
import '../../providers/template_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/feature_widgets.dart';

class TemplatesScreen extends StatefulWidget {
  const TemplatesScreen({super.key});

  @override
  State<TemplatesScreen> createState() => _TemplatesScreenState();
}

class _TemplatesScreenState extends State<TemplatesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TemplateProvider>().fetchList();
    });
  }

  Future<void> _use(String templateId, String name) async {
    final resume = await context.read<ResumeProvider>().create(name, templateId: templateId);
    if (resume != null && mounted) {
      context.replace('/resume/${resume.id}/edit');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('创建失败')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TemplateProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('模板库')),
      body: provider.isLoading && provider.templates.isEmpty
          ? const LoadingView(message: '加载模板…')
          : provider.templates.isEmpty
              ? const Center(child: Text('暂无模板'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.templates.length,
                  itemBuilder: (context, index) {
                    final tpl = provider.templates[index];
                    return TemplateCard(
                      name: tpl.name,
                      description: tpl.description,
                      onUse: () => _use(tpl.id, tpl.name),
                    );
                  },
                ),
    );
  }
}
