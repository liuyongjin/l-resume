import 'package:shared_preferences/shared_preferences.dart';

abstract class TokenStorageBase {
  Future<String?> getToken();
  Future<void> setToken(String token);
  Future<void> clearToken();
}

class TokenStorage implements TokenStorageBase {
  static const _key = 'jianflow_access_token';

  @override
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }

  @override
  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, token);
  }

  @override
  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

class InMemoryTokenStorage implements TokenStorageBase {
  String? _token;

  @override
  Future<void> clearToken() async => _token = null;

  @override
  Future<String?> getToken() async => _token;

  @override
  Future<void> setToken(String token) async => _token = token;
}
