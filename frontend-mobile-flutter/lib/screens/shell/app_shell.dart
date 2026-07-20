import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../resumes/resumes_screen.dart';
import '../workflow/workflow_screen.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: '首页'),
          NavigationDestination(icon: Icon(Icons.account_tree_outlined), selectedIcon: Icon(Icons.account_tree), label: '工作流'),
          NavigationDestination(icon: Icon(Icons.description_outlined), selectedIcon: Icon(Icons.description), label: '我的'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: '个人'),
        ],
      ),
    );
  }
}

class TabHomeScreen extends HomeScreen {
  const TabHomeScreen({super.key});
}

class TabWorkflowScreen extends WorkflowScreen {
  const TabWorkflowScreen({super.key});
}

class TabResumesScreen extends ResumesScreen {
  const TabResumesScreen({super.key});
}

class TabProfileScreen extends ProfileScreen {
  const TabProfileScreen({super.key});
}
