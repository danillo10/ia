import 'package:flutter/material.dart';
import '../componentes/c9_fundo.dart';
import '../componentes/logo_minutask.dart';
import '../servicos/api_service.dart';
import '../tema/app_theme.dart';
import 'login_tela.dart';
import 'painel_tela.dart';

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
    final logado = await _api.restaurarSessaoSalva(papelEsperado: 'trabalhador');
    if (!mounted) return;
    setState(() {
      _destino = logado ? PainelTela(api: _api) : LoginTela(api: _api);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_destino == null) {
      return Scaffold(
        body: C9Fundo(
          variante: MinutaskVariante.trabalhador,
          child: const Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LogoMinutask(variante: MinutaskVariante.trabalhador, tamanho: 48),
                SizedBox(height: 24),
                CircularProgressIndicator(color: MinutaskCores.ciano),
              ],
            ),
          ),
        ),
      );
    }
    return _destino!;
  }
}
