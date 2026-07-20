import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/workflow.dart';
import '../../providers/workflow_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common_widgets.dart';

class WorkflowRunScreen extends StatefulWidget {
  const WorkflowRunScreen({super.key, required this.id});

  final int id;

  @override
  State<WorkflowRunScreen> createState() => _WorkflowRunScreenState();
}

class _WorkflowRunScreenState extends State<WorkflowRunScreen> {
  final _targetRole = TextEditingController();
  bool _running = false;
  List<WorkflowStepLog> _steps = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkflowProvider>().fetchOne(widget.id);
    });
  }

  @override
  void dispose() {
    _targetRole.dispose();
    super.dispose();
  }

  Future<void> _run() async {
    if (_targetRole.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请填写目标岗位')),
      );
      return;
    }
    setState(() {
      _running = true;
      _steps = [];
    });
    final provider = context.read<WorkflowProvider>();
    final result = await provider.execute(
      widget.id,
      {
        'targetRole': _targetRole.text.trim(),
        'templateIds': ['frontendEngineer'],
        'outputLanguages': ['zh'],
        'saveToDatabase': true,
        'idempotencyKey': 'flutter-${DateTime.now().millisecondsSinceEpoch}',
      },
      onProgress: (logs) {
        if (mounted) setState(() => _steps = logs);
      },
    );
    setState(() => _running = false);
    if (!mounted || result == null) return;
    if (result['status'] == 'failed') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['errorMessage']?.toString() ?? '执行失败')),
      );
      return;
    }
    final saved = (result['savedResumes'] as List<dynamic>? ?? []);
    final resumeId = saved.isNotEmpty ? saved.first['id'] : null;
    context.push('/workflow/complete?resumeId=$resumeId');
  }

  Color _stepColor(String status) {
    switch (status) {
      case 'completed':
        return AppColors.success;
      case 'running':
        return AppColors.primary;
      case 'failed':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkflowProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('执行工作流')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _targetRole,
            decoration: const InputDecoration(
              labelText: '目标岗位',
              hintText: '例如：前端工程师',
            ),
          ),
          const SizedBox(height: 16),
          PrimaryButton(
            label: _running ? '执行中…' : '开始执行',
            loading: _running,
            onPressed: _running ? null : _run,
          ),
          const SizedBox(height: 24),
          if (_steps.isNotEmpty) ...[
            const Text('执行步骤', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ..._steps.map(
              (s) => ListTile(
                leading: Icon(Icons.circle, size: 12, color: _stepColor(s.status)),
                title: Text(s.message ?? s.stepKey),
                subtitle: Text(s.status),
              ),
            ),
          ],
          if (provider.error != null) ErrorBanner(message: provider.error!),
        ],
      ),
    );
  }
}

class WorkflowCompleteScreen extends StatelessWidget {
  const WorkflowCompleteScreen({super.key, this.resumeId});

  final int? resumeId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('执行完成')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.check_circle, color: AppColors.success, size: 72),
            const SizedBox(height: 16),
            const Text('工作流执行成功', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const Spacer(),
            if (resumeId != null)
              PrimaryButton(
                label: '查看简历',
                onPressed: () => context.push('/resume/$resumeId/preview'),
              ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.go('/'),
              child: const Text('返回首页'),
            ),
          ],
        ),
      ),
    );
  }
}
