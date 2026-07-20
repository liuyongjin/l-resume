import 'package:flutter/foundation.dart';

import '../api/api_exception.dart';
import '../api/auth_api.dart';
import '../api/api_client.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({
    ApiClient? client,
    AuthApi? authApi,
  }) : _client = client ?? ApiClient() {
    _authApi = authApi ?? AuthApi(_client);
    _client.onUnauthorized = _handleUnauthorized;
  }

  final ApiClient _client;
  late final AuthApi _authApi;

  AuthUser? user;
  bool isLoading = false;
  bool isReady = false;
  String? error;

  bool get isLoggedIn => user != null;

  ApiClient get client => _client;

  void setError(String message) {
    error = message;
    notifyListeners();
  }

  void _handleUnauthorized() {
    user = null;
    notifyListeners();
  }

  Future<void> bootstrap() async {
    final token = await _client.getToken();
    if (token == null || token.isEmpty) {
      isReady = true;
      notifyListeners();
      return;
    }
    try {
      user = await _authApi.profile();
    } catch (_) {
      await _client.clearToken();
      user = null;
    }
    isReady = true;
    notifyListeners();
  }

  Future<bool> login(String phone, String password) async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final result = await _authApi.login(phone, password);
      await _client.setToken(result.token);
      user = result.user;
      isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      error = e.message;
      isLoading = false;
      notifyListeners();
      return false;
    } catch (_) {
      error = '登录失败';
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String username, String email, String password) async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final result = await _authApi.register(username, email, password);
      await _client.setToken(result.token);
      user = result.user;
      isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      error = e.message;
      isLoading = false;
      notifyListeners();
      return false;
    } catch (_) {
      error = '注册失败';
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    isLoading = true;
    notifyListeners();
    try {
      await _authApi.logout();
    } catch (_) {
      // ignore
    }
    await _client.clearToken();
    user = null;
    isLoading = false;
    notifyListeners();
  }
}
