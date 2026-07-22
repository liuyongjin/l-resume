import '../api/api_client.dart';
import '../models/resume.dart';

class ResumesApi {
  ResumesApi(this._client);

  final ApiClient _client;

  Future<ResumeListResponse> list({int page = 1, int limit = 20}) async {
    final res = await _client.request<ResumeListResponse>(
      '/resumes?page=$page&limit=$limit',
      fromJsonT: (json) => ResumeListResponse.fromJson(json),
    );
    return res.data!;
  }

  Future<Resume> get(int id) async {
    final res = await _client.request<Resume>(
      '/resumes/$id',
      fromJsonT: (json) => Resume.fromJson(Map<String, dynamic>.from(json as Map)),
    );
    return res.data!;
  }

  Future<Resume> create({
    required String title,
    required ResumeData data,
    ResumeStyle? style,
    String? templateId,
    String source = 'manual',
  }) async {
    final res = await _client.request<Resume>(
      '/resumes',
      method: 'POST',
      body: {
        'title': title,
        'data': data.toJson(),
        'style': (style ?? ResumeStyle()).toJson(),
        if (templateId != null) 'templateId': templateId,
        'source': source,
      },
      fromJsonT: (json) => Resume.fromJson(Map<String, dynamic>.from(json as Map)),
    );
    return res.data!;
  }

  Future<Resume> update(
    int id, {
    String? title,
    ResumeData? data,
    ResumeStyle? style,
    String? templateId,
    String? expectedUpdatedAt,
  }) async {
    final res = await _client.request<Resume>(
      '/resumes/$id',
      method: 'PUT',
      body: {
        if (title != null) 'title': title,
        if (data != null) 'data': data.toJson(),
        if (style != null) 'style': style.toJson(),
        if (templateId != null) 'templateId': templateId,
        if (expectedUpdatedAt != null) 'expectedUpdatedAt': expectedUpdatedAt,
      },
      fromJsonT: (json) => Resume.fromJson(Map<String, dynamic>.from(json as Map)),
    );
    return res.data!;
  }

  Future<void> delete(int id) async {
    await _client.request('/resumes/$id', method: 'DELETE');
  }

  Future<Resume> duplicate(int id) async {
    final res = await _client.request<Resume>(
      '/resumes/$id/duplicate',
      method: 'POST',
      fromJsonT: (json) {
        final map = Map<String, dynamic>.from(json as Map);
        final resumeJson = map['resume'] ?? map;
        return Resume.fromJson(Map<String, dynamic>.from(resumeJson as Map));
      },
    );
    return res.data!;
  }
}
