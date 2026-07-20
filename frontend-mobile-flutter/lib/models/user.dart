class AuthUser {
  AuthUser({
    required this.username,
    required this.email,
    required this.createdAt,
  });

  final String username;
  final String email;
  final String createdAt;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class AuthResult {
  AuthResult({required this.user, required this.token});

  final AuthUser user;
  final String token;

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      token: json['token'] as String,
    );
  }
}
