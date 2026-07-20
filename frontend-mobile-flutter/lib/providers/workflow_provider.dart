import 'package:flutter/foundation.dart';

import '../api/workflows_api.dart';
import '../models/workflow.dart';
import '../services/workflow_execution_poll.dart';

class WorkflowProvider extends ChangeNotifier {
  WorkflowProvider(WorkflowsApi api)
      : _api = api,
        _poll = WorkflowExecutionPoll(api);

  final WorkflowsApi _api;
  final WorkflowExecutionPoll _poll;

  List<Workflow> workflows = [];
  Workflow? current;
  bool isLoading = false;
  Map<String, dynamic>? executionResult;
  List<WorkflowStepLog> stepLogs = [];
  String? error;

  Future<void> fetchList() async {
    isLoading = true;
    notifyListeners();
    try {
      workflows = await _api.list();
    } catch (_) {
      error = '加载工作流失败';
    }
    isLoading = false;
    notifyListeners();
  }

  Future<Workflow?> fetchDefault() async {
    isLoading = true;
    notifyListeners();
    try {
      current = await _api.getDefault();
      isLoading = false;
      notifyListeners();
      return current;
    } catch (_) {
      isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<Workflow?> fetchOne(int id) async {
    isLoading = true;
    notifyListeners();
    try {
      current = await _api.getGraph(id);
      isLoading = false;
      notifyListeners();
      return current;
    } catch (_) {
      isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<Map<String, dynamic>?> execute(
    int id,
    Map<String, dynamic> payload, {
    void Function(List<WorkflowStepLog> logs)? onProgress,
  }) async {
    isLoading = true;
    executionResult = null;
    stepLogs = [];
    notifyListeners();
    try {
      final start = await _api.execute(id, payload);
      executionResult = start;
      final groupId = start['executionGroupId'] as String?;
      if (groupId == null || groupId.isEmpty) {
        throw Exception('启动失败');
      }
      final result = await _poll.poll(
        groupId,
        onProgress: (logs, _) {
          stepLogs = logs;
          onProgress?.call(logs);
          notifyListeners();
        },
      );
      stepLogs = result.stepLogs;
      isLoading = false;
      notifyListeners();
      return {
        'status': result.status,
        'savedResumes': result.savedResumes.map((e) => {
              'id': e.id,
              'title': e.title,
              'templateId': e.templateId,
              'lang': e.lang,
            }).toList(),
        'errorMessage': result.errorMessage,
      };
    } catch (e) {
      error = e.toString();
      isLoading = false;
      notifyListeners();
      return null;
    }
  }
}
