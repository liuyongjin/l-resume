import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'api/ai_api.dart';
import 'api/resumes_api.dart';
import 'api/templates_api.dart';
import 'api/workflows_api.dart';
import 'config/app_config.dart';
import 'providers/auth_provider.dart';
import 'providers/resume_provider.dart';
import 'providers/template_provider.dart';
import 'providers/workflow_provider.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class JianflowApp extends StatefulWidget {
  const JianflowApp({super.key});

  @override
  State<JianflowApp> createState() => _JianflowAppState();
}

class _JianflowAppState extends State<JianflowApp> {
  late final AuthProvider _authProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _router = createRouter(_authProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _authProvider.bootstrap();
    });
  }

  @override
  Widget build(BuildContext context) {
    final client = _authProvider.client;
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider(create: (_) => ResumeProvider(ResumesApi(client))),
        ChangeNotifierProvider(create: (_) => TemplateProvider(TemplatesApi(client))),
        ChangeNotifierProvider(create: (_) => WorkflowProvider(WorkflowsApi(client))),
        Provider(create: (_) => AiApi(client)),
      ],
      child: MaterialApp.router(
        title: AppConfig.appName,
        theme: AppTheme.light,
        routerConfig: _router,
      ),
    );
  }
}
