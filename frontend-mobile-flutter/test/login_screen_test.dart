import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_mobile_flutter/screens/auth/login_screen.dart';
import 'package:frontend_mobile_flutter/providers/auth_provider.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('LoginScreen renders form fields', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ChangeNotifierProvider(
          create: (_) => AuthProvider(),
          child: const LoginScreen(),
        ),
      ),
    );

    expect(find.text('欢迎回来'), findsOneWidget);
    expect(find.text('登录'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
