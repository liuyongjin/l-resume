import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/ai/ai_hub_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/resumes/resume_edit_screen.dart';
import '../screens/resumes/resume_preview_screen.dart';
import '../screens/shell/app_shell.dart';
import '../screens/templates/templates_screen.dart';
import '../screens/workflow/workflow_run_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter(AuthProvider auth) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: auth,
    redirect: (context, state) {
      if (!auth.isReady) return null;
      final loggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';
      if (!auth.isLoggedIn && !loggingIn) return '/login';
      if (auth.isLoggedIn && loggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (_, __) => const TabHomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/workflow',
                builder: (_, __) => const TabWorkflowScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/resumes',
                builder: (_, __) => const TabResumesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, __) => const TabProfileScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/templates',
        builder: (_, __) => const TemplatesScreen(),
      ),
      GoRoute(
        path: '/resume/:id/edit',
        builder: (_, state) => ResumeEditScreen(
          id: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/resume/:id/preview',
        builder: (_, state) => ResumePreviewScreen(
          id: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/workflow/:id/run',
        builder: (_, state) => WorkflowRunScreen(
          id: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/workflow/complete',
        builder: (_, state) => WorkflowCompleteScreen(
          resumeId: int.tryParse(state.uri.queryParameters['resumeId'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/ai',
        builder: (_, state) => AiHubScreen(
          resumeId: int.tryParse(state.uri.queryParameters['resumeId'] ?? ''),
        ),
      ),
    ],
  );
}
