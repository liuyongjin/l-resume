import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../services/token_storage.dart';
import 'api_exception.dart';

typedef UnauthorizedCallback = void Function();

class ApiClient {
  ApiClient({
    http.Client? httpClient,
    TokenStorageBase? tokenStorage,
    String? baseUrl,
  })  : _http = httpClient ?? http.Client(),
        _tokenStorage = tokenStorage ?? TokenStorage(),
        _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  final http.Client _http;
  final TokenStorageBase _tokenStorage;
  final String _baseUrl;

  static const _authErrorCodes = {2001, 2002, 2003};
  UnauthorizedCallback? onUnauthorized;

  Future<String?> getToken() => _tokenStorage.getToken();

  Future<void> setToken(String token) => _tokenStorage.setToken(token);

  Future<void> clearToken() => _tokenStorage.clearToken();

  Future<ApiResponse<T>> request<T>(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    T Function(dynamic json)? fromJsonT,
  }) async {
    final token = await _tokenStorage.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    http.Response response;
    try {
      final uri = Uri.parse('$_baseUrl$path');
      final encoded = body == null ? null : jsonEncode(body);
      final methodUpper = method.toUpperCase();
      if (methodUpper == 'POST') {
        response = await _http.post(uri, headers: headers, body: encoded);
      } else if (methodUpper == 'PUT') {
        response = await _http.put(uri, headers: headers, body: encoded);
      } else if (methodUpper == 'PATCH') {
        response = await _http.patch(uri, headers: headers, body: encoded);
      } else if (methodUpper == 'DELETE') {
        response = await _http.delete(uri, headers: headers);
      } else {
        response = await _http.get(uri, headers: headers);
      }
    } catch (_) {
      throw ApiException('网络异常，请稍后重试');
    }

    Map<String, dynamic> json;
    try {
      json = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException('请求失败 (${response.statusCode})', status: response.statusCode);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final code = (json['error'] as Map<String, dynamic>?)?['code'] as int?;
      final message = (json['error'] as Map<String, dynamic>?)?['message'] as String? ??
          json['message'] as String? ??
          '请求失败 (${response.statusCode})';
      if (response.statusCode == 401 ||
          (code != null && _authErrorCodes.contains(code))) {
        await _tokenStorage.clearToken();
        onUnauthorized?.call();
      }
      throw ApiException(message, code: code, status: response.statusCode);
    }

    return ApiResponse.fromJson(json, fromJsonT);
  }
}
