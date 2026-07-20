import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/common_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    if (_phone.text.trim().isEmpty || _password.text.isEmpty) {
      auth.setError('请填写手机号和密码');
      return;
    }
    final ok = await auth.login(_phone.text.trim(), _password.text);
    if (ok && mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Text(
                '欢迎回来',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                '登录简流，管理你的 AI 简历',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 32),
              ErrorBanner(message: auth.error ?? ''),
              AuthTextField(
                label: '手机号',
                controller: _phone,
                keyboardType: TextInputType.phone,
              ),
              AuthTextField(
                label: '密码',
                controller: _password,
                obscureText: true,
              ),
              PrimaryButton(
                label: '登录',
                loading: auth.isLoading,
                onPressed: _submit,
              ),
              TextButton(
                onPressed: () => context.push('/register'),
                child: const Text('没有账号？去注册'),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
