import 'package:flutter/material.dart';
import '../componentes/c9_botao_gradiente.dart';
import '../componentes/c9_card.dart';
import '../componentes/c9_fundo.dart';
import '../componentes/chip_mvp.dart';
import '../componentes/logo_minutask.dart';
import '../componentes/painel_auth_lateral.dart';
import '../core/credenciais_mvp.dart';
import '../servicos/api_service.dart';
import '../servicos/sessao_armazenamento.dart';
import '../tema/app_theme.dart';
import 'painel_tela.dart';

class LoginTela extends StatefulWidget {
  final ApiService api;

  const LoginTela({super.key, required this.api});

  @override
  State<LoginTela> createState() => _LoginTelaState();
}

class _LoginTelaState extends State<LoginTela> {
  ApiService get _api => widget.api;
  final _email = TextEditingController();
  final _senha = TextEditingController();
  bool _carregando = false;
  bool _ocultarSenha = true;

  @override
  void initState() {
    super.initState();
    _carregarCredenciaisSalvas();
  }

  Future<void> _carregarCredenciaisSalvas() async {
    final salvas = await SessaoArmazenamento().carregarCredenciais();
    if (!mounted) return;
    if (salvas != null) {
      _email.text = salvas.email;
      _senha.text = salvas.senha;
    } else {
      _email.text = CredenciaisMvp.email;
      _senha.text = CredenciaisMvp.senha;
    }
    setState(() {});
  }

  @override
  void dispose() {
    _email.dispose();
    _senha.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    setState(() => _carregando = true);
    try {
      final res = await _api.entrar(_email.text.trim(), _senha.text);
      final usuario = res['usuario'] as Map<String, dynamic>;
      _api.definirSessao(
        res['access_token'] as String,
        usuario['id'] as int,
        usuario: Map<String, dynamic>.from(usuario),
      );
      await _api.persistirSessao(
        email: _email.text.trim(),
        senha: _senha.text,
      );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => PainelTela(api: _api)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Widget _formulario(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const LogoMinutask(
                variante: MinutaskVariante.trabalhador,
                tamanho: 40,
              ),
              const SizedBox(height: 32),
              Text(
                'Bem-vindo de volta',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(fontSize: 26),
              ),
              const SizedBox(height: 8),
              Text(
                'Entre para receber microjobs',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              const ChipMvp(texto: 'Demo — só tocar em Entrar'),
              const SizedBox(height: 24),
              C9Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _email,
                      decoration: const InputDecoration(
                        labelText: 'E-mail',
                        prefixIcon: Icon(Icons.mail_outline_rounded),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _senha,
                      obscureText: _ocultarSenha,
                      decoration: InputDecoration(
                        labelText: 'Senha',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _ocultarSenha
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: MinutaskCores.textoMuted,
                          ),
                          onPressed: () =>
                              setState(() => _ocultarSenha = !_ocultarSenha),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    C9BotaoGradiente(
                      texto: 'Entrar na plataforma',
                      icone: Icons.arrow_forward_rounded,
                      carregando: _carregando,
                      onPressed: _entrar,
                      variante: MinutaskVariante.trabalhador,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final largo = MediaQuery.sizeOf(context).width >= 900;

    return Scaffold(
      body: C9Fundo(
        variante: MinutaskVariante.trabalhador,
        child: largo
            ? Row(
                children: [
                  Expanded(
                    child: PainelAuthLateral(
                      variante: MinutaskVariante.trabalhador,
                      titulo: 'Trabalhe\n',
                      subtitulo: 'quando quiser',
                      beneficios: const [
                        'Fique online e receba ofertas',
                        'Aceite ou recuse como no Uber',
                        'Qualquer tipo de serviço informal',
                        'Ganhe no seu ritmo',
                      ],
                    ),
                  ),
                  Expanded(child: _formulario(context)),
                ],
              )
            : _formulario(context),
      ),
    );
  }
}
