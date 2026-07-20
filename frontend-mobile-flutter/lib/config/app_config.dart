class AppConfig {
  /// 与 Expo `EXPO_PUBLIC_API_URL` 一致，默认本机 Nest API。
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:3001/api',
  );

  static const appName = '简流';
}
