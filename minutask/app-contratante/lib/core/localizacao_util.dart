import 'package:geolocator/geolocator.dart';

/// Obtém coordenadas com timeout e mensagens claras (web/desktop/mobile).
class LocalizacaoUtil {
  static Future<({double lat, double lon})?> obter({
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final servicoAtivo = await Geolocator.isLocationServiceEnabled();
    if (!servicoAtivo) {
      throw Exception('Ative o GPS/localização do dispositivo');
    }

    var permissao = await Geolocator.checkPermission();
    if (permissao == LocationPermission.denied) {
      permissao = await Geolocator.requestPermission();
    }
    if (permissao == LocationPermission.denied) {
      throw Exception('Permita a localização no navegador ou informe lat/lon manualmente');
    }
    if (permissao == LocationPermission.deniedForever) {
      throw Exception('Localização bloqueada — informe lat/lon manualmente');
    }

    final pos = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.medium,
      timeLimit: timeout,
    );
    return (lat: pos.latitude, lon: pos.longitude);
  }
}
