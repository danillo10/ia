import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'servicos/notificacao_local.dart';
import 'telas/tela_inicial_auth.dart';
import 'tema/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificacaoLocal.instancia.inicializar();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const MinutaskTrabalhadorApp());
}

class MinutaskTrabalhadorApp extends StatelessWidget {
  const MinutaskTrabalhadorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Minutask Trabalhador',
      debugShowCheckedModeBanner: false,
      theme: temaMinutask(MinutaskVariante.trabalhador),
      home: const TelaInicialAuth(),
    );
  }
}
