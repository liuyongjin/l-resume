import 'package:flutter/foundation.dart';

import '../api/templates_api.dart';
import '../models/template.dart';

class TemplateProvider extends ChangeNotifier {
  TemplateProvider(TemplatesApi api) : _api = api;

  final TemplatesApi _api;

  List<TemplateItem> templates = [];
  bool isLoading = false;
  String? error;

  Future<void> fetchList() async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final res = await _api.list(limit: 50);
      templates = res.items;
    } catch (_) {
      error = '加载模板失败';
    }
    isLoading = false;
    notifyListeners();
  }
}
