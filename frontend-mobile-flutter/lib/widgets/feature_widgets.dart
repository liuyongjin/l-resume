import 'package:flutter/material.dart';

import '../../models/resume.dart';
import '../../theme/app_colors.dart';
import '../../utils/resume_defaults.dart';

class ResumeListCard extends StatelessWidget {
  const ResumeListCard({
    super.key,
    required this.resume,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  final Resume resume;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                resume.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                getResumeDisplayName(resume.data),
                style: const TextStyle(color: AppColors.textMuted),
              ),
              const SizedBox(height: 4),
              Text(
                '更新于 ${formatDateTime(resume.updatedAt)}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  TextButton(onPressed: onEdit, child: const Text('编辑')),
                  TextButton(onPressed: onDelete, child: const Text('删除')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TemplateCard extends StatelessWidget {
  const TemplateCard({
    super.key,
    required this.name,
    required this.description,
    required this.onUse,
  });

  final String name;
  final String? description;
  final VoidCallback onUse;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            if (description != null && description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(description!, style: const TextStyle(color: AppColors.textMuted)),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(onPressed: onUse, child: const Text('使用模板')),
            ),
          ],
        ),
      ),
    );
  }
}

class HeroCard extends StatelessWidget {
  const HeroCard({super.key, required this.onCreatePress});

  final VoidCallback onCreatePress;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'AI 智能简历',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            '从模板快速创建，或用工作流一键生成多语言简历。',
            style: TextStyle(color: Color(0xFFEDE9FE)),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
            ),
            onPressed: onCreatePress,
            child: const Text('从模板创建'),
          ),
        ],
      ),
    );
  }
}

class QuickActions extends StatelessWidget {
  const QuickActions({super.key, required this.onAi, required this.onWorkflow});

  final VoidCallback onAi;
  final VoidCallback onWorkflow;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _ActionTile(
              icon: Icons.auto_awesome,
              label: 'AI 优化',
              onTap: onAi,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _ActionTile(
              icon: Icons.account_tree_outlined,
              label: '智能执行',
              onTap: onWorkflow,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
