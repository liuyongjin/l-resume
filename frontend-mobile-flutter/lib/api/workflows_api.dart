import '../api/api_client.dart';
import '../models/workflow.dart';

class WorkflowsApi {
  WorkflowsApi(this._client);

  final ApiClient _client;

  Future<List<Workflow>> list() async {
    final res = await _client.request<List<Workflow>>(
      '/workflows',
      fromJsonT: (json) => (json as List<dynamic>)
          .whereType<Map>()
          .map((e) => Workflow.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
    );
    return res.data ?? [];
  }

  Future<Workflow> getDefault() async {
    final res = await _client.request<Workflow>(
      '/workflows/default',
      fromJsonT: (json) => Workflow.fromJson(Map<String, dynamic>.from(json as Map)),
    );
    return res.data!;
  }

  Future<Workflow> getGraph(int id) async {
    final res = await _client.request<Workflow>(
      '/workflows/$id/graph',
      fromJsonT: (json) => Workflow.fromJson(Map<String, dynamic>.from(json as Map)),
    );
    return res.data!;
  }

  Future<Map<String, dynamic>> execute(
    int id,
    Map<String, dynamic> payload,
  ) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/workflows/$id/execute',
      method: 'POST',
      body: payload,
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> getExecutionLogs(String groupId) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/workflows/executions/$groupId',
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }
}
