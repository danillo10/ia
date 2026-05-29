import 'package:flutter/material.dart';
import '../componentes/c9_fundo.dart';
import '../componentes/logo_minutask.dart';
import '../servicos/api_service.dart';
import '../tema/app_theme.dart';
import 'dashboard_contratante_tela.dart';
import 'login_tela.dart';

/// Verifica sessão salva ao abrir o app e redireciona para home ou login.
class TelaInicialAuth extends StatefulWidget {
  const TelaInicialAuth({super.key});

  @override
  State<TelaInicialAuth> createState() => _TelaInicialAuthState();
}

class _TelaInicialAuthState extends State<TelaInicialAuth> {
  final _api = ApiService();
  Widget? _destino;

  @override
  void initState() {
    super.initState();
    _resolverDestino();
  }

  Future<void> _resolverDestino() async {
    final logado = await _api.restaurarSessaoSalva(papelEsperado: 'contratante');
    if (!mounted) return;
    setState(() {
      _destino = logado
          ? DashboardContratanteTela(api: _api)
          : LoginTela(api: _api);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_destino == null) {
      return Scaffold(
        body: C9Fundo(
          variante: MinutaskVariante.contratante,
          child: const Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LogoMinutask(variante: MinutaskVariante.contratante, tamanho: 48),
                SizedBox(height: 24),
                CircularProgressIndicator(color: MinutaskCores.azul),
              ],
            ),
          ),
        ),
      );
    }
    return _destino!;
  }
}
