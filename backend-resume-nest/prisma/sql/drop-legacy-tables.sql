-- 删除旧版及当前 jf_ 前缀业务表（重建前执行）
-- 用法: npx prisma db execute --file prisma/sql/drop-legacy-tables.sql

DROP TABLE IF EXISTS
  resume_ai_chat_messages,
  resume_ai_chat_sessions,
  workflow_executions,
  workflow_execution_runs,
  workflow_connections,
  workflow_nodes,
  workflows,
  resumes,
  llm_models,
  templates,
  users,
  audit_logs,
  jf_resume_ai_message,
  jf_resume_ai_session,
  jf_workflow_step,
  jf_workflow_run,
  jf_workflow_edge,
  jf_workflow_node,
  jf_workflow,
  jf_resume,
  jf_resume_template,
  jf_llm_model,
  jf_user
CASCADE;

SELECT 'legacy business tables dropped' AS result;
