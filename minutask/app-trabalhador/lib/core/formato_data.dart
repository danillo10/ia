class FormatoData {
  static String agendadoDeIso(dynamic iso) {
    if (iso == null || iso.toString().isEmpty) return '';
    try {
      final local = DateTime.parse(iso.toString()).toLocal();
      final d = local.day.toString().padLeft(2, '0');
      final m = local.month.toString().padLeft(2, '0');
      final h = local.hour.toString().padLeft(2, '0');
      final min = local.minute.toString().padLeft(2, '0');
      return '$d/$m/${local.year} às $h:$min';
    } catch (_) {
      return '';
    }
  }
}
