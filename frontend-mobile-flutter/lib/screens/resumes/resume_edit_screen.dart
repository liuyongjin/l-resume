import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/resume.dart';
import '../../providers/resume_provider.dart';
import '../../widgets/common_widgets.dart';

class ResumeEditScreen extends StatefulWidget {
  const ResumeEditScreen({super.key, required this.id});

  final int id;

  @override
  State<ResumeEditScreen> createState() => _ResumeEditScreenState();
}

class _ResumeEditScreenState extends State<ResumeEditScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  late TextEditingController _title;
  late TextEditingController _name;
  late TextEditingController _position;
  late TextEditingController _phone;
  late TextEditingController _email;
  late TextEditingController _city;
  late TextEditingController _summary;
  bool _saving = false;
  ResumeData? _draft;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
    _title = TextEditingController();
    _name = TextEditingController();
    _position = TextEditingController();
    _phone = TextEditingController();
    _email = TextEditingController();
    _city = TextEditingController();
    _summary = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final resume = await context.read<ResumeProvider>().fetchOne(widget.id);
      if (resume != null && mounted) _bind(resume);
    });
  }

  void _bind(Resume resume) {
    _title.text = resume.title;
    _name.text = resume.data.basicInfo.name;
    _position.text = resume.data.basicInfo.position;
    _phone.text = resume.data.basicInfo.phone;
    _email.text = resume.data.basicInfo.email;
    _city.text = resume.data.basicInfo.city;
    _summary.text = resume.data.professionalSummary;
    _draft = ResumeData.fromJson(resume.data.toJson());
    setState(() {});
  }

  @override
  void dispose() {
    _tabs.dispose();
    _title.dispose();
    _name.dispose();
    _position.dispose();
    _phone.dispose();
    _email.dispose();
    _city.dispose();
    _summary.dispose();
    super.dispose();
  }

  void _syncBasicIntoDraft() {
    final draft = _draft;
    if (draft == null) return;
    draft.basicInfo.name = _name.text.trim();
    draft.basicInfo.position = _position.text.trim();
    draft.basicInfo.phone = _phone.text.trim();
    draft.basicInfo.email = _email.text.trim();
    draft.basicInfo.city = _city.text.trim();
    draft.professionalSummary = _summary.text.trim();
  }

  Future<void> _save() async {
    final provider = context.read<ResumeProvider>();
    final current = provider.current;
    final draft = _draft;
    if (current == null || draft == null) return;
    _syncBasicIntoDraft();
    setState(() => _saving = true);
    final ok = await provider.update(
      widget.id,
      title: _title.text.trim(),
      data: draft,
      expectedUpdatedAt: current.updatedAt,
    );
    setState(() => _saving = false);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
    }
  }

  String _newId(String prefix) =>
      '$prefix-${DateTime.now().millisecondsSinceEpoch}';

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ResumeProvider>();
    final resume = provider.current;
    final draft = _draft;

    return Scaffold(
      appBar: AppBar(
        title: const Text('编辑简历'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('保存'),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: const [
            Tab(text: '基本信息'),
            Tab(text: '工作经历'),
            Tab(text: '项目经验'),
            Tab(text: '教育背景'),
            Tab(text: '专业技能'),
          ],
        ),
      ),
      body: provider.isLoading && resume == null
          ? const LoadingView()
          : resume == null || draft == null
              ? const Center(child: Text('简历不存在'))
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                      child: TextField(
                        controller: _title,
                        decoration: const InputDecoration(labelText: '简历标题'),
                      ),
                    ),
                    Expanded(
                      child: TabBarView(
                        controller: _tabs,
                        children: [
                          _basicTab(),
                          _workTab(draft),
                          _projectTab(draft),
                          _educationTab(draft),
                          _skillsTab(draft),
                        ],
                      ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: OutlinedButton.icon(
                          onPressed: () => context.push('/ai?resumeId=${resume.id}'),
                          icon: const Icon(Icons.auto_awesome),
                          label: const Text('AI 优化此简历'),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _basicTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(controller: _name, decoration: const InputDecoration(labelText: '姓名')),
        const SizedBox(height: 12),
        TextField(controller: _position, decoration: const InputDecoration(labelText: '期望职位')),
        const SizedBox(height: 12),
        TextField(controller: _phone, decoration: const InputDecoration(labelText: '手机')),
        const SizedBox(height: 12),
        TextField(controller: _email, decoration: const InputDecoration(labelText: '邮箱')),
        const SizedBox(height: 12),
        TextField(controller: _city, decoration: const InputDecoration(labelText: '城市')),
        const SizedBox(height: 12),
        TextField(
          controller: _summary,
          maxLines: 5,
          decoration: const InputDecoration(labelText: '个人总结'),
        ),
      ],
    );
  }

  Widget _workTab(ResumeData draft) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...List.generate(draft.workExperience.length, (i) {
          final w = draft.workExperience[i];
          return _sectionCard(
            title: '工作经历 ${i + 1}',
            onDelete: () => setState(() => draft.workExperience.removeAt(i)),
            children: [
              _mapField(w, 'company', '公司'),
              _mapField(w, 'position', '职位'),
              _mapField(w, 'startDate', '开始'),
              _mapField(w, 'endDate', '结束'),
              _mapListField(w, 'description', '描述（每行一条）'),
            ],
          );
        }),
        OutlinedButton.icon(
          onPressed: () => setState(() {
            draft.workExperience.add({
              'id': _newId('work'),
              'company': '',
              'position': '',
              'startDate': '',
              'endDate': '',
              'description': <String>[],
            });
          }),
          icon: const Icon(Icons.add),
          label: const Text('添加工作经历'),
        ),
      ],
    );
  }

  Widget _projectTab(ResumeData draft) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...List.generate(draft.projectExperience.length, (i) {
          final p = draft.projectExperience[i];
          return _sectionCard(
            title: '项目 ${i + 1}',
            onDelete: () => setState(() => draft.projectExperience.removeAt(i)),
            children: [
              _mapField(p, 'name', '项目名称'),
              _mapField(p, 'role', '角色'),
              _mapField(p, 'startDate', '开始'),
              _mapField(p, 'endDate', '结束'),
              _mapListField(p, 'description', '描述（每行一条）'),
            ],
          );
        }),
        OutlinedButton.icon(
          onPressed: () => setState(() {
            draft.projectExperience.add({
              'id': _newId('proj'),
              'name': '',
              'role': '',
              'startDate': '',
              'endDate': '',
              'description': <String>[],
            });
          }),
          icon: const Icon(Icons.add),
          label: const Text('添加项目'),
        ),
      ],
    );
  }

  Widget _educationTab(ResumeData draft) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...List.generate(draft.education.length, (i) {
          final e = draft.education[i];
          return _sectionCard(
            title: '教育 ${i + 1}',
            onDelete: () => setState(() => draft.education.removeAt(i)),
            children: [
              _mapField(e, 'school', '学校'),
              _mapField(e, 'major', '专业'),
              _mapField(e, 'degree', '学历'),
              _mapField(e, 'startDate', '开始'),
              _mapField(e, 'endDate', '结束'),
              _mapField(e, 'description', '说明'),
            ],
          );
        }),
        OutlinedButton.icon(
          onPressed: () => setState(() {
            draft.education.add({
              'id': _newId('edu'),
              'school': '',
              'major': '',
              'degree': '',
              'startDate': '',
              'endDate': '',
              'description': '',
            });
          }),
          icon: const Icon(Icons.add),
          label: const Text('添加教育经历'),
        ),
      ],
    );
  }

  Widget _skillsTab(ResumeData draft) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...List.generate(draft.skills.length, (i) {
          final s = draft.skills[i];
          final items = (s['items'] as List?)?.map((e) => e.toString()).toList() ?? [];
          return _sectionCard(
            title: '技能分组 ${i + 1}',
            onDelete: () => setState(() => draft.skills.removeAt(i)),
            children: [
              _mapField(s, 'category', '分类'),
              TextFormField(
                initialValue: items.join(', '),
                decoration: const InputDecoration(labelText: '技能（逗号分隔）'),
                onChanged: (v) {
                  s['items'] = v
                      .split(RegExp('[,，]'))
                      .map((e) => e.trim())
                      .where((e) => e.isNotEmpty)
                      .toList();
                },
              ),
            ],
          );
        }),
        OutlinedButton.icon(
          onPressed: () => setState(() {
            draft.skills.add({
              'id': _newId('skill'),
              'category': '技能',
              'items': <String>[],
            });
          }),
          icon: const Icon(Icons.add),
          label: const Text('添加技能分组'),
        ),
      ],
    );
  }

  Widget _sectionCard({
    required String title,
    required VoidCallback onDelete,
    required List<Widget> children,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold))),
                IconButton(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                ),
              ],
            ),
            ...children.map(
              (c) => Padding(padding: const EdgeInsets.only(bottom: 8), child: c),
            ),
          ],
        ),
      ),
    );
  }

  Widget _mapField(Map<String, dynamic> map, String key, String label) {
    return TextFormField(
      initialValue: '${map[key] ?? ''}',
      decoration: InputDecoration(labelText: label),
      onChanged: (v) => map[key] = v,
    );
  }

  Widget _mapListField(Map<String, dynamic> map, String key, String label) {
    final list = (map[key] as List?)?.map((e) => e.toString()).toList() ?? [];
    return TextFormField(
      initialValue: list.join('\n'),
      maxLines: 4,
      decoration: InputDecoration(labelText: label),
      onChanged: (v) {
        map[key] = v
            .split('\n')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      },
    );
  }
}
