import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_mobile_flutter/api/api_client.dart';
import 'package:frontend_mobile_flutter/api/auth_api.dart';
import 'package:frontend_mobile_flutter/providers/auth_provider.dart';
import 'package:frontend_mobile_flutter/services/token_storage.dart';

/// 直连 Nest API 的联调测试（无 mock）。
/// 需 backend-resume-nest 已启动，默认 http://127.0.0.1:3001/api
void main() {
  const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:3001/api',
  );
  const phone = String.fromEnvironment('TEST_PHONE', defaultValue: '');
  const password = String.fromEnvironment('TEST_PASSWORD', defaultValue: '');

  group('Nest API 联调', () {
    test('API reachable (profile without token fails)', () async {
      final client = ApiClient(
        baseUrl: baseUrl,
        tokenStorage: InMemoryTokenStorage(),
      );
      try {
        await client.request('/auth/profile');
        fail('expected auth error');
      } catch (e) {
        expect(e.toString(), isNotEmpty);
      }
    });

    test('login + profile + resumes list', () async {
      if (phone.isEmpty || password.isEmpty) {
        return;
      }
      final storage = InMemoryTokenStorage();
      final client = ApiClient(baseUrl: baseUrl, tokenStorage: storage);
      final auth = AuthProvider(client: client, authApi: AuthApi(client));

      final ok = await auth.login(phone, password);
      expect(ok, isTrue, reason: auth.error);
      expect(auth.isLoggedIn, isTrue);

      final profile = await AuthApi(client).profile();
      expect(profile.username, isNotEmpty);

      final resumes = await client.request(
        '/resumes?page=1&limit=5',
        fromJsonT: (json) => json,
      );
      expect(resumes.success, isTrue);
    }, skip: phone.isEmpty || password.isEmpty);
  });
}
