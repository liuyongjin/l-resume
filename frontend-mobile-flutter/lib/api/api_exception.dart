class ApiException implements Exception {
  ApiException(this.message, {this.code, this.status});

  final String message;
  final int? code;
  final int? status;

  @override
  String toString() => message;
}

class ApiResponse<T> {
  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
  });

  final bool success;
  final T? data;
  final String? message;
  final ApiErrorBody? error;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] == true,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'] as T?,
      message: json['message'] as String?,
      error: json['error'] != null
          ? ApiErrorBody.fromJson(json['error'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ApiErrorBody {
  ApiErrorBody({required this.code, required this.message});

  final int code;
  final String message;

  factory ApiErrorBody.fromJson(Map<String, dynamic> json) {
    return ApiErrorBody(
      code: (json['code'] as num?)?.toInt() ?? 0,
      message: json['message'] as String? ?? '请求失败',
    );
  }
}
