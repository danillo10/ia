import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

/// Alertas sonoros + notificações locais (Android/iOS).
class NotificacaoLocal {
  NotificacaoLocal._();
  static final NotificacaoLocal instancia = NotificacaoLocal._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  final AudioPlayer _audio = AudioPlayer();
  bool _pronto = false;

  static const _canalServicos = AndroidNotificationChannel(
    'minutask_novos_servicos',
    'Novos serviços',
    description: 'Alerta quando chega um microjob',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  Future<void> inicializar() async {
    if (_pronto) return;

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      await Permission.notification.request();
    }

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      await _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_canalServicos);
    }

    await _audio.setReleaseMode(ReleaseMode.stop);
    _pronto = true;
  }

  Future<void> _tocar(String asset) async {
    try {
      await _audio.stop();
      await _audio.play(AssetSource(asset));
    } catch (_) {}
  }

  Future<void> _mostrar({
    required int id,
    required String titulo,
    required String corpo,
    required String canalAndroid,
    String? somAsset,
  }) async {
    final android = AndroidNotificationDetails(
      canalAndroid,
      canalAndroid == _canalServicos.id ? _canalServicos.name : 'Mensagens',
      channelDescription: corpo,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
    );
    const ios = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    await _plugin.show(
      id,
      titulo,
      corpo,
      NotificationDetails(android: android, iOS: ios),
    );
    if (somAsset != null) {
      await _tocar(somAsset);
    }
  }

  Future<void> alertaNovoServico({
    required int tarefaId,
    required String descricao,
    required double? valor,
  }) async {
    await inicializar();
    final valorTxt = valor != null ? 'R\$ $valor' : '';
    await _mostrar(
      id: 10000 + (tarefaId % 10000),
      titulo: 'Novo serviço disponível!',
      corpo: valorTxt.isNotEmpty ? '$descricao · $valorTxt' : descricao,
      canalAndroid: _canalServicos.id,
      somAsset: 'sounds/alerta_servico.wav',
    );
  }
}
