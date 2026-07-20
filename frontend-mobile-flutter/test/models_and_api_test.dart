import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_mobile_flutter/api/api_client.dart';
import 'package:frontend_mobile_flutter/api/api_exception.dart';
import 'package:frontend_mobile_flutter/models/resume.dart';
import 'package:frontend_mobile_flutter/models/template.dart';
import 'package:frontend_mobile_flutter/models/user.dart';
import 'package:frontend_mobile_flutter/models/workflow.dart';
import 'package:frontend_mobile_flutter/services/token_storage.dart';
import 'package:frontend_mobile_flutter/utils/resume_defaults.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  group('Resume models', () {
    test('emptyResumeData has basic fields', () {
      final data = emptyResumeData();
      expect(data.basicInfo.name, '');
      expect(data.skills, isNotEmpty);
    });

    test('Resume.fromJson parses nested data', () {
      final resume = Resume.fromJson({
        'id': 1,
        'title': '测试简历',
        'data': {
          'basicInfo': {'name': '张三', 'position': '工程师'},
        },
        'style': {'theme': '#7C3AED'},
        'updatedAt': '2026-01-01T00:00:00.000Z',
      });
      expect(resume.id, 1);
      expect(resume.data.basicInfo.name, '张三');
      expect(getResumeDisplayName(resume.data), '张三');
    });

    test('ResumeListResponse supports array payload', () {
      final res = ResumeListResponse.fromJson([
        {
          'id': 2,
          'title': 'A',
          'data': {'basicInfo': {}},
          'style': {},
          'updatedAt': '',
        },
      ]);
      expect(res.items.length, 1);
      expect(res.total, 1);
    });
  });

  group('AuthUser', () {
    test('fromJson', () {
      final user = AuthUser.fromJson({
        'username': 'test',
        'email': 'a@b.com',
        'createdAt': '2026-01-01',
      });
      expect(user.username, 'test');
    });
  });

  group('Workflow models', () {
    test('WorkflowStepLog.fromJson', () {
      final log = WorkflowStepLog.fromJson({
        'stepKey': 'plan',
        'status': 'completed',
        'stepName': '规划',
      });
      expect(log.stepKey, 'plan');
      expect(log.message, '规划');
    });
  });

  group('Template models', () {
    test('TemplateListResponse.fromJson object', () {
      final res = TemplateListResponse.fromJson({
        'items': [
          {'id': 't1', 'name': '工程师'},
        ],
        'total': 1,
      });
      expect(res.items.first.id, 't1');
    });
  });

  group('ApiClient', () {
    test('login success parses response', () async {
      final client = ApiClient(
        httpClient: MockClient((request) async {
          expect(request.url.path, '/api/auth/login');
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'token': 'jwt-token',
                'user': {
                  'username': 'u',
                  'email': 'e',
                  'createdAt': '2026',
                },
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }),
        tokenStorage: InMemoryTokenStorage(),
        baseUrl: 'http://127.0.0.1:3001/api',
      );

      final res = await client.request<Map<String, dynamic>>(
        '/auth/login',
        method: 'POST',
        body: {'phone': '13800000000', 'password': '123456'},
        fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
      );

      expect(res.success, isTrue);
      expect(res.data?['token'], 'jwt-token');
    });

    test('401 clears token and triggers unauthorized callback', () async {
      final storage = InMemoryTokenStorage();
      await storage.setToken('old');
      var unauthorized = false;

      final client = ApiClient(
        httpClient: MockClient((request) async {
          return http.Response(
            jsonEncode({
              'success': false,
              'error': {'code': 2001, 'message': '未登录'},
            }),
            401,
            headers: {'content-type': 'application/json'},
          );
        }),
        tokenStorage: storage,
        baseUrl: 'http://127.0.0.1:3001/api',
      );
      client.onUnauthorized = () => unauthorized = true;

      await expectLater(
        client.request('/auth/profile'),
        throwsA(isA<ApiException>()),
      );
      expect(await storage.getToken(), isNull);
      expect(unauthorized, isTrue);
    });
  });
}
