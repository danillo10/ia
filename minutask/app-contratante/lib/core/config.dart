/// Alinhado com minutask/.env → MINUTASK_API_BASE / MINUTASK_API_WS
/// Android emulador: http://10.0.2.2:8001/api/v1
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
  static String wsTarefa(int tarefaId) => '$apiWs/ws/tarefas/$tarefaId';
  static String wsContratante(int id) => '$apiWs/ws/contratante/$id';

  static String urlMidia(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$apiOrigin$path';
  }
}
