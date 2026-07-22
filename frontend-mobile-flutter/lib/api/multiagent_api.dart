import '../api/api_client.dart';
import '../models/resume.dart';

class MultiagentApi {
  MultiagentApi(this._client);

  final ApiClient _client;

  Future<Map<String, dynamic>> optimize({
    int? resumeId,
    ResumeData? resumeData,
    List<String>? optimizationFocus,
    String? mode,
    String? targetLanguage,
  }) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/multiagent/optimize',
      method: 'POST',
      body: {
        if (resumeId != null) 'resumeId': resumeId,
        if (resumeData != null) 'resumeData': resumeData.toJson(),
        if (optimizationFocus != null) 'optimizationFocus': optimizationFocus,
        if (mode != null) 'mode': mode,
        if (targetLanguage != null) 'targetLanguage': targetLanguage,
      },
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> analyzeMatch({
    int? resumeId,
    ResumeData? resumeData,
    required String jobDescription,
  }) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/multiagent/analyze-match',
      method: 'POST',
      body: {
        if (resumeId != null) 'resumeId': resumeId,
        if (resumeData != null) 'resumeData': resumeData.toJson(),
        'jobDescription': jobDescription,
      },
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return res.data ?? {};
  }
}
