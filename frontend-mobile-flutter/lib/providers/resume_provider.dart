import 'package:flutter/foundation.dart';

import '../api/api_exception.dart';
import '../api/resumes_api.dart';
import '../models/resume.dart';
import '../utils/resume_defaults.dart';

class ResumeProvider extends ChangeNotifier {
  ResumeProvider(ResumesApi api) : _api = api;

  final ResumesApi _api;

  List<Resume> resumes = [];
  int total = 0;
  Resume? current;
  bool isLoading = false;
  String? error;

  Future<void> fetchList({int page = 1}) async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final res = await _api.list(page: page, limit: 50);
      resumes = res.items;
      total = res.total;
    } on ApiException catch (e) {
      error = e.message;
    } catch (_) {
      error = '加载失败';
    }
    isLoading = false;
    notifyListeners();
  }

  Future<Resume?> fetchOne(int id) async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      current = await _api.get(id);
      isLoading = false;
      notifyListeners();
      return current;
    } on ApiException catch (e) {
      error = e.message;
    } catch (_) {
      error = '加载失败';
    }
    isLoading = false;
    notifyListeners();
    return null;
  }

  Future<Resume?> create(String title, {String? templateId}) async {
    try {
      final resume = await _api.create(
        title: title,
        data: emptyResumeData(),
        style: defaultResumeStyle(),
        templateId: templateId,
        source: templateId != null ? 'template' : 'manual',
      );
      resumes = [resume, ...resumes];
      total += 1;
      notifyListeners();
      return resume;
    } catch (_) {
      return null;
    }
  }

  Future<bool> update(
    int id, {
    String? title,
    ResumeData? data,
    ResumeStyle? style,
    String? expectedUpdatedAt,
  }) async {
    try {
      final updated = await _api.update(
        id,
        title: title,
        data: data,
        style: style,
        expectedUpdatedAt: expectedUpdatedAt,
      );
      resumes = resumes.map((r) => r.id == id ? updated : r).toList();
      if (current?.id == id) current = updated;
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> remove(int id) async {
    try {
      await _api.delete(id);
      resumes = resumes.where((r) => r.id != id).toList();
      total = resumes.length;
      if (current?.id == id) current = null;
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }
}
