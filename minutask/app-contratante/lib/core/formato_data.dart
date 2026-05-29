/// Formatação de data/hora para exibição (pt-BR).
class FormatoData {
  static String dataCurta(DateTime local) {
    final d = local.day.toString().padLeft(2, '0');
    final m = local.month.toString().padLeft(2, '0');
    final a = local.year;
    return '$d/$m/$a';
  }

  static String horaCurta(DateTime local) {
    final h = local.hour.toString().padLeft(2, '0');
    final min = local.minute.toString().padLeft(2, '0');
    return '$h:$min';
  }

  static String agendadoDeIso(dynamic iso) {
    if (iso == null || iso.toString().isEmpty) return '';
    try {
      final local = DateTime.parse(iso.toString()).toLocal();
      return '${dataCurta(local)} às ${horaCurta(local)}';
    } catch (_) {
      return '';
    }
  }

  static DateTime combinar(DateTime data, int hora, int minuto) {
    return DateTime(data.year, data.month, data.day, hora, minuto);
  }

  static String paraApi(DateTime local) {
    return local.toUtc().toIso8601String();
  }
}
