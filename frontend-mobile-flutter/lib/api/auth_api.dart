import '../api/api_client.dart';
import '../models/user.dart';

class AuthApi {
  AuthApi(this._client);

  final ApiClient _client;

  Future<AuthResult> login(String phone, String password) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/auth/login',
      method: 'POST',
      body: {'phone': phone, 'password': password},
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return AuthResult.fromJson(res.data!);
  }

  Future<AuthResult> register(
    String username,
    String email,
    String password,
  ) async {
    final res = await _client.request<Map<String, dynamic>>(
      '/auth/register',
      method: 'POST',
      body: {'username': username, 'email': email, 'password': password},
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return AuthResult.fromJson(res.data!);
  }

  Future<AuthUser> profile() async {
    final res = await _client.request<Map<String, dynamic>>(
      '/auth/profile',
      fromJsonT: (json) => Map<String, dynamic>.from(json as Map),
    );
    return AuthUser.fromJson(res.data!);
  }

  Future<void> logout() async {
    await _client.request('/auth/logout', method: 'POST');
  }
}
