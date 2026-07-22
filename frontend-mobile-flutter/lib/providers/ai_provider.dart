import 'package:flutter/foundation.dart';

import '../api/ai_api.dart';
import '../api/api_exception.dart';
import '../api/multiagent_api.dart';
import '../models/resume.dart';

enum AiMode { polish, match, complete, translate }

class AiSuggestion {
  AiSuggestion({
    required this.id,
    required this.section,
    required this.before,
    required this.after,
  });

  final String id;
  final String section;
  final String before;
  final String after;

  factory AiSuggestion.fromJson(Map<String, dynamic> json, int index) {
    return AiSuggestion(
      id: json['id']?.toString() ?? 's-$index',
      section: json['section']?.toString() ?? 'general',
      before: json['before']?.toString() ?? '',
      after: json['after']?.toString() ??
          json['text']?.toString() ??
          json['description']?.toString() ??
          '',
    );
  }
}

class AiOptimizeResult {
  AiOptimizeResult({
    this.score,
    this.suggestions = const [],
    this.optimizedData,
  });

  final num? score;
  final List<AiSuggestion> suggestions;
  final ResumeData? optimizedData;

  factory AiOptimizeResult.fromJson(Map<String, dynamic> json) {
    final rawSuggestions = json['suggestions'] as List<dynamic>? ?? [];
    ResumeData? data;
    final rawData = json['optimizedData'] ?? json['data'];
    if (rawData is Map) {
      data = ResumeData.fromJson(Map<String, dynamic>.from(rawData));
    }
    return AiOptimizeResult(
      score: json['score'] as num?,
      suggestions: rawSuggestions.asMap().entries.map((e) {
        final item = e.value;
        if (item is String) {
          return AiSuggestion(
            id: 's-${e.key}',
            section: 'general',
            before: '',
            after: item,
          );
        }
        return AiSuggestion.fromJson(
          Map<String, dynamic>.from(item as Map),
          e.key,
        );
      }).toList(),
      optimizedData: data,
    );
  }
}

List<String>? focusForMode(AiMode mode) {
  switch (mode) {
    case AiMode.polish:
      return ['wording', 'impact'];
    case AiMode.complete:
      return ['completeness', 'missing_sections'];
    case AiMode.translate:
      return ['language'];
    case AiMode.match:
      return null;
  }
}

String aiModeLabel(AiMode mode) {
  switch (mode) {
    case AiMode.polish:
      return '智能润色';
    case AiMode.match:
      return '岗位匹配';
    case AiMode.complete:
      return '内容补全';
    case AiMode.translate:
      return '语言润色';
  }
}

List<AiSuggestion> _suggestionsFromMatch(Map<String, dynamic> match) {
  final raw = match['suggestions'] ?? match['gaps'] ?? match['improvements'];
  if (raw is! List) return [];
  return raw.asMap().entries.map((e) {
    final item = e.value;
    if (item is String) {
      return AiSuggestion(
        id: 'm-${e.key}',
        section: 'match',
        before: '',
        after: item,
      );
    }
    final row = Map<String, dynamic>.from(item as Map);
    return AiSuggestion(
      id: row['id']?.toString() ?? 'm-${e.key}',
      section: row['section']?.toString() ?? 'match',
      before: row['before']?.toString() ?? '',
      after: row['after']?.toString() ??
          row['text']?.toString() ??
          row['description']?.toString() ??
          row.toString(),
    );
  }).toList();
}

class AiProvider extends ChangeNotifier {
  AiProvider({
    required AiApi aiApi,
    required MultiagentApi multiagentApi,
  })  : _aiApi = aiApi,
        _multiagentApi = multiagentApi;

  final AiApi _aiApi;
  final MultiagentApi _multiagentApi;

  bool isLoading = false;
  AiOptimizeResult? result;
  String? error;
  AiMode lastMode = AiMode.polish;

  Future<AiOptimizeResult?> optimize(
    int resumeId,
    ResumeData resumeData, {
    AiMode mode = AiMode.polish,
    String? jobDescription,
  }) async {
    isLoading = true;
    error = null;
    result = null;
    lastMode = mode;
    notifyListeners();

    try {
      if (mode == AiMode.match) {
        final jd = jobDescription?.trim() ?? '';
        if (jd.isEmpty) {
          throw ApiException('岗位描述不能为空');
        }
        try {
          final match = await _aiApi.match(
            resumeId: resumeId,
            jobDescription: jd,
          );
          result = AiOptimizeResult(
            score: match['score'] is num
                ? match['score'] as num
                : num.tryParse('${match['matchScore'] ?? 80}') ?? 80,
            suggestions: _suggestionsFromMatch(match),
            optimizedData: resumeData,
          );
        } catch (_) {
          final match = await _multiagentApi.analyzeMatch(
            resumeId: resumeId,
            resumeData: resumeData,
            jobDescription: jd,
          );
          result = AiOptimizeResult(
            score: match['score'] is num
                ? match['score'] as num
                : num.tryParse('${match['matchScore'] ?? 80}') ?? 80,
            suggestions: _suggestionsFromMatch(match),
            optimizedData: resumeData,
          );
        }
        isLoading = false;
        notifyListeners();
        return result;
      }

      final raw = await _multiagentApi.optimize(
        resumeId: resumeId,
        resumeData: resumeData,
        mode: mode.name,
        optimizationFocus: focusForMode(mode),
        targetLanguage: mode == AiMode.translate ? 'en' : null,
      );
      if (raw.isEmpty) {
        throw ApiException('优化结果为空');
      }
      result = AiOptimizeResult.fromJson(raw);
      isLoading = false;
      notifyListeners();
      return result;
    } on ApiException catch (e) {
      error = e.message;
      isLoading = false;
      notifyListeners();
      return null;
    } catch (_) {
      error = '优化失败';
      isLoading = false;
      notifyListeners();
      return null;
    }
  }

  void clear() {
    result = null;
    error = null;
    notifyListeners();
  }
}
