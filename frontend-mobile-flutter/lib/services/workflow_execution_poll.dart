import '../api/workflows_api.dart';
import '../models/workflow.dart';

class WorkflowPollResult {
  WorkflowPollResult({
    required this.status,
    required this.savedResumes,
    required this.stepLogs,
    this.errorMessage,
  });

  final String status;
  final List<SavedResumeSummary> savedResumes;
  final List<WorkflowStepLog> stepLogs;
  final String? errorMessage;
}

class WorkflowExecutionPoll {
  WorkflowExecutionPoll(this._api);

  final WorkflowsApi _api;

  Future<WorkflowPollResult> poll(
    String groupId, {
    void Function(List<WorkflowStepLog> logs, double? progress)? onProgress,
    int maxAttempts = 600,
    Duration interval = const Duration(seconds: 1),
  }) async {
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      final data = await _api.getExecutionLogs(groupId);
      final rawLogs = data['stepLogs'] as List<dynamic>? ?? [];
      final logs = rawLogs
          .whereType<Map>()
          .map((e) => WorkflowStepLog.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final progress = (data['progress'] as num?)?.toDouble();
      onProgress?.call(logs, progress);

      final status = data['status'] as String?;
      if (status == 'completed') {
        final saved = (data['savedResumes'] as List<dynamic>? ?? [])
            .whereType<Map>()
            .map((e) => SavedResumeSummary.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        return WorkflowPollResult(
          status: 'completed',
          savedResumes: saved,
          stepLogs: logs,
        );
      }
      if (status == 'failed') {
        return WorkflowPollResult(
          status: 'failed',
          savedResumes: const [],
          stepLogs: logs,
          errorMessage: data['errorMessage'] as String? ?? '执行失败',
        );
      }
      await Future<void>.delayed(interval);
    }
    return WorkflowPollResult(
      status: 'failed',
      savedResumes: const [],
      stepLogs: const [],
      errorMessage: '执行超时',
    );
  }
}
