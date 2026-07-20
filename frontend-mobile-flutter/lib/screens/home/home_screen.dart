import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/feature_widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('你好', style: TextStyle(color: Colors.grey)),
                        Text(
                          auth.user?.username ?? AppConfig.appName,
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const CircleAvatar(child: Icon(Icons.notifications_none)),
                  ],
                ),
              ),
              HeroCard(onCreatePress: () => context.push('/templates')),
              QuickActions(
                onAi: () => context.push('/ai'),
                onWorkflow: () => context.go('/workflow'),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                child: Text('产品亮点', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      '对接 Nest 真实 API：简历 CRUD、模板、工作流执行与 AI 优化，与 Web / Expo 端能力对齐。',
                      style: TextStyle(color: Colors.grey, height: 1.5),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
