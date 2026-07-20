class WorkflowNode {
  WorkflowNode({
    required this.id,
    required this.type,
    required this.label,
    this.category,
    this.agentType,
    this.templateId,
    this.config,
    this.position,
  });

  final String id;
  final String type;
  final String label;
  final String? category;
  final String? agentType;
  final String? templateId;
  final Map<String, dynamic>? config;
  final Map<String, dynamic>? position;

  factory WorkflowNode.fromJson(Map<String, dynamic> json) {
    return WorkflowNode(
      id: json['id'] as String? ?? json['nodeId'] as String? ?? '',
      type: json['type'] as String? ?? '',
      label: json['label'] as String? ?? json['name'] as String? ?? '',
      category: json['category'] as String?,
      agentType: json['agentType'] as String?,
      templateId: json['templateId'] as String?,
      config: json['config'] != null
          ? Map<String, dynamic>.from(json['config'] as Map)
          : null,
      position: json['position'] != null
          ? Map<String, dynamic>.from(json['position'] as Map)
          : null,
    );
  }
}

class WorkflowConnection {
  WorkflowConnection({
    required this.id,
    required this.source,
    required this.target,
  });

  final String id;
  final String source;
  final String target;

  factory WorkflowConnection.fromJson(Map<String, dynamic> json) {
    return WorkflowConnection(
      id: json['id'] as String? ?? json['connectionId'] as String? ?? '',
      source: json['source'] as String? ?? json['fromNodeId'] as String? ?? '',
      target: json['target'] as String? ?? json['toNodeId'] as String? ?? '',
    );
  }
}

class Workflow {
  Workflow({
    required this.id,
    required this.name,
    this.description,
    this.nodes = const [],
    this.connections = const [],
    this.status,
  });

  final int id;
  final String name;
  final String? description;
  final List<WorkflowNode> nodes;
  final List<WorkflowConnection> connections;
  final String? status;

  factory Workflow.fromJson(Map<String, dynamic> json) {
    final rawNodes = json['nodes'] as List<dynamic>? ?? [];
    final rawConnections = json['connections'] as List<dynamic>? ?? [];
    return Workflow(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      nodes: rawNodes
          .whereType<Map>()
          .map((e) => WorkflowNode.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      connections: rawConnections
          .whereType<Map>()
          .map((e) => WorkflowConnection.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      status: json['status'] as String?,
    );
  }
}

class WorkflowStepLog {
  WorkflowStepLog({
    required this.stepKey,
    required this.status,
    this.message,
  });

  final String stepKey;
  final String status;
  final String? message;

  factory WorkflowStepLog.fromJson(Map<String, dynamic> json) {
    return WorkflowStepLog(
      stepKey: json['stepKey'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      message: json['message'] as String? ?? json['stepName'] as String?,
    );
  }
}

class SavedResumeSummary {
  SavedResumeSummary({
    required this.id,
    required this.title,
    required this.templateId,
    required this.lang,
  });

  final int id;
  final String title;
  final String templateId;
  final String lang;

  factory SavedResumeSummary.fromJson(Map<String, dynamic> json) {
    return SavedResumeSummary(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      templateId: json['templateId'] as String? ?? '',
      lang: json['lang'] as String? ?? 'zh',
    );
  }
}
