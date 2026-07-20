import '../api/api_client.dart';

class AiApi {
  AiApi(this._client);

  final ApiClient _client;

  Future<Map<String, dynamic>> optimize({
    int? resumeId,
    required String section,
    required String content,
  }) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/ai/optimize',
      method: 'POST',
      body: {
        if (resumeId != null) 'resumeId': resumeId,
        'section': section,
        'content': content,
      },
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> resumeChat({
    required int resumeId,
    required String message,
    String? sessionId,
    Map<String, dynamic>? resumeData,
  }) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/ai/resume-chat',
      method: 'POST',
      body: {
        'resumeId': resumeId,
        'message': message,
        if (sessionId != null) 'sessionId': sessionId,
        if (resumeData != null) 'resumeData': resumeData,
      },
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> match({
    required int resumeId,
    required String jobDescription,
  }) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/ai/match',
      method: 'POST',
      body: {
        'resumeId': resumeId,
        'jobDescription': jobDescription,
      },
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }
}
