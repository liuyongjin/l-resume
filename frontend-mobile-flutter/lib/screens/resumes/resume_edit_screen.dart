import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/resume_provider.dart';
import '../../widgets/common_widgets.dart';

class ResumeEditScreen extends StatefulWidget {
  const ResumeEditScreen({super.key, required this.id});

  final int id;

  @override
  State<ResumeEditScreen> createState() => _ResumeEditScreenState();
}

class _ResumeEditScreenState extends State<ResumeEditScreen> {
  late TextEditingController _title;
  late TextEditingController _name;
  late TextEditingController _position;
  late TextEditingController _phone;
  late TextEditingController _email;
  late TextEditingController _summary;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController();
    _name = TextEditingController();
    _position = TextEditingController();
    _phone = TextEditingController();
    _email = TextEditingController();
    _summary = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final resume = await context.read<ResumeProvider>().fetchOne(widget.id);
      if (resume != null && mounted) _bind(resume);
    });
  }

  void _bind(dynamic resume) {
    _title.text = resume.title;
    _name.text = resume.data.basicInfo.name;
    _position.text = resume.data.basicInfo.position;
    _phone.text = resume.data.basicInfo.phone;
    _email.text = resume.data.basicInfo.email;
    _summary.text = resume.data.professionalSummary;
    setState(() {});
  }

  @override
  void dispose() {
    _title.dispose();
    _name.dispose();
    _position.dispose();
    _phone.dispose();
    _email.dispose();
    _summary.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final provider = context.read<ResumeProvider>();
    final current = provider.current;
    if (current == null) return;
    setState(() => _saving = true);
    final data = current.data;
    data.basicInfo.name = _name.text.trim();
    data.basicInfo.position = _position.text.trim();
    data.basicInfo.phone = _phone.text.trim();
    data.basicInfo.email = _email.text.trim();
    data.professionalSummary = _summary.text.trim();
    final ok = await provider.update(
      widget.id,
      title: _title.text.trim(),
      data: data,
      expectedUpdatedAt: current.updatedAt,
    );
    setState(() => _saving = false);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ResumeProvider>();
    final resume = provider.current;

    return Scaffold(
      appBar: AppBar(
        title: const Text('编辑简历'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('保存'),
          ),
        ],
      ),
      body: provider.isLoading && resume == null
          ? const LoadingView()
          : resume == null
              ? const Center(child: Text('简历不存在'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    TextField(controller: _title, decoration: const InputDecoration(labelText: '简历标题')),
                    const SizedBox(height: 12),
                    TextField(controller: _name, decoration: const InputDecoration(labelText: '姓名')),
                    const SizedBox(height: 12),
                    TextField(controller: _position, decoration: const InputDecoration(labelText: '期望职位')),
                    const SizedBox(height: 12),
                    TextField(controller: _phone, decoration: const InputDecoration(labelText: '手机')),
                    const SizedBox(height: 12),
                    TextField(controller: _email, decoration: const InputDecoration(labelText: '邮箱')),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _summary,
                      maxLines: 5,
                      decoration: const InputDecoration(labelText: '个人总结'),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/ai?resumeId=${resume.id}'),
                      icon: const Icon(Icons.auto_awesome),
                      label: const Text('AI 优化此简历'),
                    ),
                  ],
                ),
    );
  }
}
