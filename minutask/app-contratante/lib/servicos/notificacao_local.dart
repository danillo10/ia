import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

/// Notificações de chat e eventos para o contratante (Android/iOS).
class NotificacaoLocal {
  NotificacaoLocal._();
  static final NotificacaoLocal instancia = NotificacaoLocal._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  final AudioPlayer _audio = AudioPlayer();
  bool _pronto = false;

  static const _canalChat = AndroidNotificationChannel(
    'minutask_chat',
    'Mensagens do chat',
    description: 'Avisos quando o trabalhador envia mensagem',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  static const _canalPedido = AndroidNotificationChannel(
    'minutask_pedidos',
    'Pedidos',
    description: 'Aceite de pedidos e atualizações',
    importance: Importance.high,
    playSound: true,
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
      final androidPlugin = _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      await androidPlugin?.createNotificationChannel(_canalChat);
      await androidPlugin?.createNotificationChannel(_canalPedido);
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
    required AndroidNotificationChannel canal,
    bool tocarSom = true,
  }) async {
    final android = AndroidNotificationDetails(
      canal.id,
      canal.name,
      channelDescription: canal.description,
      importance: Importance.high,
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
    if (tocarSom) {
      await _tocar('sounds/alerta_chat.wav');
    }
  }

  Future<void> alertaNovaMensagem({
    required int tarefaId,
    required String remetente,
    required String texto,
  }) async {
    await inicializar();
    final preview = texto.length > 80 ? '${texto.substring(0, 80)}...' : texto;
    await _mostrar(
      id: 20000 + (tarefaId % 10000),
      titulo: remetente.isNotEmpty ? remetente : 'Nova mensagem',
      corpo: preview,
      canal: _canalChat,
    );
  }

  Future<void> alertaPedidoAceito({
    required int tarefaId,
    required String descricao,
  }) async {
    await inicializar();
    await _mostrar(
      id: 30000 + (tarefaId % 10000),
      titulo: 'Trabalhador aceitou!',
      corpo: descricao,
      canal: _canalPedido,
    );
  }
}
