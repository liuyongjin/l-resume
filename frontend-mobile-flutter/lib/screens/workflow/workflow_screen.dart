import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/workflow_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common_widgets.dart';

class WorkflowScreen extends StatefulWidget {
  const WorkflowScreen({super.key});

  @override
  State<WorkflowScreen> createState() => _WorkflowScreenState();
}

class _WorkflowScreenState extends State<WorkflowScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<WorkflowProvider>();
      provider.fetchList();
      provider.fetchDefault();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkflowProvider>();
    final list = provider.workflows.isNotEmpty
        ? provider.workflows
        : (provider.current != null ? [provider.current!] : <dynamic>[]);

    return Scaffold(
      body: SafeArea(
        child: provider.isLoading && list.isEmpty
            ? const LoadingView(message: '加载工作流…')
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text('工作流', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('智能执行，一键生成多语言简历', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('推荐流程', style: TextStyle(color: Color(0xFFDDD6FE))),
                        SizedBox(height: 8),
                        Text(
                          '默认智能简历生成',
                          style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...list.map((wf) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(wf.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                            if (wf.description != null && wf.description!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(wf.description!, style: const TextStyle(color: Colors.grey)),
                              ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => context.push('/workflow/${wf.id}/run'),
                                    icon: const Icon(Icons.play_arrow),
                                    label: const Text('执行'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
      ),
    );
  }
}
