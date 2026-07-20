import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_mobile_flutter/models/workflow.dart';
import 'package:frontend_mobile_flutter/services/workflow_execution_poll.dart';
import 'package:frontend_mobile_flutter/api/workflows_api.dart';
import 'package:frontend_mobile_flutter/api/api_client.dart';
import 'package:frontend_mobile_flutter/services/token_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';

void main() {
  group('WorkflowExecutionPoll', () {
    test('returns completed with saved resumes', () async {
      var calls = 0;
      final client = ApiClient(
        httpClient: MockClient((request) async {
          calls += 1;
          if (calls == 1) {
            return http.Response(
              jsonEncode({
                'success': true,
                'data': {
                  'status': 'running',
                  'stepLogs': [
                    {'stepKey': 'plan', 'status': 'running', 'stepName': '规划'},
                  ],
                },
              }),
              200,
              headers: {'content-type': 'application/json'},
            );
          }
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'status': 'completed',
                'stepLogs': [
                  {'stepKey': 'plan', 'status': 'completed', 'stepName': '规划'},
                ],
                'savedResumes': [
                  {
                    'id': 9,
                    'title': '简历',
                    'templateId': 'frontendEngineer',
                    'lang': 'zh',
                  },
                ],
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }),
        tokenStorage: InMemoryTokenStorage(),
        baseUrl: 'http://127.0.0.1:3001/api',
      );

      final poll = WorkflowExecutionPoll(WorkflowsApi(client));
      final progress = <List<WorkflowStepLog>>[];
      final result = await poll.poll(
        'group-1',
        interval: const Duration(milliseconds: 1),
        onProgress: (logs, _) => progress.add(logs),
      );

      expect(result.status, 'completed');
      expect(result.savedResumes.first.id, 9);
      expect(progress, isNotEmpty);
      expect(calls, greaterThanOrEqualTo(2));
    });
  });
}
