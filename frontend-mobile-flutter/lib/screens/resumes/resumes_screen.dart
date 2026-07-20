import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/resume_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/feature_widgets.dart';

class ResumesScreen extends StatefulWidget {
  const ResumesScreen({super.key});

  @override
  State<ResumesScreen> createState() => _ResumesScreenState();
}

class _ResumesScreenState extends State<ResumesScreen> {
  final _query = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ResumeProvider>().fetchList();
    });
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final provider = context.read<ResumeProvider>();
    final resume = await provider.create('新简历');
    if (resume != null && mounted) {
      context.push('/resume/${resume.id}/edit');
    }
  }

  Future<void> _delete(int id, String title) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('删除简历'),
        content: Text('确定删除「$title」？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除')),
        ],
      ),
    );
    if (ok == true && mounted) {
      await context.read<ResumeProvider>().remove(id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ResumeProvider>();
    final q = _query.text.trim().toLowerCase();
    final items = q.isEmpty
        ? provider.resumes
        : provider.resumes.where((r) => r.title.toLowerCase().contains(q)).toList();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('我的简历', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _query,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      hintText: '搜索简历标题',
                    ),
                  ),
                ],
              ),
            ),
            if (provider.error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ErrorBanner(message: provider.error!),
              ),
            Expanded(
              child: provider.isLoading && provider.resumes.isEmpty
                  ? const LoadingView(message: '加载简历…')
                  : items.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.inbox_outlined, size: 48, color: Colors.grey),
                              const SizedBox(height: 12),
                              const Text('还没有简历'),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () => context.push('/templates'),
                                child: const Text('从模板创建'),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () => provider.fetchList(),
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                            itemCount: items.length,
                            itemBuilder: (context, index) {
                              final resume = items[index];
                              return ResumeListCard(
                                resume: resume,
                                onTap: () => context.push('/resume/${resume.id}/preview'),
                                onEdit: () => context.push('/resume/${resume.id}/edit'),
                                onDelete: () => _delete(resume.id, resume.title),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _create,
        child: const Icon(Icons.add),
      ),
    );
  }
}
