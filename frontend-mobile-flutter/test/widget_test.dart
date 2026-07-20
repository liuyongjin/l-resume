import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_mobile_flutter/utils/resume_defaults.dart';

void main() {
  test('formatDateTime and display name helpers', () {
    expect(formatDateTime(null), '—');
    expect(formatDateTime('2026-07-20T10:00:00.000Z'), startsWith('2026-07-'));
    final data = emptyResumeData();
    expect(getResumeDisplayName(data), '未命名');
    data.basicInfo.position = '前端';
    expect(getResumeDisplayName(data), '前端');
    data.basicInfo.name = '李四';
    expect(getResumeDisplayName(data), '李四');
  });
}
