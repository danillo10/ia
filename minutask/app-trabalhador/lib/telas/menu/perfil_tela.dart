import 'package:flutter/material.dart';
import '../../componentes/c9_card.dart';
import '../../componentes/c9_fundo.dart';
import '../../servicos/api_service.dart';
import '../../tema/app_theme.dart';

class PerfilTela extends StatelessWidget {
  final ApiService api;
  final MinutaskVariante variante;

  const PerfilTela({
    super.key,
    required this.api,
    required this.variante,
  });

  String _rotuloVerificacao(String? status) {
    switch (status) {
      case 'aprovado':
        return 'Verificado';
      case 'pendente':
        return 'Verificação pendente';
      case 'rejeitado':
        return 'Verificação rejeitada';
      default:
        return 'Não verificado';
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = api.usuario ?? {};
    final nome = u['nome']?.toString() ?? 'Usuário';
    final email = u['email']?.toString() ?? '—';
    final telefone = u['telefone']?.toString();
    final verificacao = _rotuloVerificacao(u['verificacao_status']?.toString());
    final papel = variante == MinutaskVariante.contratante ? 'Contratante' : 'Trabalhador';

    return Scaffold(
      body: C9Fundo(
        variante: variante,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    Text(
                      'Minha conta',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Center(
                      child: Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          gradient: MinutaskCores.gradienteMarca(variante),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Center(
                          child: Text(
                            nome.isNotEmpty ? nome[0].toUpperCase() : '?',
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Text(
                        nome,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    Center(
                      child: Text(
                        papel,
                        style: TextStyle(color: MinutaskCores.corAccent(variante), fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 24),
                    C9Card(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _linha(Icons.mail_outline_rounded, 'E-mail', email),
                          if (telefone != null && telefone.isNotEmpty) ...[
                            const Divider(height: 24),
                            _linha(Icons.phone_outlined, 'Telefone', telefone),
                          ],
                          const Divider(height: 24),
                          _linha(Icons.verified_outlined, 'Status', verificacao),
                          const Divider(height: 24),
                          _linha(Icons.tag_outlined, 'ID', '#${api.usuarioId ?? '—'}'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Em breve você poderá editar foto, endereço e dados de pagamento por aqui.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
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

  Widget _linha(IconData icone, String rotulo, String valor) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icone, size: 20, color: MinutaskCores.textoMuted),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(rotulo, style: const TextStyle(fontSize: 12, color: MinutaskCores.textoMuted)),
              const SizedBox(height: 2),
              Text(valor, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}
