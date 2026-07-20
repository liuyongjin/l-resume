import '../api/api_client.dart';
import '../models/template.dart';

class TemplatesApi {
  TemplatesApi(this._client);

  final ApiClient _client;

  Future<TemplateListResponse> list({int page = 1, int limit = 20}) async {
    final res = await _client.request<TemplateListResponse>(
      '/templates?page=$page&limit=$limit',
      fromJsonT: (json) => TemplateListResponse.fromJson(json),
    );
    return res.data!;
  }

  Future<TemplateItem> get(String id) async {
    final res = await _client.request<TemplateItem>(
      '/templates/$id',
      fromJsonT: (json) =>
          TemplateItem.fromJson(Map<String, dynamic>.from(json as Map)),
    );
    return res.data!;
  }
}
