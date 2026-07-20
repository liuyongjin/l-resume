import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_mobile_flutter/providers/auth_provider.dart';
import 'package:frontend_mobile_flutter/api/api_client.dart';
import 'package:frontend_mobile_flutter/api/auth_api.dart';
import 'package:frontend_mobile_flutter/services/token_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';

void main() {
  group('AuthProvider', () {
    test('login success updates session', () async {
      final storage = InMemoryTokenStorage();
      final client = ApiClient(
        httpClient: MockClient((request) async {
          expect(request.url.path, endsWith('/auth/login'));
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'token': 'tok',
                'user': {
                  'username': 'alice',
                  'email': 'a@b.com',
                  'createdAt': '2026-01-01',
                },
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }),
        tokenStorage: storage,
        baseUrl: 'http://127.0.0.1:3001/api',
      );
      final auth = AuthProvider(client: client, authApi: AuthApi(client));
      final ok = await auth.login('13800000000', '123456');
      expect(ok, isTrue);
      expect(auth.isLoggedIn, isTrue);
      expect(auth.user?.username, 'alice');
      expect(await storage.getToken(), 'tok');
    });

    test('login failure sets error', () async {
      final client = ApiClient(
        httpClient: MockClient((request) async {
          return http.Response(
            jsonEncode({
              'success': false,
              'error': {'code': 2004, 'message': '密码错误'},
            }),
            401,
            headers: {'content-type': 'application/json'},
          );
        }),
        tokenStorage: InMemoryTokenStorage(),
        baseUrl: 'http://127.0.0.1:3001/api',
      );
      final auth = AuthProvider(client: client, authApi: AuthApi(client));
      final ok = await auth.login('13800000000', 'bad');
      expect(ok, isFalse);
      expect(auth.error, '密码错误');
    });
  });
}
