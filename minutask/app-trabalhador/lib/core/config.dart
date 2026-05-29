/// Alinhado com minutask/.env → MINUTASK_API_BASE / MINUTASK_API_WS
class Config {
  static const String apiBase = String.fromEnvironment(
    'MINUTASK_API_BASE',
    defaultValue: 'http://localhost:8001/api/v1',
  );
  static const String apiWs = String.fromEnvironment(
    'MINUTASK_API_WS',
    defaultValue: 'ws://localhost:8001',
  );
  static const String apiOrigin = String.fromEnvironment(
    'MINUTASK_API_ORIGIN',
    defaultValue: 'http://localhost:8001',
  );

  static String wsTrabalhador(int id) => '$apiWs/ws/trabalhador/$id';
  static String wsTarefa(int tarefaId) => '$apiWs/ws/tarefas/$tarefaId';

  static String urlMidia(String path) {
    if (path.isEmpty) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$apiOrigin$path';
  }
}
