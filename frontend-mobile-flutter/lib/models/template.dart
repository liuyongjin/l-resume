class TemplateItem {
  TemplateItem({
    required this.id,
    required this.name,
    this.description,
    this.config = const {},
  });

  final String id;
  final String name;
  final String? description;
  final Map<String, dynamic> config;

  factory TemplateItem.fromJson(Map<String, dynamic> json) {
    return TemplateItem(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      config: Map<String, dynamic>.from((json['config'] as Map?) ?? {}),
    );
  }
}

class TemplateListResponse {
  TemplateListResponse({required this.items, required this.total});

  final List<TemplateItem> items;
  final int total;

  factory TemplateListResponse.fromJson(dynamic json) {
    if (json is List) {
      final items = json
          .whereType<Map>()
          .map((e) => TemplateItem.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      return TemplateListResponse(items: items, total: items.length);
    }
    final map = Map<String, dynamic>.from(json as Map);
    final raw = map['items'] as List<dynamic>? ?? [];
    return TemplateListResponse(
      items: raw
          .whereType<Map>()
          .map((e) => TemplateItem.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      total: (map['total'] as num?)?.toInt() ?? raw.length,
    );
  }
}
