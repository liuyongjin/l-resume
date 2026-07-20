import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/ai_api.dart';
import '../../providers/auth_provider.dart';
import '../../providers/resume_provider.dart';
import '../../widgets/common_widgets.dart';

class AiHubScreen extends StatefulWidget {
  const AiHubScreen({super.key, this.resumeId});

  final int? resumeId;

  @override
  State<AiHubScreen> createState() => _AiHubScreenState();
}

class _AiHubScreenState extends State<AiHubScreen> {
  final _input = TextEditingController();
  String? _result;
  bool _loading = false;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _optimize() async {
    if (_input.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入待优化内容')),
      );
      return;
    }
    setState(() {
      _loading = true;
      _result = null;
    });
    try {
      final client = context.read<AuthProvider>().client;
      final api = AiApi(client);
      final data = await api.optimize(
        resumeId: widget.resumeId,
        section: 'professionalSummary',
        content: _input.text.trim(),
      );
      setState(() {
        _result = data['optimizedContent']?.toString() ??
            data['content']?.toString() ??
            data.toString();
      });
    } catch (e) {
      setState(() => _result = e.toString());
    }
    setState(() => _loading = false);
  }

  Future<void> _loadResumeSummary() async {
    if (widget.resumeId == null) return;
    final resume = await context.read<ResumeProvider>().fetchOne(widget.resumeId!);
    if (resume != null && mounted) {
      _input.text = resume.data.professionalSummary;
      setState(() {});
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.resumeId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadResumeSummary());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI 优化')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.resumeId != null)
            Text('简历 ID: ${widget.resumeId}', style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 12),
          TextField(
            controller: _input,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: '待优化内容',
              hintText: '粘贴个人总结或经历描述…',
            ),
          ),
          const SizedBox(height: 16),
          PrimaryButton(label: '开始优化', loading: _loading, onPressed: _optimize),
          if (_result != null) ...[
            const SizedBox(height: 24),
            const Text('优化结果', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(_result!),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
